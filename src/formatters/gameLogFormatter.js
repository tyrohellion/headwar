// Canonical MLB team abbreviations by stable teams endpoint id. The game log
// only carries a team name, so we map the id to a short label for "vs/@"
// opponent chips.
const TEAM_ABBREVIATIONS = {
  108: "LAA",
  109: "ARI",
  110: "BAL",
  111: "BOS",
  112: "CHC",
  113: "CIN",
  114: "CLE",
  115: "COL",
  116: "DET",
  117: "HOU",
  118: "KAN",
  119: "LAD",
  120: "WSH",
  121: "NYM",
  133: "ATH",
  134: "PIT",
  135: "SD",
  136: "SEA",
  137: "SF",
  138: "STL",
  139: "TB",
  140: "TEX",
  141: "TOR",
  142: "MIN",
  143: "PHI",
  144: "ATL",
  145: "CWS",
  146: "MIA",
  147: "NYY",
  158: "MIL",
};

/**
 * Resolves a team id to its common MLB abbreviation, falling back to the first
 * word of the team name (or the first three letters) for unknown ids.
 * @param {number} teamId - MLB teams endpoint id.
 * @param {string} [fallbackName] - Team name, used when the id is unmapped.
 * @returns {string}
 */
export function teamAbbreviation(teamId, fallbackName = "") {
  if (teamId && TEAM_ABBREVIATIONS[teamId]) return TEAM_ABBREVIATIONS[teamId];
  if (!fallbackName) return "";
  const words = fallbackName.split(/\s+/);
  return words.length > 1 ? words[0] : fallbackName.slice(0, 3).toUpperCase();
}

// Event badges per game, ordered best -> worst. Hitters run from the home run
// down to the strikeout; pitchers from the strikeout down to the allowed
// home run. Each event becomes one badge with its count ("2 Strikeouts").
// Extra-base hits are flagged `highlight` so they render in the brand (blue)
// badge color used elsewhere for percentile tags.
const HITTER_EVENTS = [
  {
    key: "homeRuns",
    label: "Home Run",
    plural: "Home Runs",
    negative: false,
    highlight: true,
  },
  {
    key: "triples",
    label: "Triple",
    plural: "Triples",
    negative: false,
    highlight: true,
  },
  {
    key: "doubles",
    label: "Double",
    plural: "Doubles",
    negative: false,
    highlight: true,
  },
  { key: "singles", label: "Single", plural: "Singles", negative: false },
  { key: "runs", label: "Run", plural: "Runs", negative: false },
  { key: "rbi", label: "RBI", plural: "RBI", negative: false },
  {
    key: "stolenBases",
    label: "Stolen Base",
    plural: "Stolen Bases",
    negative: false,
  },
  { key: "baseOnBalls", label: "Walk", plural: "Walks", negative: false },
  {
    key: "strikeOuts",
    label: "Strikeout",
    plural: "Strikeouts",
    negative: true,
  },
];

const PITCHER_EVENTS = [
  {
    key: "strikeOuts",
    label: "Strikeout",
    plural: "Strikeouts",
    negative: false,
  },
  { key: "baseOnBalls", label: "Walk", plural: "Walks", negative: false },
  { key: "hits", label: "Hit Allowed", plural: "Hits Allowed", negative: true },
  {
    key: "homeRuns",
    label: "Home Run Allowed",
    plural: "Home Runs Allowed",
    negative: true,
  },
];

function assignSplit(byGame, split, kind) {
  const gamePk = split?.game?.gamePk || split?.gamePk;
  if (!gamePk) return;
  let entry = byGame.get(gamePk);
  if (!entry) {
    entry = {
      gamePk,
      date: split?.date ? split.date.slice(0, 10) : "",
      isHome: !!split?.isHome,
      teamName: split?.team?.name || "",
      opponentId: split?.opponent?.id || null,
      opponentName: split?.opponent?.name || "",
      hitting: null,
      pitching: null,
    };
    byGame.set(gamePk, entry);
  }
  entry[kind] = split?.stat || {};
  if (split?.isWin != null) entry.isWin = !!split.isWin;
}

function buildBadges(events, stat) {
  const badges = [];
  for (const event of events) {
    const count =
      event.key === "singles"
        ? (stat?.hits || 0) -
          (stat?.doubles || 0) -
          (stat?.triples || 0) -
          (stat?.homeRuns || 0)
        : stat?.[event.key];
    if (!count || count <= 0) continue;
    badges.push({
      key: event.key,
      count,
      negative: event.negative,
      highlight: !!event.highlight,
      text: `${count} ${count === 1 ? event.label : event.plural}`,
    });
  }
  return badges;
}

// Per-game headline coloring. A single game is a tiny sample, so it only earns
// a verdict once it had enough of a sample to mean anything, and the tiers reuse
// the overview tab's greens: elite and good are the two greens while everything
// else falls back to plain text and quiet text so the numbers stay calm.
const MIN_HITTING_AB = 3;
const MIN_PITCHING_IP = 5;

// Ordered so a grade can be floored without another chain of comparisons.
const PERFORMANCE_RANK = { quiet: 0, average: 1, good: 2, elite: 3 };

// The stats API reports innings as "6.2" meaning 6 and 2/3, so the .1/.2 digits
// are outs, not hundredths.
function inningsToDecimal(innings) {
  if (innings == null) return 0;
  const [whole, outs] = String(innings).split(".");
  return (parseInt(whole, 10) || 0) + (parseInt(outs, 10) || 0) / 3;
}

/**
 * Grades a hitting line off how far the hits sat below the at-bats, so 4/4 and
 * 3/4 read as elite while 2/4 is merely good. A short sample is only colored
 * when it went perfect, so 1/1 still counts but 0-for-2 stays quiet. Anything
 * better than a single floors the grade at the lighter green, so a home run
 * with five strikeouts never reads as a bad game.
 * @param {number} hits - Hits.
 * @param {number} atBats - At-bats.
 * @param {number} extraBaseHits - Doubles, triples and home runs.
 * @returns {'elite'|'good'|'average'|'quiet'}
 */
function battingPerformance(hits, atBats, extraBaseHits) {
  let tone;
  if (!atBats) {
    tone = "quiet";
  } else if (atBats < MIN_HITTING_AB) {
    tone = hits === atBats ? "good" : "quiet";
  } else {
    const rate = hits / atBats;
    if (rate >= 0.75) tone = "elite";
    else if (rate >= 0.5) tone = "good";
    else if (rate >= 0.25) tone = "average";
    else tone = "quiet";
  }
  if (extraBaseHits > 0 && PERFORMANCE_RANK[tone] < PERFORMANCE_RANK.good) {
    tone = "good";
  }
  return tone;
}

/**
 * Grades an outing on runs allowed, treating a scoreless outing as good at any
 * length so closers still get credit, then reserving the elite green for full
 * outings. One run is good, two is average, anything worse is quiet.
 * @param {number} earnedRuns - Earned runs allowed.
 * @param {number|string} inningsPitched - Innings pitched, e.g. "6.2".
 * @returns {'elite'|'good'|'average'|'quiet'}
 */
function pitchingPerformance(earnedRuns, inningsPitched) {
  const runs = earnedRuns || 0;
  const fullOuting = inningsToDecimal(inningsPitched) >= MIN_PITCHING_IP;
  if (runs <= 0) return fullOuting ? "elite" : "good";
  if (!fullOuting) return "quiet";
  if (runs === 1) return "good";
  if (runs === 2) return "average";
  return "quiet";
}

/**
 * Shapes a raw per-game entry (batting/pitching lines merged by gamePk) into
 * Recent Performances cards. Pitched-and-batted games produce one card per
 * split so both lines are visible.
 * @param {object} entry - Raw entry from {@link extractRawEntries}.
 * @returns {Array} Card data, empty if the game has no usable line.
 */
export function shapeGameEntry(entry) {
  const pitching = entry.pitching || {};
  const hitting = entry.hitting || {};
  const cards = [];

  if (Number(pitching.gamesPlayed) > 0) {
    const ip = pitching.inningsPitched ?? "0.0";
    const er = pitching.earnedRuns ?? 0;
    cards.push({
      gamePk: entry.gamePk,
      date: entry.date,
      isHome: entry.isHome,
      opponentAbbr: teamAbbreviation(entry.opponentId, entry.opponentName),
      kind: "pitching",
      headline: `${ip} IP / ${er} ER`,
      // Split into value/unit pairs so each label stays right after its number
      // while rendering lighter than the monospaced figures.
      headlineParts: [
        { value: `${ip}`, unit: "IP" },
        { value: `${er}`, unit: "ER" },
      ],
      performance: pitchingPerformance(er, ip),
      detail: pitching.summary || "",
      badges: buildBadges(PITCHER_EVENTS, pitching),
    });
  }

  if (Number(hitting.gamesPlayed) > 0 || Number(hitting.atBats) > 0) {
    const ab = hitting.atBats ?? 0;
    const h = hitting.hits ?? 0;
    cards.push({
      gamePk: entry.gamePk,
      date: entry.date,
      isHome: entry.isHome,
      opponentAbbr: teamAbbreviation(entry.opponentId, entry.opponentName),
      kind: "hitting",
      headline: `${h}/${ab}`,
      performance: battingPerformance(
        h,
        ab,
        (hitting.doubles ?? 0) +
          (hitting.triples ?? 0) +
          (hitting.homeRuns ?? 0),
      ),
      detail: hitting.summary || "",
      badges: buildBadges(HITTER_EVENTS, hitting),
    });
  }

  return cards;
}

/**
 * Extracts the raw per-game entries contained in one gameLog response chunk
 * (a single `limit`/`offset` request). A player's batting and pitching lines
 * for the same game are merged together within the chunk.
 * @param {object} data - statsapi /people/{id}/stats?stats=gameLog payload.
 * @returns {Array} Raw entries, one per distinct game in the chunk.
 */
export function extractRawEntries(data = {}) {
  const byGame = new Map();
  for (const stat of data.stats || []) {
    const groupName =
      typeof stat.group === "string" ? stat.group : stat.group?.displayName;
    const kind = groupName === "pitching" ? "pitching" : "hitting";
    for (const split of stat.splits || []) assignSplit(byGame, split, kind);
  }
  return [...byGame.values()];
}

/**
 * Shapes and sorts a full set of raw entries for display, most-recent-first.
 * @param {Array} rawEntries - Entries from {@link extractRawEntries} (possibly
 * across multiple chunks, already merged by gamePk).
 * @returns {Array} Shaped card entries.
 */
export function shapeGameLog(rawEntries) {
  return rawEntries.flatMap(shapeGameEntry).sort((a, b) => {
    if (a.date === b.date) return b.gamePk - a.gamePk;
    return a.date < b.date ? 1 : -1;
  });
}
