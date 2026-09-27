import { getBrefIndex } from "$lib/advancedData.js";

function headshot(id) {
  return `https://img.mlbstatic.com/mlb-photos/image/upload/d_default_profile.png/w_60,q_auto:best/v1/people/${id}/headshot/67/current`;
}

// Element and league ids are stable across seasons in the public MLB API.
const AL_LEAGUE_ID = 103;
const NL_LEAGUE_ID = 104;

// One big roster call is cached for the session so league/team/country pages
// (and the home page's team constellation) never re-fetch it.
let seasonPlayersCache = null;

async function fetchSeasonPeople(year) {
  if (!seasonPlayersCache) {
    const res = await fetch(
      `https://statsapi.mlb.com/api/v1/sports/1/players?season=${year}`,
    );
    if (!res.ok) throw new Error(`Failed to load MLB players for ${year}`);
    seasonPlayersCache = await res.json();
  }
  return seasonPlayersCache;
}

// Every MLB club as a "node": { teamId, name, abbreviation, league, logo }
// plus its top 4 current-season bWAR players as clickable bubbles.
// Never throws: the home page treats this section as progressive enhancement.
export async function getTeamBubbleLeaders(year) {
  try {
    const [index, playersData, teamsData] = await Promise.all([
      getBrefIndex(),
      fetchSeasonPeople(year),
      fetch(
        `https://statsapi.mlb.com/api/v1/teams?sportId=1&season=${year}`,
      ).then((r) => {
        if (!r.ok) throw new Error("Failed to load MLB teams");
        return r.json();
      }),
    ]);

    const people = playersData.people || [];
    const teams = teamsData.teams || [];

    // Current-season bWAR (war, warRank) keyed by player id.
    const warByPlayer = new Map();
    for (const [pid, meta] of index) {
      for (const season of meta.seasons) {
        if (season[0] === year && season[1] != null && season[1] > 0) {
          warByPlayer.set(pid, { war: season[1], warRank: season[2] });
          break;
        }
      }
    }

    // Group people by current team, keeping only players with bWAR.
    const playersByTeam = new Map();
    for (const person of people) {
      const teamId = person?.currentTeam?.id;
      if (teamId == null) continue;
      const war = warByPlayer.get(String(person.id));
      if (!war) continue;
      if (!playersByTeam.has(teamId)) playersByTeam.set(teamId, []);
      playersByTeam.get(teamId).push({
        id: person.id,
        name: person.fullName,
        position:
          person.primaryPosition?.abbreviation ||
          person.primaryPosition?.name ||
          "",
        headshot: headshot(person.id),
        ...war,
      });
    }

    return teams
      .map((team) => {
        const leagueId = team.league?.id;
        return {
          teamId: team.id,
          name: team.name,
          abbreviation: team.abbreviation,
          league: leagueId === NL_LEAGUE_ID ? "NL" : "AL",
          logo: `https://www.mlbstatic.com/team-logos/${team.id}.svg`,
          players: (playersByTeam.get(team.id) || [])
            .sort((a, b) => b.war - a.war)
            .slice(0, 4),
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch (err) {
    console.error("Failed to load team bWAR leaders:", err);
    return [];
  }
}
