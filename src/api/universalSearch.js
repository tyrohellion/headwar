const LEAGUE_LABELS = {
	1: 'MLB',
	11: 'AAA',
	12: 'AA',
	13: 'A+',
	14: 'A'
};

const LEAGUE_PRESTIGE = {
	1: 1, // MLB
	11: 2, // AAA
	12: 3, // AA
	13: 4, // High-A
	14: 5 // Single-A
};

const TARGET_SPORTS = '1,11,12,13,14';
const CURRENT_SEASON = '2026';

export async function searchEverything(queryString) {
	if (!queryString.trim()) return { players: [], teams: [] };

	const cleanQuery = encodeURIComponent(queryString.trim().toLowerCase());
	const playerUrl = `https://statsapi.mlb.com/api/v1/people/search?names=${cleanQuery}&sportId=${TARGET_SPORTS}`;
	const teamUrl = `https://statsapi.mlb.com/api/v1/teams?sportIds=${TARGET_SPORTS}&season=${CURRENT_SEASON}`;

	try {
		const [playerRes, teamRes] = await Promise.all([fetch(playerUrl), fetch(teamUrl)]);

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
				const nameMatches = team.name.toLowerCase().includes(queryString.toLowerCase());
				const abbrevMatches =
					team.abbreviation && team.abbreviation.toLowerCase() === queryString.toLowerCase();
				return nameMatches || abbrevMatches;
			})
			.sort((a, b) => {
				const prestigeA = LEAGUE_PRESTIGE[a.sport?.id?.toString()] || 99;
				const prestigeB = LEAGUE_PRESTIGE[b.sport?.id?.toString()] || 99;
				return prestigeA - prestigeB;
			});

		return {
			players: sortedPlayers.slice(0, 10).map((player) => {
				const sportIdStr = player.sport?.id?.toString();

				const explicitLeague = LEAGUE_LABELS[sportIdStr] || 'MLB';

				return {
					id: player.id,
					name: player.fullName,
					position: player.primaryPosition?.abbreviation || '',
					currentTeam: player.currentTeam?.name || 'Historical / Free Agent',
					headshot: `https://img.mlbstatic.com/mlb-photos/image/upload/c_fill,g_auto/w_50,d_people:generic:headshot:67:current.png,q_auto:best/v1/people/${player.id}/headshot/67/current`
				};
			}),
			teams: filteredTeams.slice(0, 5).map((team) => {
				const sportIdStr = team.sport?.id?.toString();
				return {
					id: team.id,
					name: team.name,
					abbreviation: team.abbreviation || '',
					leagueName: team.league?.name || '',
					logo: `https://www.mlbstatic.com/team-logos/${team.id}.svg`
				};
			})
		};
	} catch (err) {
		console.error('Unified search pipeline error:', err);
		return { players: [], teams: [] };
	}
}
