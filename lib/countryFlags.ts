const REGIONAL_INDICATOR_OFFSET = 127397;

export function iso2ToFlagEmoji(iso2?: string): string | null {
  const normalized = (iso2 ?? "").trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(normalized)) return null;

  const [first, second] = normalized;
  return String.fromCodePoint(
    first.charCodeAt(0) + REGIONAL_INDICATOR_OFFSET,
    second.charCodeAt(0) + REGIONAL_INDICATOR_OFFSET
  );
}
