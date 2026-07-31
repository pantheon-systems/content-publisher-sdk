export interface FetchError extends Error {
  status?: number;
  statusText?: string;
  data?: unknown;
}

export async function fetchWithErrorHandling(
  url: string,
  options?: RequestInit,
): Promise<Response> {
  const response = await fetch(url, options);

  if (!response.ok) {
    const error = new Error(
      `HTTP error! status: ${response.status}`,
    ) as FetchError;
    error.status = response.status;
    error.statusText = response.statusText;

    try {
      const raw = await response.text();
      try {
        error.data = JSON.parse(raw);
      } catch {
        error.data = raw || response.statusText;
      }
    } catch {
      error.data = response.statusText;
    }

    throw error;
  }

  return response;
}
