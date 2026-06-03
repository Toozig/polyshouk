/** Public profile URL for a username (handles encoding). */
export function userProfilePath(username: string): string {
  return `/users/${encodeURIComponent(username)}`;
}

/** Decode username from a dynamic route segment. */
export function usernameFromRouteSegment(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}
