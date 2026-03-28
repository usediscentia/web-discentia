const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333"

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message)
    this.name = "ApiError"
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  })

  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: response.statusText }))
    throw new ApiError(response.status, body.error ?? response.statusText)
  }

  return response.json() as Promise<T>
}
