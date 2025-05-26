import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  options?: {
    headers?: Record<string, string>
    skipErrorHandling?: boolean
  },
): Promise<Response> {
  const base = typeof window !== "undefined" && (window as any).API_BASE_URL;
  const finalUrl = base && url.startsWith("/")
    ? base.replace(/\/$/, "") + url
    : url;

  const useCredentials =
    !base || finalUrl.startsWith(window.location.origin);

  const res = await fetch(finalUrl, {
    method,
    headers: {
      ...(data ? { "Content-Type": "application/json" } : {}),
      ...(options?.headers || {}),
    },
    body: data ? JSON.stringify(data) : undefined,
    credentials: useCredentials ? "include" : "omit",
  });

  if (!options?.skipErrorHandling) {
    await throwIfResNotOk(res);
  }
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const base =
      typeof window !== "undefined" && (window as any).API_BASE_URL;
    const url = queryKey[0] as string;
    const finalUrl = base && url.startsWith("/")
      ? base.replace(/\/$/, "") + url
      : url;

    const useCredentials =
      !base || finalUrl.startsWith(window.location.origin);

    const res = await fetch(finalUrl, {
      credentials: useCredentials ? "include" : "omit",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

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
