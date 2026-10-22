/**
 * Data for the universal leaderboard.
 *
 * Two sources, picked per stat:
 *
 *   * The MLB stats API. It knows every standard stat, so the common case is a
 *     single request for the whole player pool, then the board is filtered,
 *     qualified and sorted here. Nothing is stored in the repo for it.
 *   * The precomputed B-Ref / Statcast files, but only for the handful of stats
 *     the API does not carry: bWAR and OPS+/ERA+, the run values (batting,
 *     baserunning, pitching, fielding, and the catcher breakdowns), five-star
 *     catches, and the sprint-speed and arm-strength percentiles. Those are the
 *     one place the site already keeps that data, so the fallback reuses them
 *     rather than shipping another file.
 *
 * Nothing here holds a per-season snapshot, which is what kept the old build
 * from shipping 100+ JSON files.
 */

import { getBrefIndex, SAVANT_MIN_YEAR, CURRENT_SEASON } from "./advancedData.js";

const API = "https://statsapi.mlb.com/api/v1/stats";
const DATA_PATH = "/data/";

// Statcast rows are keyed by mlb_id and carry only the Statcast numbers. Ids
// are reused across seasons, so each season file is cached separately.
const savantCache = new Map();

function fetchJson(fileName) {
  return fetch(`${DATA_PATH}${fileName}`).then((res) => {
    if (!res.ok) throw new Error(`Failed to load ${fileName}: ${res.status}`);
    return res.json();
  });
}

function getSavantRows(year) {
  const fileName = `savant_${year}.json`;
  if (!savantCache.has(fileName)) {
    savantCache.set(
      fileName,
      fetchJson(fileName).catch((err) => {
        savantCache.delete(fileName);
        throw err;
      }),
    );
  }
  return savantCache.get(fileName);
}

export function headshotUrl(id) {
  return `https://img.mlbstatic.com/mlb-photos/image/upload/d_default_profile.png/w_60,q_auto:best/v1/people/${id}/headshot/67/current`;
}

// ---------------------------------------------------------------------------
// Player names for the file-backed boards.
//
// The B-Ref and Statcast files are keyed by id and carry no name, and a board
// is ranked from thousands of candidates, so names are only fetched for the
// rows actually being shown. The people endpoint takes a comma-separated id
// list, which keeps it to a request or two per board.
// ---------------------------------------------------------------------------

const NAME_BATCH = 100;
const personCache = new Map();

export async function resolvePlayerNames(ids) {
  const missing = [...new Set(ids.map(String))].filter(
    (id) => id && !personCache.has(id),
  );
  for (let i = 0; i < missing.length; i += NAME_BATCH) {
    const batch = missing.slice(i, i + NAME_BATCH);
    try {
      const res = await fetch(
        `https://statsapi.mlb.com/api/v1/people?personIds=${batch.join(",")}`,
      );
      if (!res.ok) continue;
      const data = await res.json();
      for (const person of data?.people || []) {
        if (person.id === undefined) continue;
        personCache.set(String(person.id), {
          name: person.fullName || "",
          position: person.primaryPosition?.abbreviation || "",
        });
      }
    } catch {
      // A missing name is cosmetic; leave it blank rather than fail the board.
    }
  }
  return personCache;
}

export function cachedPlayerName(id) {
  return personCache.get(String(id))?.name || "";
}

// ---------------------------------------------------------------------------
// Normalisation. The API spells leagues out; the file rows have none. Both
// paths hand the page the same {id, name, team, league, position, value}.
// ---------------------------------------------------------------------------

function normalizeLeague(value) {
  const text = (value || "").toLowerCase();
  if (text.includes("american") || text === "al") return "AL";
  if (text.includes("national") || text === "nl") return "NL";
  return "";
}

function number(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const text = String(value).trim();
  if (text === "" || text === "-.--" || text === "N/A") return null;
  const parsed = parseFloat(text.startsWith(".") ? `0${text}` : text);
  return Number.isFinite(parsed) ? parsed : null;
}

// A pitcher's listed position is always "P" on the API; the leaderboard wants
// the role, so split it the way the rest of the site does.
function pitcherRole(stats) {
  const games = number(stats?.gamesPlayed) || 0;
  const starts = number(stats?.gamesStarted) || 0;
  return games && starts / games >= 0.5 ? "SP" : "RP";
}

// ---------------------------------------------------------------------------
// MLB stats API board
// ---------------------------------------------------------------------------

/** The API stat name for a catalog entry (file-backed entries have none). */
function apiStatKey(stat) {
  return stat?.source ? null : (stat?.key ?? null);
}

function boardUrl({ namespace, season, stat }) {
  const group = namespace === "pitching" ? "pitching" : "hitting";
  // The pool is always "ALL": the board is filtered, qualified and sorted
  // locally, so the same rows come back whichever source answers.
  const params = new URLSearchParams({
    stats: season === "career" ? "career" : "season",
    group,
    gameType: "R",
    playerPool: "ALL",
    limit: "2000",
    hydrate: "team",
  });
  if (season !== "career") params.set("season", String(season));
  // The career endpoint caps its response at 1000 rows, so it has to be sorted
  // upstream by the stat being shown or the leaders past the cut are lost.
  // A rate stat can sort on a non-numeric placeholder ("-.--") for its top
  // rows, which would fill the cap with unusable entries, so a stat that has a
  // qualifier is sorted on that counting stat instead. Season boards fit under
  // the cap and need neither.
  if (season === "career" && stat) {
    const byQualifier = Boolean(stat.qualifier);
    const sort = stat.qualifier || apiStatKey(stat);
    if (sort) {
      params.set("sortStat", sort);
      params.set("order", byQualifier ? "desc" : stat.lower ? "asc" : "desc");
    }
  }
  return `${API}?${params.toString()}`;
}

async function fetchApiBoard({ namespace, season, stat, signal }) {
  let res = await fetch(boardUrl({ namespace, season, stat }), { signal });
  // Defensive: if a career sort key turned out not to be valid, retry without
  // one rather than failing the view.
  if (res.status === 400) {
    res = await fetch(boardUrl({ namespace, season }), { signal });
  }
  if (!res.ok) throw new Error(`MLB API board failed: ${res.status}`);
  const data = await res.json();
  const splits = data?.stats?.[0]?.splits || [];
  const statKey = apiStatKey(stat);

  const rows = [];
  for (const split of splits) {
    const player = split.player || {};
    if (player.id === undefined || player.id === null) continue;

    const stats = split.stat || {};
    const value = number(stats[statKey]);
    if (value === null) continue;

    const team = split.team || {};
    rows.push({
      id: player.id,
      name: player.fullName || "",
      team: {
        name: team.name || "",
        short: team.shortName || team.teamName || team.name || "",
        abbr: team.abbreviation || "",
      },
      league: normalizeLeague((split.league || {}).name || ""),
      position:
        namespace === "pitching"
          ? pitcherRole(stats)
          : (split.position || {}).abbreviation || "",
      value,
      qualified: true,
      qualifierValue: stat.qualifier ? number(stats[stat.qualifier]) : null,
    });
  }

  return { rows, source: "api" };
}

// ---------------------------------------------------------------------------
// Precomputed fallback (B-Ref + Statcast) for the stats the API lacks.
// ---------------------------------------------------------------------------

/** The raw value off a savant row for a catalog entry. */
function readSavant(row, stat) {
  switch (stat.key) {
    case "bat_run_val":
      return number(row.savant_bat_run_val);
    case "base_run_val":
      return number(row.savant_base_run_val);
    case "pitch_run_val":
      return number(row.savant_pitch_run_val);
    case "field_total_runs":
      return number(row.f_total_runs);
    case "field_arm_runs":
      return number(row.f_arm_runs);
    case "field_catching_runs":
      return number(row.f_catching_runs);
    case "field_framing_runs":
      return number(row.f_framing_runs);
    case "field_throwing_runs":
      return number(row.f_throwing_runs);
    case "field_blocking_runs":
      return number(row.f_blocking_runs);
    case "five_star_catches":
      return number(row.f_five_star_catches);
    case "sprint_speed_pct":
      return number(row.pct_sprint_speed);
    case "arm_strength_pct":
      return number(row.b_pct_arm_strength ?? row.p_pct_arm_strength);
    default:
      return null;
  }
}

async function fetchFileBoard({ namespace, season, stat, signal }) {
  const index = await getBrefIndex();
  if (signal?.aborted) return [];

  const rows = [];
  const push = (id, player, value, qualified = true) => {
    if (value === null) return;
    rows.push({
      id,
      name: player?.name || "",
      team: null,
      league: "",
      position: namespace === "pitching" ? "P" : "",
      value,
      qualified,
      qualifierValue: null,
    });
  };

  if (stat.source === "bref") {
    for (const player of index.values()) {
      if (season === "career") {
        push(player.id, player, careerBrefValue(player, stat.key));
      } else {
        const { value, qualified } = seasonBrefValue(player, season, stat.key);
        push(player.id, player, value, qualified);
      }
    }
    return { rows, source: "file" };
  }

  // Statcast: career mode has no usable board (its ids do not line up with the
  // career file), and the files only start in 2015.
  if (season === "career") return { rows, source: "file" };
  const year = Number(season);
  if (!Number.isFinite(year) || year < SAVANT_MIN_YEAR || year > CURRENT_SEASON) {
    return { rows, source: "file" };
  }

  const savantRows = await getSavantRows(year);
  if (signal?.aborted) return [];

  const byId = new Map();
  for (const row of savantRows) {
    const id = row.mlb_id;
    if (id === undefined || id === null) continue;
    byId.set(String(id), row);
  }

  for (const player of index.values()) {
    const row = byId.get(String(player.id));
    if (!row) continue;
    push(player.id, player, readSavant(row, stat));
  }
  return { rows, source: "file" };
}

function careerBrefValue(player, key) {
  if (key === "war") return number(player.cw);
  if (key === "opsPlus") return number(player.co);
  if (key === "eraPlus") return number(player.ce);
  return null;
}

// A season row is [year, war, warRank, ops, opsRank, era, eraRank]. B-Ref only
// ranks OPS+/ERA+ for players who met its PA/IP qualifier, so a null rank is
// exactly the "did not qualify" signal the player pages use. Returning it lets
// the board drop the cameo seasons (2-at-bat OPS+ leaders) the same way.
function seasonBrefValue(player, season, key) {
  const target = String(season);
  for (const row of player.seasons || []) {
    const [year, war, , ops, opsRank, era, eraRank] = row;
    if (String(year) !== target) continue;
    if (key === "war") return { value: number(war), qualified: true };
    if (key === "opsPlus") {
      return { value: number(ops), qualified: opsRank !== null && opsRank !== undefined };
    }
    if (key === "eraPlus") {
      return { value: number(era), qualified: eraRank !== null && eraRank !== undefined };
    }
  }
  return { value: null, qualified: false };
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

/**
 * Load one board for the leaderboard. `stat` is a catalog entry; when it has a
 * `source`, the precomputed path is used, otherwise the API.
 */
export async function getBoard({ namespace, season, stat, signal }) {
  if (!stat) return { rows: [], source: "api" };
  if (stat.source) return fetchFileBoard({ namespace, season, stat, signal });
  return fetchApiBoard({ namespace, season, stat, signal });
}

/** The seasons the season picker offers. The API can answer any of them. */
export function availableSeasons() {
  const current = new Date().getFullYear();
  const seasons = [];
  for (let year = current; year >= 1900; year -= 1) seasons.push(year);
  return seasons;
}
