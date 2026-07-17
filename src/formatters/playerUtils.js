export function findStatBlock(playerProfile, group, typePreferred, isDateFilterActive = false) {
	if (!playerProfile?.stats) return null;

	const targetType = isDateFilterActive ? 'bydaterange' : typePreferred;

	return playerProfile.stats.find((s) => {
		const groupName = (s.group?.name || s.group?.displayName || '').toLowerCase();
		const typeName = (s.type?.code || s.type?.displayName || '').toLowerCase();
		return groupName === group && typeName === targetType;
	});
}

export function sumInningsPitched(inningsArray) {
	let totalOuts = 0;
	inningsArray.forEach((inn) => {
		const [whole, partial] = String(inn || '0').split('.');
		const wholeInnings = parseInt(whole, 10) || 0;
		const outs = parseInt(partial, 10) || 0;
		totalOuts += wholeInnings * 3 + outs;
	});
	const finalInnings = Math.floor(totalOuts / 3);
	const finalOuts = totalOuts % 3;
	return `${finalInnings}.${finalOuts}`;
}

export function calculateActiveHittingStats({
	isCareerMode,
	isDateFilterActive,
	userSelectedYear,
	userSelectedTeam = 'ALL',
	careerStatsBlock,
	hittingStatsBlock
}) {
	if (isCareerMode && !isDateFilterActive) {
		return careerStatsBlock?.splits?.[0]?.stat || null;
	}
	if (!hittingStatsBlock?.splits) return null;

	let activeSplits = [];
	if (isDateFilterActive) {
		activeSplits = hittingStatsBlock.splits;
	} else {
		activeSplits = hittingStatsBlock.splits.filter((split) => split.season === userSelectedYear);
	}

	if (activeSplits.length === 0) return null;

	if (userSelectedTeam !== 'ALL') {
		const teamSplit = activeSplits.find(
			(split) => split.team && String(split.team.id) === String(userSelectedTeam)
		);
		return teamSplit ? teamSplit.stat : null;
	}

	if (isDateFilterActive) {
		if (activeSplits.length === 1) return activeSplits[0].stat;
		const aggregatedSplit = activeSplits.find(
			(split) => split.sport?.code?.toLowerCase() === 'all' || split.sport?.id === 0
		);
		return aggregatedSplit ? aggregatedSplit.stat : activeSplits[0].stat;
	}

	if (activeSplits.length === 1) return activeSplits[0].stat;

	const totalSplit = activeSplits.find(
		(split) =>
			!split.team || split.team?.id === undefined || String(split.team?.name).includes('teams')
	);

	return totalSplit ? totalSplit.stat : activeSplits[0].stat;
}

export function calculateActivePitchingStats({
	isCareerMode,
	isDateFilterActive,
	userSelectedYear,
	userSelectedTeam = 'ALL',
	careerPitchingStatsBlock,
	pitchingStatsBlock
}) {
	if (isCareerMode && !isDateFilterActive) {
		return careerPitchingStatsBlock?.splits?.[0]?.stat || null;
	}
	if (!pitchingStatsBlock?.splits) return null;

	let activeSplits = [];
	if (isDateFilterActive) {
		activeSplits = pitchingStatsBlock.splits;
	} else {
		activeSplits = pitchingStatsBlock.splits.filter((split) => split.season === userSelectedYear);
	}

	if (activeSplits.length === 0) return null;

	if (userSelectedTeam !== 'ALL') {
		const teamSplit = activeSplits.find(
			(split) => split.team && String(split.team.id) === String(userSelectedTeam)
		);
		return teamSplit ? teamSplit.stat : null;
	}

	if (isDateFilterActive) {
		if (activeSplits.length === 1) return activeSplits[0].stat;
		const aggregatedSplit = activeSplits.find(
			(split) => split.sport?.code?.toLowerCase() === 'all' || split.sport?.id === 0
		);
		return aggregatedSplit ? aggregatedSplit.stat : activeSplits[0].stat;
	}

	if (activeSplits.length === 1) return activeSplits[0].stat;

	const individualTeamStints = activeSplits.filter(
		(split) =>
			split.team &&
			split.team.id !== undefined &&
			!String(split.team.name).toLowerCase().includes('teams')
	);

	if (individualTeamStints.length === 0) return activeSplits[0].stat;
	if (individualTeamStints.length === 1) return individualTeamStints[0].stat;

	const aggregatedStat = { ...individualTeamStints[0].stat };
	const allIPs = individualTeamStints.map((split) => split.stat.inningsPitched);
	aggregatedStat.inningsPitched = sumInningsPitched(allIPs);

	const countingStats = [
		'gamesPlayed',
		'gamesStarted',
		'wins',
		'losses',
		'strikeOuts',
		'baseOnBalls',
		'hits',
		'runs',
		'earnedRuns'
	];

	countingStats.forEach((key) => {
		if (key in aggregatedStat) {
			aggregatedStat[key] = individualTeamStints.reduce(
				(sum, split) => sum + (split.stat[key] || 0),
				0
			);
		}
	});

	if (aggregatedStat.earnedRuns !== undefined && aggregatedStat.inningsPitched) {
		const [fullInnings, outs] = String(aggregatedStat.inningsPitched).split('.').map(Number);
		const totalInningsFloat = fullInnings + (outs || 0) / 3;

		if (totalInningsFloat > 0) {
			aggregatedStat.era = ((aggregatedStat.earnedRuns * 9) / totalInningsFloat).toFixed(2);
		}
	}

	return aggregatedStat;
}

export function calculateActiveFieldingStats({
	isCareerMode,
	isDateFilterActive,
	userSelectedYear,
	userSelectedFieldingPosition,
	userSelectedTeam = 'ALL',
	fieldingStatsBlock
}) {
	if (!fieldingStatsBlock?.splits) return null;

	let targetSplits = isDateFilterActive
		? fieldingStatsBlock.splits
		: isCareerMode
			? fieldingStatsBlock.splits
			: fieldingStatsBlock.splits.filter((s) => s.season === userSelectedYear);

	if (userSelectedTeam !== 'ALL') {
		targetSplits = targetSplits.filter(
			(split) => split.team && String(split.team.id) === String(userSelectedTeam)
		);
	}

	targetSplits = targetSplits.filter(
		(s) =>
			(s.position?.name || s.position?.displayName) !== 'Designated Hitter' &&
			s.position?.abbreviation !== 'DH'
	);

	if (userSelectedFieldingPosition !== 'ALL') {
		const positionAbbrevMap = {
			'Left Field': 'LF',
			'Center Field': 'CF',
			'Right Field': 'RF',
			Outfielder: 'OF'
		};
		const targetAbbrev = positionAbbrevMap[userSelectedFieldingPosition];

		targetSplits = targetSplits.filter((s) => {
			const name = s.position?.name || s.position?.displayName;
			const abbrev = s.position?.abbreviation;
			return name === userSelectedFieldingPosition || (targetAbbrev && abbrev === targetAbbrev);
		});
	}

	if (targetSplits.length === 0) return null;
	if (targetSplits.length === 1) return targetSplits[0].stat;

	const aggregated = {
		games: 0,
		gamesPlayed: 0,
		gamesStarted: 0,
		chances: 0,
		putOuts: 0,
		assists: 0,
		errors: 0,
		doublePlays: 0,
		triplePlays: 0,
		caughtStealing: 0,
		stolenBases: 0,
		passedBall: 0,
		throwingErrors: 0,
		innings: 0,
		catcherERA: 0,
		rangeFactorPerGame: 0,
		rangeFactorPer9Inn: 0,
		fielding: 0
	};

	let totalCatcherInnings = 0;

	targetSplits.forEach(({ stat }) => {
		if (!stat) return;
		aggregated.games += stat.games || 0;
		aggregated.gamesPlayed += stat.gamesPlayed || 0;
		aggregated.gamesStarted += stat.gamesStarted || 0;
		aggregated.chances += stat.chances || 0;
		aggregated.putOuts += stat.putOuts || 0;
		aggregated.assists += stat.assists || 0;
		aggregated.errors += stat.errors || 0;
		aggregated.doublePlays += stat.doublePlays || 0;
		aggregated.triplePlays += stat.triplePlays || 0;
		aggregated.caughtStealing += stat.caughtStealing || 0;
		aggregated.stolenBases += stat.stolenBases || 0;
		aggregated.passedBall += stat.passedBall || 0;
		aggregated.throwingErrors += stat.throwingErrors || 0;

		const innStr = String(stat.innings || '0');
		const [whole, partial] = innStr.split('.');
		let decimalInnings = parseInt(whole, 10) || 0;
		if (partial === '1') decimalInnings += 0.333;
		if (partial === '2') decimalInnings += 0.666;
		aggregated.innings += decimalInnings;

		if (stat.catcherERA && parseFloat(stat.catcherERA) > 0) {
			const cInn = parseFloat(stat.innings || 0);
			aggregated.catcherERA += parseFloat(stat.catcherERA) * cInn;
			totalCatcherInnings += cInn;
		}
	});

	if (aggregated.chances > 0) {
		aggregated.fielding = ((aggregated.putOuts + aggregated.assists) / aggregated.chances).toFixed(
			3
		);
	} else {
		aggregated.fielding = '.000';
	}

	if (aggregated.games > 0) {
		aggregated.rangeFactorPerGame = (
			(aggregated.putOuts + aggregated.assists) /
			aggregated.games
		).toFixed(2);
	}

	if (aggregated.innings > 0) {
		aggregated.rangeFactorPer9Inn = (
			((aggregated.putOuts + aggregated.assists) * 9) /
			aggregated.innings
		).toFixed(2);
	}

	if (totalCatcherInnings > 0 && !isNaN(aggregated.catcherERA)) {
		aggregated.catcherERA = (aggregated.catcherERA / totalCatcherInnings).toFixed(2);
	} else {
		aggregated.catcherERA = 'N/A';
	}

	if (totalCatcherInnings === 0) {
		aggregated.catcherERA = 'N/A';
		aggregated.passedBall = 'N/A';
		aggregated.caughtStealing = 'N/A';
		aggregated.stolenBases = 'N/A';
	}

	const wholeInnings = Math.floor(aggregated.innings);
	const remainder = aggregated.innings - wholeInnings;
	let partialStr = '0';
	if (remainder > 0.2 && remainder < 0.5) partialStr = '1';
	if (remainder > 0.5) partialStr = '2';
	aggregated.innings = `${wholeInnings}.${partialStr}`;

	return aggregated;
}

export function getAvailableFieldingPositions(fieldingStatsBlock, userSelectedYear, isCareerMode) {
	if (!fieldingStatsBlock?.splits) return [];

	const targetSplits = isCareerMode
		? fieldingStatsBlock.splits
		: fieldingStatsBlock.splits.filter((s) => s.season === userSelectedYear);

	const positionMap = {
		LF: 'Left Field',
		CF: 'Center Field',
		RF: 'Right Field',
		OF: 'Outfielder'
	};

	const positions = targetSplits
		.map((s) => {
			const abbrev = s.position?.abbreviation;
			return positionMap[abbrev] || s.position?.name || s.position?.displayName;
		})
		.filter((posName) => posName && posName !== 'Designated Hitter');

	return [...new Set(positions)];
}
