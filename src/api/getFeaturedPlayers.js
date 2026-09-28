import { getBrefSeasonWarLeaders } from "$lib/advancedData.js";

function headshotUrl(id, width = 96) {
  return `https://img.mlbstatic.com/mlb-photos/image/upload/c_fill,g_auto/w_${width},d_people:generic:headshot:67:current.png,q_auto/v1/people/${id}/headshot/67/current`;
}

function genericHeadshot() {
  return "https://img.mlbstatic.com/mlb-photos/image/upload/w_96,d_people:generic:headshot:67:current.png/v1/people/generic/headshot/67/current";
}
// Top current-season bWAR performers from the precomputed bref index,
// enriched with names/teams/positions from the public MLB API. Never throws:
// the homepage treats featured players as progressive enhancement.
// League-specific calls scan a wide bWAR pool (well beyond the requested
// window, so each league's slice is repopulated with its own true leaders).
// `page` is 1-based; `hasMore` tells the caller whether a further page exists.
export async function getFeaturedPlayers(limit = 5, league = "both", page = 1) {
  try {
    const year = new Date().getFullYear();
    const rankStart = (page - 1) * limit;
    const poolSize =
      league === "both"
        ? rankStart + limit + 1
        : Math.max(100, (rankStart + limit) * 3 + 1);
    const leaders = await getBrefSeasonWarLeaders(year, poolSize);
    if (!leaders.length) return { list: [], hasMore: false };

    const ids = leaders.map((l) => l.id).join(",");
    const res = await fetch(
      `https://statsapi.mlb.com/api/v1/people?personIds=${ids}&hydrate=currentTeam`,
    );
    if (!res.ok) return { list: [], hasMore: false };

    const data = await res.json();
    const peopleMap = new Map(
      (data.people || []).map((p) => [String(p.id), p]),
    );

    const toRow = (leader, rank) => {
      const person = peopleMap.get(String(leader.id));
      if (!person) return null;
      const team = person.currentTeam || {};
      return {
        id: person.id,
        name: person.fullName,
        position:
          person.primaryPosition?.abbreviation ||
          person.primaryPosition?.name ||
          "",
        team: team.name || "",
        teamId: team.id || null,
        logo: team.id
          ? `https://www.mlbstatic.com/team-logos/${team.id}.svg`
          : "",
        headshot: headshotUrl(person.id),
        genericHeadshot: genericHeadshot(),
        war: leader.war,
        rank,
      };
    };

    if (league === "both") {
      const hasMore = leaders.length > rankStart + limit;
      return {
        list: leaders
          .slice(rankStart, rankStart + limit)
          .map((leader) => toRow(leader, leader.warRank))
          .filter(Boolean),
        hasMore,
      };
    }

    const teamsRes = await fetch(
      `https://statsapi.mlb.com/api/v1/teams?sportId=1&season=${year}`,
    );
    if (!teamsRes.ok) return { list: [], hasMore: false };
    const teamsData = await teamsRes.json();
    const leagueByTeam = new Map(
      (teamsData.teams || []).map((t) => [t.id, t.league?.id]),
    );
    const wantedLeagueId = league === "al" ? 103 : 104;
    const leaguePlayers = leaders.filter((leader) => {
      const person = peopleMap.get(String(leader.id));
      return (
        person && leagueByTeam.get(person.currentTeam?.id) === wantedLeagueId
      );
    });
    const hasMore = leaguePlayers.length > rankStart + limit;
    return {
      list: leaguePlayers
        .slice(rankStart, rankStart + limit)
        .map((leader, i) => toRow(leader, rankStart + i + 1))
        .filter(Boolean),
      hasMore,
    };
  } catch (err) {
    console.error("Failed to load featured players:", err);
    return { list: [], hasMore: false };
  }
}
