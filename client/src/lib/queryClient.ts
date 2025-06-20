import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

/**
 * Perform a fetch request to the API with optional JSON body.
 */
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  options?: {
    headers?: Record<string, string>
    skipErrorHandling?: boolean
    signal?: AbortSignal
  },
): Promise<Response> {
  const base = typeof window !== "undefined" && (window as any).API_BASE_URL;
  const finalUrl = base && url.startsWith("/")
    ? base.replace(/\/$/, "") + url
    : url;

  const finalOrigin = new URL(finalUrl, window.location.href).origin;
  const useCredentials = finalOrigin === window.location.origin;

  const res = await fetch(finalUrl, {
    method,
    headers: {
      ...(data ? { "Content-Type": "application/json" } : {}),
      ...(typeof window !== "undefined" &&
      window.localStorage?.getItem("openrouter_api_key")
        ? { "openrouter_api_key": String(window.localStorage.getItem("openrouter_api_key")) }
        : {}),
      ...(options?.headers || {}),
    },
    body: data ? JSON.stringify(data) : undefined,
    credentials: useCredentials ? "include" : "omit",
    signal: options?.signal,
  });

  if (!options?.skipErrorHandling) {
    await throwIfResNotOk(res);
  }
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
/**
 * Create a default query function for React Query requests.
 */
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await apiRequest(
      "GET",
      queryKey[0] as string,
      undefined,
      { skipErrorHandling: true },
    );

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

/** Shared QueryClient instance for the app. */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
