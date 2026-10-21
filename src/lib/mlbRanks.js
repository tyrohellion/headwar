/**
 * League ranks for the standard stats.
 *
 * The data lives in static/data, built by .github/scripts/build_mlb_ranks.py.
 * That script pulls the MLB stats API leaderboard for every season and ranks
 * each stat locally, because the API only hands back the rank for whichever
 * stat a board is sorted by.
 *
 * Two files: the recent seasons load with the page, and the archive only
 * downloads when someone picks a season older than the split.
 *
 * Ranks are stored positionally against the key list the file carries, so
 * repeating every stat name in every row does not blow the file size up.
 */

const DATA_PATH = "/data/";

let mainPromise = null;
let archivePromise = null;
let careerPromise = null;

function fetchRanks(file) {
  return fetch(`${DATA_PATH}${file}`)
    .then((res) => {
      if (!res.ok) {
        throw new Error(`Failed to load ${file}: ${res.status}`);
      }
      return res.json();
    })
    .catch((err) => {
      // A missing ranks file should never take the page down with it.
      console.error(err);
      return { keys: {}, players: {} };
    });
}

/** The recent seasons, loaded with the page. */
export function getMlbRanks() {
  if (!mainPromise) {
    mainPromise = fetchRanks("mlb_ranks.json").catch((err) => {
      mainPromise = null;
      throw err;
    });
  }
  return mainPromise;
}

/** The older seasons, loaded only when a season outside the main file is picked. */
export function getMlbRanksArchive() {
  if (!archivePromise) {
    archivePromise = fetchRanks("mlb_ranks_archive.json").catch((err) => {
      archivePromise = null;
      throw err;
    });
  }
  return archivePromise;
}

/** The all-time board, loaded only in career mode. */
export function getMlbRanksCareer() {
  if (!careerPromise) {
    careerPromise = fetchRanks("mlb_ranks_career.json").catch((err) => {
      careerPromise = null;
      throw err;
    });
  }
  return careerPromise;
}

function hasSeason(data, season) {
  const key = String(season);
  for (const namespaces of Object.values(data?.players || {})) {
    for (const seasonMap of Object.values(namespaces)) {
      if (key in seasonMap) return true;
    }
  }
  return false;
}

/**
 * The ranks file that holds a season: the recent one if it has it, otherwise
 * the archive. "career" is the all-time board.
 */
export async function getRanksForSeason(season) {
  if (!season) return null;

  if (season === "career") {
    const career = await getMlbRanksCareer();
    return hasSeason(career, "career") ? career : null;
  }

  const main = await getMlbRanks();
  if (hasSeason(main, season)) return main;

  const archive = await getMlbRanksArchive();
  return hasSeason(archive, season) ? archive : null;
}

/**
 * The ranks for one player, one namespace and one season, keyed by stat name.
 * Empty when the player did not qualify that season - a leaderboard only
 * holds qualified players, so there is no rank to show for anyone else.
 */
export function decodePlayerRanks(data, playerId, namespace, season) {
  const keys = data?.keys?.[namespace];
  const row = data?.players?.[String(playerId)]?.[namespace]?.[String(season)];
  if (!keys || !row) return {};

  const ranks = {};
  for (let i = 0; i < keys.length; i++) {
    const rank = row[i];
    if (rank) ranks[keys[i]] = rank;
  }
  return ranks;
}

/** "1st", "2nd", "3rd", "4th" ... */
export function ordinal(rank) {
  if (!rank) return "";
  const mod100 = rank % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${rank}th`;
  switch (rank % 10) {
    case 1:
      return `${rank}st`;
    case 2:
      return `${rank}nd`;
    case 3:
      return `${rank}rd`;
    default:
      return `${rank}th`;
  }
}
