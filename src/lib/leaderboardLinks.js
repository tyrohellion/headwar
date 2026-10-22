/**
 * Build the link a rank badge points at on the player page.
 *
 * Every rank on a player page is "this player, this season, this stat", which is
 * exactly the leaderboard query that should open when the badge is clicked, so
 * the sentence on the other end already reads the way the badge does.
 *
 * Params that do not apply are left out rather than sent empty, so the URL stays
 * readable: /leaderboard?group=pitching&stat=era&season=2024
 */
export function leaderboardHref({
  namespace,
  stat,
  season,
  league,
  position,
} = {}) {
  const params = new URLSearchParams();
  if (namespace) params.set("group", namespace);
  if (stat) params.set("stat", stat);
  if (season) params.set("season", String(season));
  if (league) params.set("league", league);
  if (position) params.set("position", position);
  const query = params.toString();
  return query ? `/leaderboard?${query}` : "/leaderboard";
}

/** The link a whole stat category points at (no single stat picked). */
export function leaderboardCategoryHref({ namespace, season, league } = {}) {
  return leaderboardHref({ namespace, season, league });
}
