/**
 * Catalog for the universal leaderboard.
 *
 * Every entry describes one column the leaderboard can sort on. A stat is
 * served one of two ways:
 *
 *   * No `source` - the MLB stats API answers it. `key` is the API's own stat
 *     name, so these need no mapping.
 *   * `source: "bref" | "savant"` - the API does not carry the stat, so it is
 *     pulled from the precomputed B-Ref / Statcast files instead. That set is
 *     deliberately tiny: bWAR and OPS+/ERA+, the run values (including the
 *     catcher breakdowns), five-star catches, and the sprint-speed and
 *     arm-strength percentiles.
 *
 * Fields:
 *   key          API stat name, or the id used for a file-backed stat
 *   label        full name, shown in the dropdown and table header
 *   abbr         short header
 *   category     heading inside the dropdown
 *   decimals     digits to print (null = as stored)
 *   lower        true when a smaller number is the better one
 *   qualifier    the standard counting stat a player must have to appear on a
 *                rate board, checked when "Qualified only" is on
 *   pct          true for a 0-100 percentile column
 *   source       "bref" | "savant" when the API cannot answer the stat
 *   statcast     true for a Statcast-era column (2015+ only)
 *   description  tooltip text
 */

export const STANDARD_HITTING = [
  { key: "avg", label: "Batting Average", abbr: "AVG", decimals: 3, qualifier: "plateAppearances", description: "Hits divided by at bats." },
  { key: "obp", label: "On-Base Percentage", abbr: "OBP", decimals: 3, qualifier: "plateAppearances", description: "How often a batter reaches base via hit, walk or hit by pitch." },
  { key: "slg", label: "Slugging Percentage", abbr: "SLG", decimals: 3, qualifier: "plateAppearances", description: "Total bases divided by at bats." },
  { key: "ops", label: "On-Base Plus Slugging", abbr: "OPS", decimals: 3, qualifier: "plateAppearances", description: "OBP plus SLG." },
  { key: "homeRuns", label: "Home Runs", abbr: "HR", decimals: 0 },
  { key: "rbi", label: "Runs Batted In", abbr: "RBI", decimals: 0 },
  { key: "runs", label: "Runs", abbr: "R", decimals: 0 },
  { key: "hits", label: "Hits", abbr: "H", decimals: 0 },
  { key: "doubles", label: "Doubles", abbr: "2B", decimals: 0 },
  { key: "triples", label: "Triples", abbr: "3B", decimals: 0 },
  { key: "stolenBases", label: "Stolen Bases", abbr: "SB", decimals: 0 },
  { key: "caughtStealing", label: "Caught Stealing", abbr: "CS", decimals: 0, lower: true },
  { key: "baseOnBalls", label: "Walks", abbr: "BB", decimals: 0 },
  { key: "strikeOuts", label: "Strikeouts", abbr: "SO", decimals: 0, lower: true },
  { key: "intentionalWalks", label: "Intentional Walks", abbr: "IBB", decimals: 0 },
  { key: "hitByPitch", label: "Hit By Pitch", abbr: "HBP", decimals: 0 },
  { key: "sacFlies", label: "Sacrifice Flies", abbr: "SF", decimals: 0 },
  { key: "sacBunts", label: "Sacrifice Bunts", abbr: "SH", decimals: 0 },
  { key: "totalBases", label: "Total Bases", abbr: "TB", decimals: 0 },
  { key: "babip", label: "Batting Average on Balls in Play", abbr: "BABIP", decimals: 3, qualifier: "plateAppearances" },
  { key: "groundIntoDoublePlay", label: "Grounded Into Double Play", abbr: "GIDP", decimals: 0, lower: true },
  { key: "leftOnBase", label: "Left On Base", abbr: "LOB", decimals: 0 },
  { key: "gamesPlayed", label: "Games Played", abbr: "G", decimals: 0 },
  { key: "plateAppearances", label: "Plate Appearances", abbr: "PA", decimals: 0 },
  { key: "atBats", label: "At Bats", abbr: "AB", decimals: 0 },
  { key: "stolenBasePercentage", label: "Stolen Base Percentage", abbr: "SB%", decimals: 3 },
  { key: "numberOfPitches", label: "Pitches Seen", abbr: "P", decimals: 0 },
];

export const STANDARD_PITCHING = [
  { key: "era", label: "Earned Run Average", abbr: "ERA", decimals: 2, lower: true, qualifier: "inningsPitched", description: "Earned runs per nine innings." },
  { key: "whip", label: "Walks and Hits per Inning", abbr: "WHIP", decimals: 3, lower: true, qualifier: "inningsPitched", description: "Walks plus hits allowed per inning." },
  { key: "ops", label: "Opponent OPS", abbr: "oOPS", decimals: 3, lower: true, qualifier: "battersFaced" },
  { key: "obp", label: "Opponent OBP", abbr: "oOBP", decimals: 3, lower: true, qualifier: "battersFaced" },
  { key: "avg", label: "Opponent Batting Average", abbr: "oAVG", decimals: 3, lower: true, qualifier: "battersFaced" },
  { key: "strikeoutsPer9Inn", label: "Strikeouts per 9", abbr: "K/9", decimals: 2, qualifier: "inningsPitched" },
  { key: "walksPer9Inn", label: "Walks per 9", abbr: "BB/9", decimals: 2, lower: true, qualifier: "inningsPitched" },
  { key: "hitsPer9Inn", label: "Hits per 9", abbr: "H/9", decimals: 2, lower: true, qualifier: "inningsPitched" },
  { key: "homeRunsPer9", label: "Home Runs per 9", abbr: "HR/9", decimals: 2, lower: true, qualifier: "inningsPitched" },
  { key: "strikeoutWalkRatio", label: "Strikeout to Walk Ratio", abbr: "K/BB", decimals: 2, qualifier: "inningsPitched" },
  { key: "strikeOuts", label: "Strikeouts", abbr: "SO", decimals: 0 },
  { key: "inningsPitched", label: "Innings Pitched", abbr: "IP", decimals: 1 },
  { key: "wins", label: "Wins", abbr: "W", decimals: 0 },
  { key: "losses", label: "Losses", abbr: "L", decimals: 0, lower: true },
  { key: "saves", label: "Saves", abbr: "SV", decimals: 0 },
  { key: "holds", label: "Holds", abbr: "HLD", decimals: 0 },
  { key: "blownSaves", label: "Blown Saves", abbr: "BS", decimals: 0, lower: true },
  { key: "gamesStarted", label: "Games Started", abbr: "GS", decimals: 0 },
  { key: "gamesPlayed", label: "Games Played", abbr: "G", decimals: 0 },
  { key: "completeGames", label: "Complete Games", abbr: "CG", decimals: 0 },
  { key: "shutouts", label: "Shutouts", abbr: "SHO", decimals: 0 },
  { key: "winPercentage", label: "Win Percentage", abbr: "W%", decimals: 3 },
  { key: "battersFaced", label: "Batters Faced", abbr: "BF", decimals: 0 },
  { key: "hits", label: "Hits Allowed", abbr: "H", decimals: 0, lower: true },
  { key: "runs", label: "Runs Allowed", abbr: "R", decimals: 0, lower: true },
  { key: "earnedRuns", label: "Earned Runs", abbr: "ER", decimals: 0, lower: true },
  { key: "baseOnBalls", label: "Walks Allowed", abbr: "BB", decimals: 0, lower: true },
  { key: "pitchesPerInning", label: "Pitches per Inning", abbr: "P/IP", decimals: 2, lower: true },
];

// The B-Ref stats. The MLB API has no board for any of these, so they come from
// bref_index.json (career totals live on the row, seasons on its `seasons`).
export const SABER_HITTING = [
  { key: "war", label: "Wins Above Replacement", abbr: "WAR", decimals: 1, category: "Value", source: "bref", description: "B-Ref wins above replacement." },
  // OPS+ has no career rank on the player page (only a WAR-weighted average),
  // so there is no qualified career board to match; keep it season-only.
  { key: "opsPlus", label: "OPS+", abbr: "OPS+", decimals: 0, category: "Value", source: "bref", noCareer: true, description: "Park-adjusted OPS, where 100 is league average." },
];

export const SABER_PITCHING = [
  { key: "war", label: "Wins Above Replacement", abbr: "WAR", decimals: 1, category: "Value", source: "bref", description: "B-Ref wins above replacement." },
  // ERA+ likewise has no career rank, only a career average.
  { key: "eraPlus", label: "ERA+", abbr: "ERA+", decimals: 0, category: "Value", source: "bref", noCareer: true, description: "Park-adjusted ERA, where 100 is league average." },
];

// The Statcast stats the MLB API does not carry, served from savant_<year>.json.
// Everything else Statcast publishes stays out of the leaderboard: the API has
// no board for it and it is not part of the small file-backed set.
export const STATCAST_HITTING = [
  { key: "bat_run_val", label: "Batting Run Value", abbr: "BatRV", decimals: 1, category: "Run Value", source: "savant", statcast: true },
  { key: "base_run_val", label: "Baserunning Run Value", abbr: "BsrRV", decimals: 1, category: "Run Value", source: "savant", statcast: true },
  { key: "field_total_runs", label: "Fielding Run Value", abbr: "FRV", decimals: 1, category: "Fielding", source: "savant", statcast: true },
  { key: "field_framing_runs", label: "Framing Runs", abbr: "FrmR", decimals: 1, category: "Fielding", source: "savant", statcast: true },
  { key: "field_catching_runs", label: "Catcher Runs", abbr: "CatchR", decimals: 1, category: "Fielding", source: "savant", statcast: true },
  { key: "field_throwing_runs", label: "Throwing Runs", abbr: "ThrR", decimals: 1, category: "Fielding", source: "savant", statcast: true },
  { key: "field_blocking_runs", label: "Blocking Runs", abbr: "BlkR", decimals: 1, category: "Fielding", source: "savant", statcast: true },
  { key: "field_arm_runs", label: "Arm Runs", abbr: "ArmR", decimals: 1, category: "Fielding", source: "savant", statcast: true },
  { key: "five_star_catches", label: "Five-Star Catches", abbr: "5★", decimals: 0, category: "Fielding", source: "savant", statcast: true },
  { key: "sprint_speed_pct", label: "Sprint Speed Percentile", abbr: "Spd%", decimals: 0, pct: true, category: "Percentile", source: "savant", statcast: true },
  { key: "arm_strength_pct", label: "Arm Strength Percentile", abbr: "Arm%", decimals: 0, pct: true, category: "Percentile", source: "savant", statcast: true },
];

export const STATCAST_PITCHING = [
  { key: "pitch_run_val", label: "Pitching Run Value", abbr: "PitRV", decimals: 1, category: "Run Value", source: "savant", statcast: true },
  { key: "arm_strength_pct", label: "Arm Strength Percentile", abbr: "Arm%", decimals: 0, pct: true, category: "Percentile", source: "savant", statcast: true },
];

const CATALOGS = {
  hitting: [...STANDARD_HITTING, ...SABER_HITTING, ...STATCAST_HITTING],
  pitching: [...STANDARD_PITCHING, ...SABER_PITCHING, ...STATCAST_PITCHING],
};

// The groups a stat can be sorted into, in dropdown order.
const GROUP_ORDER = ["standard", "value", "run value", "fielding", "percentile"];

for (const [namespace, list] of Object.entries(CATALOGS)) {
  list.forEach((stat) => {
    stat.namespace = namespace;
    // The standard block is listed first in each catalog and is the only one
    // without an explicit category, so anything uncategorised is "standard".
    stat.category = (stat.category || "standard").toLowerCase();
  });
}

/** Every stat for a namespace, in catalog order. */
export function statsFor(namespace) {
  return CATALOGS[namespace] || [];
}

/** Look a stat up by namespace + key. */
export function findStat(namespace, key) {
  return statsFor(namespace).find((stat) => stat.key === key) || null;
}

/** The category headings and their stats, in display order. */
export function groupedStats(namespace, season) {
  const groups = new Map();
  for (const stat of availableStats(namespace, season)) {
    if (!groups.has(stat.category)) groups.set(stat.category, []);
    groups.get(stat.category).push(stat);
  }
  return [...groups.entries()]
    .sort((a, b) => {
      const ai = GROUP_ORDER.indexOf(a[0]);
      const bi = GROUP_ORDER.indexOf(b[0]);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    })
    .map(([category, stats]) => ({ category, stats }));
}

/** The default stat for a namespace, used before someone picks one. */
export function defaultStatKey(namespace) {
  return namespace === "pitching" ? "era" : "ops";
}

/**
 * Whether a stat has data for a season. The file-backed run values and
 * percentiles only start with Statcast (2015), and career mode has no Statcast
 * board because those ids do not line up with the career file.
 */
export function statAvailable(stat, season) {
  if (stat.noCareer && season === "career") return false;
  if (!stat.statcast) return true;
  if (season === "career") return false;
  const year = Number(season);
  return Number.isFinite(year) && year >= 2015;
}

/**
 * Which stats are worth offering for a season. Used to keep the dropdown from
 * listing a column that would return nothing but blanks.
 */
export function availableStats(namespace, season) {
  return statsFor(namespace).filter((stat) => statAvailable(stat, season));
}
