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

/** Example search suggestions used on the home page. */
export const searchSuggestions = [
  "Explain quantum computing",
  "Create a workout plan",
  "Compare React vs Vue",
  "Summarize climate change solutions",
  "Recipe for vegan chocolate cake"
];

/**
 * Select a random subset of suggestions.
 */
export function getRandomSuggestions(count: number = 3): string[] {
  const shuffled = [...searchSuggestions].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}
