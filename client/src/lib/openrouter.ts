import { apiRequest } from "./queryClient";

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
  id: number;
  modelId: string;
  clickCount: number;
  searchCount: number;
  updatedAt: Date;
  percentage: number;
  displayName: string;
}

/**
 * Perform a standard search request across multiple AI models.
 */
export async function searchAI(query: string): Promise<SearchResponse> {
  const response = await apiRequest("POST", "/api/search", { query });
  const data = await response.json();
  return data;
}

export interface SearchStreamEvent {
  type: "search" | "result" | "done" | "error";
  data: any;
}

/**
 * Perform a streaming search request and emit events as results arrive.
 */
export async function searchAIStream(
  query: string,
  onEvent: (event: SearchStreamEvent) => void,
): Promise<SearchResponse> {
  const response = await apiRequest(
    "POST",
    "/api/search",
    { query },
    { headers: { Accept: "text/event-stream" } },
  );

  const contentType = response.headers.get("content-type") || "";

  if (contentType.startsWith("text/event-stream")) {
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let finalData: SearchResponse | null = null;

    while (true) {
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
          const parsed = JSON.parse(data);
          onEvent({ type: event as any, data: parsed });
          if (event === "done") {
            finalData = parsed;
          }
        }
      }
    }

    if (finalData) return finalData;
    throw new Error("Stream ended unexpectedly");
  } else {
    const data: SearchResponse = await response.json();
    onEvent({ type: "search", data: data.search });
    data.results.forEach((r) => onEvent({ type: "result", data: r }));
    onEvent({ type: "done", data });
    return data;
  }
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
