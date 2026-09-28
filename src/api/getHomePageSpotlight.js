function headshotUrl(id, width = 96) {
	return `https://img.mlbstatic.com/mlb-photos/image/upload/c_fill,g_auto/w_${width},d_people:generic:headshot:67:current.png,q_auto/v1/people/${id}/headshot/67/current`;
}

function genericHeadshot() {
	return 'https://img.mlbstatic.com/mlb-photos/image/upload/w_96,d_people:generic:headshot:67:current.png/v1/people/generic/headshot/67/current';
}

function toLeaderRows(leaders) {
	return leaders.map((player) => ({
		rank: player.rank,
		value: player.value,
		name: player.person.fullName,
		id: player.person.id,
		team: player.team.name,
		teamId: player.team.id,
		headshot: headshotUrl(player.person.id),
		genericHeadshot: genericHeadshot()
	}));
}

async function fetchTopLeaders(leaderCategories, statGroup, leagueId, offset) {
	const currentYear = new Date().getFullYear();
	let url = `https://statsapi.mlb.com/api/v1/stats/leaders?sportId=1&season=${currentYear}&leaderCategories=${leaderCategories}&statGroup=${statGroup}&playerPool=qualified&limit=11`;
	if (leagueId) url += `&leagueId=${leagueId}`;
	if (offset > 0) url += `&offset=${offset}`;

	const response = await fetch(url);
	if (!response.ok) throw new Error(`Failed to pull ${leaderCategories} metrics`);

	const data = await response.json();
	const leaderList = data.leagueLeaders?.[0]?.leaders || [];

	const hasMore = leaderList.length > 10;

	return {
		list: toLeaderRows(leaderList.slice(0, 10)),
		hasMore
	};
}

// One paginated leaderboard per category/stat group. `league` is "both",
// "al", or "nl"; `offset` skips ahead (0 = ranks 1-10, 10 = 11-20, ...).
export async function getLeagueLeaders(
	leaderCategories,
	statGroup,
	league = 'both',
	offset = 0
) {
	const leagueId = league === 'al' ? 103 : league === 'nl' ? 104 : null;
	return fetchTopLeaders(leaderCategories, statGroup, leagueId, offset);
}
