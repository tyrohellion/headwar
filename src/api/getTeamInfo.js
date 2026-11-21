export async function getTeamInfo(id, season) {
	const currentYear = new Date().getFullYear();
	const selectedSeason = Number(season) || currentYear;
	const isCurrentSeason = selectedSeason === currentYear;

	const startDate = new Date();
	const endDate = new Date();
	endDate.setDate(startDate.getDate() + 7);

	const formatDate = (date) => date.toISOString().split('T')[0];
	const startStr = formatDate(startDate);
	const endStr = formatDate(endDate);

	// depthChart is the current roster view and ignores the season query param,
	// so historical seasons need the season-aware active roster instead.
	const rosterType = isCurrentSeason ? 'depthChart' : 'active';
	const teamUrl = `https://statsapi.mlb.com/api/v1/teams/${id}`;
	const rosterUrl = `https://statsapi.mlb.com/api/v1/teams/${id}/roster?season=${selectedSeason}&rosterType=${rosterType}`;
	const standingsUrl = `https://statsapi.mlb.com/api/v1/standings?leagueId=103,104&season=${selectedSeason}&standingsTypes=regularSeason,wildCard`;
	const scheduleUrl = `https://statsapi.mlb.com/api/v1/schedule?teamId=${id}&sportId=1&startDate=${startStr}&endDate=${endStr}&hydrate=linescore,team`;

	try {
		const [teamRes, rosterRes, standingsRes, scheduleRes] = await Promise.all([
			fetch(teamUrl),
			fetch(rosterUrl),
			fetch(standingsUrl),
			isCurrentSeason ? fetch(scheduleUrl) : Promise.resolve(null)
		]);

		if (!teamRes.ok || !rosterRes.ok || !standingsRes.ok || (scheduleRes && !scheduleRes.ok)) {
			throw new Error('Failed to retrieve full profile asset bundles from MLB API');
		}

		const [teamData, rosterData, standingsData, scheduleData] = await Promise.all([
			teamRes.json(),
			rosterRes.json(),
			standingsRes.json(),
			scheduleRes ? scheduleRes.json() : Promise.resolve({})
		]);

		const teamProfile = teamData.teams?.[0] || {};
		const numericTeamId = Number(id);

		let divisionStandings = [];
		let playoffContext = {};
		let currentRecord = { wins: 0, losses: 0, winningPercentage: '.000' };

		if (standingsData.records) {
			// Find the team's row directly so pre-relocation seasons still resolve
			// when the franchise was in a different division or league.
			const targetDivisionRecord = standingsData.records.find(
				(record) =>
					record.standingsType === 'regularSeason' &&
					record.teamRecords?.some((tr) => tr.team?.id === numericTeamId)
			);

			if (targetDivisionRecord) {
				divisionStandings = targetDivisionRecord.teamRecords || [];

				const specificTeamRow = divisionStandings.find((tr) => tr.team?.id === numericTeamId);
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
					record.standingsType === 'wildCard' &&
					record.teamRecords?.some((tr) => tr.team?.id === numericTeamId)
			);

			if (targetWildCardRecord?.teamRecords) {
				const wildCardRow = targetWildCardRecord.teamRecords.find(
					(tr) => tr.team?.id === numericTeamId
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
		if (isCurrentSeason && scheduleData.dates) {
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

		const firstYear = parseInt(teamProfile.firstYearOfPlay, 10);
		const startYear =
			Number.isFinite(firstYear) && firstYear <= currentYear ? firstYear : currentYear - 10;
		const seasons = [];
		for (let year = currentYear; year >= startYear; year--) {
			seasons.push(String(year));
		}

		const teamPayload = {
			id: teamProfile.id,
			name: teamProfile.name,
			teamName: teamProfile.teamName,
			abbreviation: teamProfile.abbreviation,
			venue: teamProfile.venue,
			division: teamProfile.division,
			league: teamProfile.league,
			season: String(selectedSeason),
			seasons,
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
