import { apiRequest } from "./queryClient";

// Types for OpenRouter API responses
export interface ModelResponse {
  id: number;
  searchId: number;
  modelId: string;
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

// Search across multiple AI models
export async function searchAI(query: string): Promise<SearchResponse> {
  const response = await apiRequest("POST", "/api/search", { query });
  const data = await response.json();
  return data;
}

// Track when a user clicks on a result
export async function trackResultClick(resultId: number, userId?: number): Promise<void> {
  await apiRequest("POST", "/api/track-click", { 
    resultId,
    userId
  });
}

// Get model performance statistics
export async function getModelStats(): Promise<ModelStats[]> {
  const response = await apiRequest("GET", "/api/model-stats");
  const data = await response.json();
  return data;
}

// Get top performing models
export async function getTopModels(limit: number = 5): Promise<ModelStats[]> {
  const response = await apiRequest("GET", `/api/top-models?limit=${limit}`);
  const data = await response.json();
  return data;
}
