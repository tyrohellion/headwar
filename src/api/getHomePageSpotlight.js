async function fetchTopLeaders(leaderCategories, statGroup) {
	const currentYear = new Date().getFullYear();
	const url = `https://statsapi.mlb.com/api/v1/stats/leaders?sportId=1&season=${currentYear}&leaderCategories=${leaderCategories}&statGroup=${statGroup}&playerPool=qualified&limit=10`;

	const response = await fetch(url);
	if (!response.ok) throw new Error(`Failed to pull ${leaderCategories} metrics`);

	const data = await response.json();
	const leaders = data.leagueLeaders?.[0]?.leaders || [];

	console.log(`[API Debug] Raw ${leaderCategories} leaders array length:`, leaders.length);

	return leaders.map((player) => ({
		rank: player.rank,
		value: player.value,
		name: player.person.fullName,
		id: player.person.id,
		team: player.team.name,
		teamId: player.team.id
	}));
}

async function fetchTopTeamsOverall() {
	const currentYear = new Date().getFullYear();
	const url = `https://statsapi.mlb.com/api/v1/standings?leagueId=103,104&season=${currentYear}&standingsTypes=regularSeason`;

	const response = await fetch(url);
	if (!response.ok) throw new Error('Failed to pull standings records');

	const data = await response.json();

	console.log('[API Debug] Standings raw data root keys:', Object.keys(data));
	console.log('[API Debug] Standings division records count:', data.records?.length);

	const allTeams = [];

	if (data.records) {
		data.records.forEach((division, divIndex) => {
			console.log(
				`[API Debug] Processing division index ${divIndex}:`,
				division.division?.name || 'Unknown Division',
				`| Team records found:`,
				!!division.teamRecords
			);

			if (division.teamRecords) {
				division.teamRecords.forEach((record) => {
					allTeams.push({
						name: record.team.name,
						teamId: record.team.id,
						wins: record.wins,
						losses: record.losses,
						pct: parseFloat(record.winningPercentage || 0)
					});
				});
			}
		});
	}

	console.log('[API Debug] Total compiled teams before sorting:', allTeams.length);

	const sortedTeams = allTeams.sort((a, b) => b.pct - a.pct);

	console.log('[API Debug] Final top 10 teams data:', sortedTeams.slice(0, 10));

	return sortedTeams;
}

export async function getHomePageSpotlight() {
	const [ops, era, topTeams] = await Promise.all([
		fetchTopLeaders('ops', 'hitting'),
		fetchTopLeaders('earnedRunAverage', 'pitching'),
		fetchTopTeamsOverall()
	]);

	return {
		ops: ops.slice(0, 10),
		era: era.slice(0, 10),
		topTeams: topTeams.slice(0, 10)
	};
}
