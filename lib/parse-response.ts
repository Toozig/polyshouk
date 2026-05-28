export async function parseJsonResponse<T extends Record<string, unknown>>(
  response: Response
): Promise<{ data: T | null; parseError: boolean }> {
  const text = await response.text();
  if (!text.trim()) {
    return { data: null, parseError: false };
  }
  try {
    return { data: JSON.parse(text) as T, parseError: false };
  } catch {
    return { data: null, parseError: true };
  }
}
