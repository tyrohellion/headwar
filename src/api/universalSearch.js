const LEAGUE_LABELS = {
  1: "MLB",
  11: "AAA",
  12: "AA",
  13: "A+",
  14: "A",
};

const LEAGUE_PRESTIGE = {
  1: 1, // MLB
  11: 2, // AAA
  12: 3, // AA
  13: 4, // High-A
  14: 5, // Single-A
};

const TARGET_SPORTS = "1,11,12,13,14";
const CURRENT_SEASON = "2026";

export async function searchEverything(queryString, signal) {
  if (!queryString.trim()) return { players: [], teams: [] };

  const cleanQuery = encodeURIComponent(queryString.trim().toLowerCase());
  const playerUrl = `https://statsapi.mlb.com/api/v1/people/search?names=${cleanQuery}&sportId=${TARGET_SPORTS}&hydrate=currentTeam`;
  const teamUrl = `https://statsapi.mlb.com/api/v1/teams?sportIds=${TARGET_SPORTS}&season=${CURRENT_SEASON}`;

  try {
    const [playerRes, teamRes] = await Promise.all([
      fetch(playerUrl, { signal }),
      fetch(teamUrl, { signal }),
    ]);

    const playerData = await playerRes.json();
    const teamData = await teamRes.json();

    let rawPlayers = playerData.people || [];
    let rawTeams = teamData.teams || [];

    const sortedPlayers = rawPlayers
      .filter((player) => {
        const sportId = player.sport?.id?.toString();
        return sportId ? TARGET_SPORTS.includes(sportId) : true;
      })
      .sort((a, b) => {
        const prestigeA = LEAGUE_PRESTIGE[a.sport?.id?.toString()] || 99;
        const prestigeB = LEAGUE_PRESTIGE[b.sport?.id?.toString()] || 99;
        if (prestigeA !== prestigeB) return prestigeA - prestigeB;
        if (a.active !== b.active) return a.active ? -1 : 1;
        return 0;
      });

    const filteredTeams = rawTeams
      .filter((team) => {
        const nameMatches = team.name
          .toLowerCase()
          .includes(queryString.toLowerCase());
        const abbrevMatches =
          team.abbreviation &&
          team.abbreviation.toLowerCase() === queryString.toLowerCase();
        return nameMatches || abbrevMatches;
      })
      .sort((a, b) => {
        const prestigeA = LEAGUE_PRESTIGE[a.sport?.id?.toString()] || 99;
        const prestigeB = LEAGUE_PRESTIGE[b.sport?.id?.toString()] || 99;
        return prestigeA - prestigeB;
      });

    return {
      players: sortedPlayers.map((player) => {
        const sportIdStr = player.sport?.id?.toString();

        const explicitLeague = LEAGUE_LABELS[sportIdStr] || "MLB";

        return {
          id: player.id,
          name: player.fullName,
          position: player.primaryPosition?.name || "",
          currentTeam: player.currentTeam?.name || "Historical / Free Agent",
          hasMLBDebut: Boolean(player.mlbDebutDate),
          headshot: `https://img.mlbstatic.com/mlb-photos/image/upload/c_fill,g_auto/w_50,d_people:generic:headshot:67:current.png,q_auto:best/v1/people/${player.id}/headshot/67/current`,
        };
      }),
      teams: filteredTeams.map((team) => {
        const sportIdStr = team.sport?.id?.toString();
        return {
          id: team.id,
          name: team.name,
          abbreviation: team.abbreviation || "",
          leagueName: team.league?.name || "",
          sportId: team.sport?.id ?? null,
          logo: `https://www.mlbstatic.com/team-logos/${team.id}.svg`,
        };
      }),
    };
  } catch (err) {
    if (err?.name === "AbortError") throw err;
    console.error("Unified search pipeline error:", err);
    return { players: [], teams: [] };
  }
}

// How many players to reveal at a time. Consumers use this to label the
// results ("20+" vs the exact count when fewer than a full page matched).
export const PAGE_SIZE = 20;

// Debounces raw search input, guarantees results are delivered in order, and
// pages through the matched players PAGE_SIZE at a time for infinite scroll.
//
// Two bugs this prevents:
//  1. Out-of-order responses: a slow request for an old query can resolve after
//     a newer query's request and overwrite the dropdown with stale results.
//  2. Leaked pending work: after navigating away or short-circuiting on a short
//     query, a pending debounce could still fire and repopulate the results.
//
// Each new input cancels the in-flight request (AbortController) AND bumps a
// sequence number, so any response that wasn't triggered by the latest input is
// dropped. Feed raw input into the returned function every keystroke; call
// `.loadMore()` as the user nears the bottom of the results to reveal the next
// page of players (idempotent, safe to call per scroll event); call `.reset()`
// to cancel any pending work (e.g. on navigation).
//
// @param {(results: { players: Array, teams: Array, hasMore: boolean, totalPlayers: number, totalTeams: number }) => void} onResults
// @param {{ minLength?: number, delay?: number, onStateChange?: (searching: boolean) => void }} [options]
// @returns {(input: string) => void} Feed raw input in on every keystroke. Also exposes `.loadMore()` and `.reset()`.
export function createDebouncedSearch(onResults, options = {}) {
  const minLength = options.minLength ?? 2;
  const delay = options.delay ?? 150;
  const onStateChange = options.onStateChange ?? (() => {});

  let timer = null;
  let sequence = 0;
  let activeController = null;
  let allPlayers = [];
  let allTeams = [];
  let visibleCount = 0;

  function emit() {
    onResults({
      players: allPlayers.slice(0, visibleCount),
      teams: allTeams,
      hasMore: visibleCount < allPlayers.length,
      totalPlayers: allPlayers.length,
      totalTeams: allTeams.length,
    });
  }

  function run(cleanQuery) {
    activeController?.abort();
    const controller = new AbortController();
    activeController = controller;
    const mySeq = ++sequence;

    onStateChange(true);
    searchEverything(cleanQuery, controller.signal)
      .then((results) => {
        if (mySeq !== sequence) return;
        allPlayers = results.players || [];
        allTeams = results.teams || [];
        visibleCount = PAGE_SIZE;
        emit();
      })
      .catch((err) => {
        if (err?.name === "AbortError") return;
        console.error("Universal lookup failed:", err);
      })
      .finally(() => {
        if (mySeq === sequence) {
          activeController = null;
          onStateChange(false);
        }
      });
  }

  function handleInput(input) {
    const cleanQuery = String(input ?? "").trim();
    clearTimeout(timer);
    if (cleanQuery.length < minLength) {
      sequence += 1;
      activeController?.abort();
      activeController = null;
      allPlayers = [];
      allTeams = [];
      visibleCount = 0;
      onStateChange(false);
      emit();
      return;
    }
    timer = setTimeout(() => run(cleanQuery), delay);
  }

  handleInput.loadMore = function loadMore() {
    if (visibleCount >= allPlayers.length) return;
    visibleCount += PAGE_SIZE;
    emit();
  };

  handleInput.reset = function reset() {
    clearTimeout(timer);
    timer = null;
    sequence += 1;
    activeController?.abort();
    activeController = null;
    allPlayers = [];
    allTeams = [];
    visibleCount = 0;
    onStateChange(false);
    emit();
  };

  return handleInput;
}
