/** Split query into lowercase words; empty query matches everything. */
export function parseSearchWords(query: string): string[] {
  return query
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.toLocaleLowerCase("he"));
}

export function eventMatchesSearch(haystack: string, words: string[]): boolean {
  if (words.length === 0) return true;
  const normalized = haystack.toLocaleLowerCase("he");
  return words.every((word) => normalized.includes(word));
}

export function buildEventSearchText(parts: {
  title: string;
  description?: string | null;
  category: string;
  eventNumber?: number;
  outcomes?: { label: string }[];
  creatorUsername?: string | null;
  extra?: string[];
}): string {
  return [
    parts.title,
    parts.description,
    parts.category,
    parts.eventNumber != null ? String(parts.eventNumber) : null,
    parts.creatorUsername,
    ...(parts.outcomes?.map((o) => o.label) ?? []),
    ...(parts.extra ?? []),
  ]
    .filter((part): part is string => Boolean(part))
    .join(" ");
}

export function filterByEventSearch<T>(
  items: T[],
  query: string,
  getSearchText: (item: T) => string
): T[] {
  const words = parseSearchWords(query);
  if (words.length === 0) return items;
  return items.filter((item) =>
    eventMatchesSearch(getSearchText(item), words)
  );
}
