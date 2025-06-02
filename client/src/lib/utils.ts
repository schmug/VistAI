import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Utility functions used across the client application. */

/**
 * Combine class names with Tailwind merge.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Convert milliseconds to a seconds string with two decimals.
 */
export function formatSearchTime(ms: number): string {
  return (ms / 1000).toFixed(2);
}

/**
 * Get the last segment from a model ID.
 */
export function getModelNameFromId(modelId: string): string {
  const parts = modelId.split('/');
  return parts[parts.length - 1];
}

export const models = {
  "gemini-2.0-flash-001": {
    name: "Gemini 2.0 Flash",
    icon: "ri-gemini-line",
    color: "text-[hsl(var(--model-llama))]",
    bg: "bg-[hsl(var(--model-llama)_/_0.2)]",
    border: "border-[hsl(var(--model-llama)_/_0.2)]",
    hoverBorder: "hover:border-[hsl(var(--model-llama)_/_0.5)]",
  },
  "gpt-4o-mini": {
    name: "GPT-4o-mini",
    icon: "ri-openai-fill",
    color: "text-[hsl(var(--model-gpt))]",
    bg: "bg-[hsl(var(--model-gpt)_/_0.2)]",
    border: "border-[hsl(var(--model-gpt)_/_0.2)]",
    hoverBorder: "hover:border-[hsl(var(--model-gpt)_/_0.5)]",
  },
  "claude-3.7-sonnet": {
    name: "Claude 3.7 Sonnet",
    icon: "ri-code-box-line",
    color: "text-[hsl(var(--model-claude))]",
    bg: "bg-[hsl(var(--model-claude)_/_0.2)]",
    border: "border-[hsl(var(--model-claude)_/_0.2)]",
    hoverBorder: "hover:border-[hsl(var(--model-claude)_/_0.5)]",
  },
  "gemini-2.5-pro-preview": {
    name: "Gemini 2.5 Pro Preview",
    icon: "ri-gemini-line",
    color: "text-[hsl(var(--model-mistral))]",
    bg: "bg-[hsl(var(--model-mistral)_/_0.2)]",
    border: "border-[hsl(var(--model-mistral)_/_0.2)]",
    hoverBorder: "hover:border-[hsl(var(--model-mistral)_/_0.5)]",
  },
  "deepseek-chat-v3-0324:free": {
    name: "DeepSeek chat v3 0324",
    icon: "ri-search-2-line",
    color: "text-[hsl(var(--model-mistral))]",
    bg: "bg-[hsl(var(--model-mistral)_/_0.2)]",
    border: "border-[hsl(var(--model-mistral)_/_0.2)]",
    hoverBorder: "hover:border-[hsl(var(--model-mistral)_/_0.5)]",
  }
};

/**
 * Retrieve display information for a given model ID.
 */
export function getModelInfo(modelId: string) {
  const shortName = getModelNameFromId(modelId);
  return models[shortName as keyof typeof models] || {
    name: shortName,
    icon: "ri-robot-line",
    color: "text-primary",
    bg: "bg-primary/20",
    border: "border-primary/20",
    hoverBorder: "hover:border-primary/50",
  };
}

/** Default suggestions used when no history or API data is available. */
const fallbackSuggestions = [
  "Explain quantum computing",
  "Create a workout plan",
  "Compare React vs Vue",
  "Summarize climate change solutions",
  "Recipe for vegan chocolate cake",
];

/**
 * Retrieve recent search history from localStorage.
 * 
 * Returns the most recent search queries in reverse chronological order.
 * Gracefully handles localStorage errors and SSR environments.
 * 
 * @param limit - Maximum number of queries to return (default: 5)
 * @returns Array of recent search queries, empty array if none or on error
 * 
 * @example
 * ```ts
 * const recentSearches = getSearchHistory(3);
 * // Returns: ["latest query", "previous query", "older query"]
 * ```
 */
export function getSearchHistory(limit = 5): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem("searchHistory");
    const arr = JSON.parse(raw || "[]");
    return Array.isArray(arr) ? arr.slice(-limit).reverse() : [];
  } catch {
    return [];
  }
}

/**
 * Store a query in local search history with deduplication.
 * 
 * Adds the query to the beginning of the history list, removing any
 * existing occurrence to prevent duplicates. Maintains a maximum of
 * 20 entries to prevent localStorage bloat.
 * 
 * @param query - Search query to add to history
 * 
 * @example
 * ```ts
 * addToSearchHistory("What is machine learning?");
 * // Query is now at the top of search history
 * ```
 */
export function addToSearchHistory(query: string) {
  if (typeof window === "undefined") return;
  try {
    const arr = getSearchHistory(20);
    const newArr = [query, ...arr.filter((q) => q !== query)].slice(0, 20);
    window.localStorage.setItem("searchHistory", JSON.stringify(newArr.reverse()));
  } catch {
    // ignore storage errors
  }
}

/** Fetch popular queries from the backend API. */
export async function fetchPopularQueries(limit = 5): Promise<string[]> {
  try {
    const res = await fetch(`/api/popular-queries?limit=${limit}`);
    if (!res.ok) throw new Error("fail");
    const data = await res.json();
    return data.map((d: { query: string }) => d.query);
  } catch {
    return [];
  }
}

/**
 * Select a random subset of suggestions using history or API data.
 */
export async function getRandomSuggestions(count: number = 3): Promise<string[]> {
  const [history, fromApi] = await Promise.all([
    Promise.resolve(getSearchHistory(count)),
    fetchPopularQueries(count * 2).catch(() => []) // Graceful fallback
  ]);
  
  let pool: string[] = history;
  if (pool.length < count) {
    pool = [...history, ...fromApi];
  }
  if (pool.length === 0) pool = [...fallbackSuggestions];
  const shuffled = [...new Set(pool)].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

/** Key used to store query history in localStorage. */
/**
 * Clear all stored search history.
 */
export function clearSearchHistory(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem("searchHistory");
}
