/**
 * Formats a player's season games-played summary into a badge label, e.g.
 *   "84 games"                      -> MLB only
 *   "84 games (16 in AAA)"          -> MLB plus minors
 *   "132 games (AA, A+)"            -> no MLB time that season
 * @param {{ total: number, byLevel: { level: string, label: string, games: number }[] }} summary
 * @returns {string}
 */
export function formatGamesPlayedLabel({ total, byLevel } = {}) {
  if (!total || total <= 0) return "";

  const base = `${total} ${total === 1 ? "Game" : "Games"}`;
  const minors = (byLevel || []).filter(
    (entry) => entry.level !== "MLB" && entry.games > 0,
  );
  if (minors.length === 0) return base;

  const mlb =
    (byLevel || []).find((entry) => entry.level === "MLB")?.games || 0;
  if (mlb > 0) {
    const parts = minors.map((entry) => `${entry.games} in ${entry.label}`);
    return `${base} (${parts.join(", ")})`;
  }

  const levels = minors.map((entry) => entry.label).join(", ");
  return `${base} (${levels})`;
}
