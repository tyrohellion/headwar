export async function getTeamInfo(id) {
	const currentYear = new Date().getFullYear();

	const startDate = new Date();
	const endDate = new Date();
	endDate.setDate(startDate.getDate() + 7);

	const formatDate = (date) => date.toISOString().split('T')[0];
	const startStr = formatDate(startDate);
	const endStr = formatDate(endDate);

	const teamUrl = `https://statsapi.mlb.com/api/v1/teams/${id}`;
	const rosterUrl = `https://statsapi.mlb.com/api/v1/teams/${id}/roster?season=${currentYear}&rosterType=depthChart`;
	const standingsUrl = `https://statsapi.mlb.com/api/v1/standings?leagueId=103,104&season=${currentYear}&standingsTypes=regularSeason,wildCard`;
	const scheduleUrl = `https://statsapi.mlb.com/api/v1/schedule?teamId=${id}&sportId=1&startDate=${startStr}&endDate=${endStr}`;

	try {
		const [teamRes, rosterRes, standingsRes, scheduleRes] = await Promise.all([
			fetch(teamUrl),
			fetch(rosterUrl),
			fetch(standingsUrl),
			fetch(scheduleUrl)
		]);

		if (!teamRes.ok || !rosterRes.ok || !standingsRes.ok || !scheduleRes.ok) {
			throw new Error('Failed to retrieve full profile asset bundles from MLB API');
		}

		const [teamData, rosterData, standingsData, scheduleData] = await Promise.all([
			teamRes.json(),
			rosterRes.json(),
			standingsRes.json(),
			scheduleRes.json()
		]);

		const teamProfile = teamData.teams?.[0] || {};
		const divisionId = teamProfile.division?.id;

		let divisionStandings = [];
		let playoffContext = {};
		let currentRecord = { wins: 0, losses: 0, winningPercentage: '.000' };

		if (standingsData.records) {
			const targetDivisionRecord = standingsData.records.find(
				(record) => record.standingsType === 'regularSeason' && record.division?.id === divisionId
			);

			if (targetDivisionRecord) {
				divisionStandings = targetDivisionRecord.teamRecords || [];

				const specificTeamRow = divisionStandings.find((tr) => tr.team?.id === Number(id));
				if (specificTeamRow) {
					currentRecord = {
						wins: specificTeamRow.wins,
						losses: specificTeamRow.losses,
						winningPercentage: specificTeamRow.winningPercentage,
						gamesBack: specificTeamRow.gamesBack,
						divisionRank: specificTeamRow.divisionRank
					};
				}
			}

			const targetWildCardRecord = standingsData.records.find(
				(record) =>
					record.standingsType === 'wildCard' && record.league?.id === teamProfile.league?.id
			);

			if (targetWildCardRecord?.teamRecords) {
				const wildCardRow = targetWildCardRecord.teamRecords.find(
					(tr) => tr.team?.id === Number(id)
				);
				if (wildCardRow) {
					playoffContext = {
						wildCardRank: wildCardRow.wildCardRank,
						wildCardLeader: wildCardRow.wildCardLeader,
						wildCardGamesBack: wildCardRow.wildCardGamesBack,
						clinchIndicator: wildCardRow.clinchIndicator || null
					};
				}
			}
		}

		const upcomingGames = [];
		if (scheduleData.dates) {
			scheduleData.dates.forEach((dateBlock) => {
				if (dateBlock.games) {
					upcomingGames.push(...dateBlock.games);
				}
			});
		}

		const rawRoster = rosterData.roster || [];
		const seenPlayerIds = new Set();
		const deduplicatedRoster = [];

		for (const player of rawRoster) {
			const playerId = player.person?.id;
			if (playerId && !seenPlayerIds.has(playerId)) {
				seenPlayerIds.add(playerId);
				deduplicatedRoster.push(player);
			}
		}

		const teamPayload = {
			id: teamProfile.id,
			name: teamProfile.name,
			teamName: teamProfile.teamName,
			abbreviation: teamProfile.abbreviation,
			venue: teamProfile.venue,
			division: teamProfile.division,
			league: teamProfile.league,
			record: currentRecord,
			roster: deduplicatedRoster,
			playoffStanding: playoffContext,
			divisionStandings: divisionStandings,
			upcomingSchedule: upcomingGames
		};

		return teamPayload;
	} catch (error) {
		console.error(`Error aggregating data inside getTeamInfo for team ${id}:`, error);
		throw error;
	}
}
