import { apiRequest } from "./queryClient";
import { withRetry, parseError, VistAIError } from "./errorHandling";

// Types for OpenRouter API responses
export interface ModelResponse {
  id: number;
  searchId: number;
  modelId: string;
  snippet?: string;
  content: string;
  title?: string;
  responseTime?: number;
  createdAt: Date;
  modelName?: string; // The shorter display name
}

export interface SearchResponse {
  search: {
    id: number;
    query: string;
    createdAt: Date;
  };
  results: ModelResponse[];
  totalTime: number;
}

export interface ModelStats {
  modelId: string;
  clickCount: number;
  searchCount: number;
  updatedAt: Date;
  percentage: number;
  displayName: string;
}

/**
 * Perform a standard search request across multiple AI models with retry logic.
 */
export async function searchAI(query: string): Promise<SearchResponse> {
  return withRetry(async () => {
    const response = await apiRequest("POST", "/api/search", { query });
    const data = await response.json();
    return data;
  }, {
    maxAttempts: 2, // Only retry once for search requests
    shouldRetry: (error) => error.retryable && error.type !== 'auth',
  });
}

export interface SearchStreamEvent {
  type: "search" | "result" | "done" | "error";
  data: any;
}

/**
 * Perform a streaming search request and emit events as results arrive with enhanced error handling.
 */
export async function searchAIStream(
  query: string,
  onEvent: (event: SearchStreamEvent) => void,
  signal?: AbortSignal,
): Promise<SearchResponse> {
  return withRetry(async () => {
    try {
      const response = await apiRequest(
        "POST",
        "/api/search",
        { query },
        { 
          headers: { Accept: "text/event-stream" },
          signal 
        },
      );

      const contentType = response.headers.get("content-type") || "";

      if (contentType.startsWith("text/event-stream")) {
        let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
        const decoder = new TextDecoder();
        let buffer = "";
        let finalData: SearchResponse | null = null;

        try {
          reader = response.body!.getReader();
          
          while (true) {
            // Check if the request was aborted
            if (signal?.aborted) {
              throw new Error('Request aborted');
            }
            
            const { value, done } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });

            let idx;
            while ((idx = buffer.indexOf("\n\n")) >= 0) {
              const chunk = buffer.slice(0, idx).trim();
              buffer = buffer.slice(idx + 2);
              if (!chunk) continue;

              const lines = chunk.split("\n");
              let event = "message";
              let data = "";
              for (const line of lines) {
                if (line.startsWith("event:")) {
                  event = line.slice(6).trim();
                } else if (line.startsWith("data:")) {
                  data += line.slice(5).trim();
                }
              }

              if (data) {
                try {
                  const parsed = JSON.parse(data);
                  
                  // Handle error events from the stream
                  if (event === "error") {
                    throw new Error(parsed.message || "Stream error occurred");
                  }
                  
                  onEvent({ type: event as any, data: parsed });
                  if (event === "done") {
                    finalData = parsed;
                  }
                } catch (parseError) {
                  console.warn("Failed to parse stream data:", data, parseError);
                  // Continue processing other chunks
                }
              }
            }
          }
        } finally {
          // Ensure reader is properly released even if an error occurs
          if (reader) {
            try {
              reader.releaseLock();
            } catch (releaseError) {
              console.warn("Error releasing stream reader:", releaseError);
            }
          }
        }

        if (finalData) return finalData;
        throw new Error("Stream ended unexpectedly without final data");
      } else {
        const data: SearchResponse = await response.json();
        onEvent({ type: "search", data: data.search });
        data.results.forEach((r) => onEvent({ type: "result", data: r }));
        onEvent({ type: "done", data });
        return data;
      }
    } catch (error) {
      // Don't emit error events for aborted requests
      if (!signal?.aborted) {
        // Emit error event to UI
        const appError = parseError(error);
        onEvent({ type: "error", data: { message: appError.message, type: appError.type } });
      }
      throw error;
    }
  }, {
    maxAttempts: 2,
    shouldRetry: (error) => error.retryable && error.type !== 'auth',
    baseDelay: 2000, // Longer delay for search retries
  });
}

// Track when a user clicks on a result
export interface TrackClickResponse {
  success: boolean;
  click: unknown;
  stats: ModelStats[];
}

/**
 * Record a user click for a result and return updated model stats.
 */
export async function trackResultClick(
  resultId: number,
  userId?: number,
): Promise<ModelStats[]> {
  const res = await apiRequest("POST", "/api/track-click", {
    resultId,
    userId,
  });

  const data: TrackClickResponse = await res.json();
  return data.stats;
}

/**
 * Fetch model performance statistics from the API.
 */
export async function getModelStats(): Promise<ModelStats[]> {
  const response = await apiRequest("GET", "/api/model-stats");
  const data = await response.json();
  return data;
}

/**
 * Fetch the top performing models limited by the given number.
 */
export async function getTopModels(limit: number = 5): Promise<ModelStats[]> {
  const response = await apiRequest("GET", `/api/top-models?limit=${limit}`);
  const data = await response.json();
  return data;
}

export interface UserFeedback {
  id: number;
  resultId: number;
  userId: number;
  feedbackType: 'up' | 'down';
  createdAt: Date;
}

/**
 * Submit user feedback (thumbs up/down) for a result.
 */
export async function submitFeedback(
  resultId: number,
  feedbackType: 'up' | 'down'
): Promise<UserFeedback> {
  const response = await apiRequest("POST", "/api/submit-feedback", {
    resultId,
    feedbackType,
  });
  const data = await response.json();
  return data.feedback;
}

export interface TrendingModel {
  modelId: string;
  displayName: string;
  trendScore: number;
  trending: 'up' | 'down' | 'stable';
  positiveFeedback: number;
  negativeFeedback: number;
  totalSearches: number;
  totalClicks: number;
  periodStart: string;
  periodEnd: string;
}

/**
 * Get trending models based on recent performance.
 */
export async function getTrendingModels(
  period: 'hour' | 'day' | 'week' = 'day',
  limit: number = 10
): Promise<TrendingModel[]> {
  const response = await apiRequest("GET", `/api/trending-models?period=${period}&limit=${limit}`);
  const data = await response.json();
  return data;
}

export interface PersonalizedRanking {
  modelId: string;
  displayName: string;
  rankPosition: number;
  personalScore: number;
  totalResults: number;
  userClicks: number;
  userLikes: number;
  userDislikes: number;
}

/**
 * Get personalized model rankings for the current user.
 */
export async function getPersonalizedRankings(limit: number = 10): Promise<PersonalizedRanking[]> {
  const response = await apiRequest("GET", `/api/personalized-rankings?limit=${limit}`);
  const data = await response.json();
  return data;
}

export interface LeaderboardEntry {
  modelId: string;
  displayName: string;
  rankPosition: number;
  score: number;
  clickCount?: number;
  searchCount?: number;
  positiveFeedback?: number;
  negativeFeedback?: number;
  trendScore?: number;
}

/**
 * Get global model leaderboard.
 */
export async function getLeaderboard(
  type: 'overall' | 'trending' = 'overall',
  limit: number = 20
): Promise<LeaderboardEntry[]> {
  const response = await apiRequest("GET", `/api/leaderboard?type=${type}&limit=${limit}`);
  const data = await response.json();
  return data;
}
