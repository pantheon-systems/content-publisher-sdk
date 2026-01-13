import axios from "axios";

export async function axiosFetch(
  input: string | URL | Request,
  init?: RequestInit,
): Promise<Response> {
  // Normalize input
  let url: string;
  let method: string | undefined;
  let headers: HeadersInit | undefined;
  let body: BodyInit | null | undefined;
  let credentials: RequestCredentials | undefined;

  if (input instanceof Request) {
    url = input.url;
    method = input.method;
    headers = input.headers;
    body = input.body;
    credentials = input.credentials;
  } else {
    url = input.toString();
    method = init?.method;
    headers = init?.headers;
    body = init?.body;
    credentials = init?.credentials;
  }

  // Normalize fetch-style headers into plain object for axios
  const normalizeHeaders = (
    headers: HeadersInit | undefined,
  ): Record<string, string> | undefined => {
    if (!headers) return undefined;

    if (headers instanceof Headers) {
      const result: Record<string, string> = {};
      headers.forEach((value, key) => {
        result[key] = value;
      });
      return result;
    }

    if (Array.isArray(headers)) {
      return Object.fromEntries(headers);
    }

    return headers as Record<string, string>;
  };

  try {
    const response = await axios({
      url,
      method: method || "GET",
      headers: normalizeHeaders(headers),
      data: body,
      withCredentials: credentials === "include",
      responseType: "text",
      // resolve even for 4xx/5xx
      validateStatus: () => true,
    });

    // Convert Axios headers to HeadersInit via new Headers()
    const fetchHeaders = new Headers();
    for (const [key, value] of Object.entries(response.headers)) {
      fetchHeaders.append(key, value as string);
    }

    return new Response(response.data, {
      status: response.status,
      statusText: response.statusText,
      headers: fetchHeaders,
    });
  } catch (error: unknown) {
    throw new TypeError((error as Error)?.message || "Network request failed");
  }
}
