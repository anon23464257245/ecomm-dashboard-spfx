let apiBaseUrl = ""

/**
 * Set by the SPFx host (property pane) or left empty for Vite `/api` proxy.
 * Trailing slashes are stripped.
 */
export function setApiBaseUrl(url: string | undefined | null): void {
  apiBaseUrl = (url ?? "").trim().replace(/\/+$/, "")
}

export function getApiBaseUrl(): string {
  return apiBaseUrl
}

export function apiUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`
  return apiBaseUrl ? `${apiBaseUrl}${normalized}` : normalized
}
