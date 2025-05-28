import { navigate, useLocationProperty } from "wouter/use-browser-location";
import type { BaseLocationHook, BaseSearchHook } from "wouter";

/**
 * Custom location hook that updates when either pathname or search
 * changes. It returns the full location string including the query
 * string and can be used as the Router `hook`.
 */
export const useFullLocation: BaseLocationHook = () => {
  const location = useLocationProperty(
    () => window.location.pathname + window.location.search,
  );
  return [location, navigate];
};

/**
 * Hook that returns just the query string portion of the current URL.
 */
export const useLocationSearch: BaseSearchHook = () =>
  useLocationProperty(() => window.location.search);
