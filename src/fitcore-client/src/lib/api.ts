const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5192";

function getToken(): string | null {
  return localStorage.getItem("fitcore_token");
}

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = getToken();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers ?? {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  return fetch(`${BASE_URL}${path}`, { ...options, headers });
}