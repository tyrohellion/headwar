export async function getPlayerInfo(id, { season, startDate, endDate, gameType } = {}) {
	const isDateRange = !!(startDate && endDate);

	const buildStatParams = (gt) => {
		const statType = isDateRange ? 'byDateRange' : 'yearByYear,career';
		const statParams = ['group=[hitting,pitching,fielding]', `type=[${statType}]`];

		if (isDateRange) {
			statParams.push(`startDate=${startDate}`, `endDate=${endDate}`);
			if (season) statParams.push(`season=${season}`);
		}

		if (gt) statParams.push(`gameType=${gt}`);

		return statParams;
	};

	const fetchInfo = async (gt) => {
		const hydrations = ['currentTeam', 'awards', `stats(${buildStatParams(gt).join(',')})`].join(
			','
		);

		const res = await fetch(`https://statsapi.mlb.com/api/v1/people/${id}?hydrate=${hydrations}`);

		if (!res.ok) {
			throw new Error('Failed to fetch player');
		}

		return res.json();
	};

	// A date range can straddle the regular season and the postseason, so fetch
	// both scopes and merge them. statsapi's byDateRange defaults to regular
	// season games only, which is why we ask for gameType=P separately.
	if (isDateRange) {
		const [regular, postseason] = await Promise.all([fetchInfo('R'), fetchInfo('P')]);
		return combineScopes(regular, postseason);
	}

	if (gameType && gameType !== 'R') {
		return fetchInfo(gameType);
	}

	return fetchInfo(null);
}

/**
 * Merges the regular-season and postseason responses for a date range. Hitting
 * and pitching counting stats are summed and their rates recomputed; fielding
 * splits from both scopes are concatenated so the page can aggregate them.
 */
function combineScopes(regular, postseason) {
	const person = regular?.people?.[0];
	if (!person) return regular;

	const postStats = postseason?.people?.[0]?.stats || [];
	const postByGroup = new Map(
		postStats.map((block) => [groupName(block), block])
	);

	const seen = new Set();
	const combined = [];

	for (const block of person.stats || []) {
		const group = groupName(block);
		seen.add(group);

		if (group === 'fielding') {
			combined.push(mergeFieldingBlock(block, postByGroup.get('fielding')));
			continue;
		}

		if (group !== 'hitting' && group !== 'pitching') {
			combined.push(block);
			continue;
		}

		const postBlock = postByGroup.get(group);
		const stat = combineStats(
			group,
			aggregateStat(block),
			postBlock ? aggregateStat(postBlock) : null
		);
		combined.push(stat ? { ...block, splits: [{ sport: { id: 0, code: 'All' }, stat }] } : block);
	}

	// A group can exist in the postseason response but not the regular-season
	// one (e.g. a player who only pitched in the playoffs), so carry those over.
	for (const block of postStats) {
		const group = groupName(block);
		if (seen.has(group)) continue;

		if (group === 'fielding') {
			combined.push(mergeFieldingBlock(null, block));
			continue;
		}

		if (group !== 'hitting' && group !== 'pitching') continue;
		const stat = aggregateStat(block);
		if (stat) combined.push({ ...block, splits: [{ sport: { id: 0, code: 'All' }, stat }] });
	}

	person.stats = combined;

	return regular;
}

/**
 * Combines regular-season and postseason fielding blocks. Fielding byDateRange
 * returns each position twice (once under sport id 1 / MLB and once under
 * sport id 0 / All) with no `position` field, so we keep only the "All" copies
 * to avoid double counting. Splits with no defensive innings (designated hitter
 * appearances, which the season view filters out by position) are dropped. The
 * remaining splits are aggregated into a single split with exact innings and a
 * weighted catcher ERA.
 */
function mergeFieldingBlock(regular, postseason) {
	const template = regular || postseason;
	const stat = combineFielding(regular, postseason);

	return stat ? { ...template, splits: [{ sport: { id: 0, code: 'All' }, stat }] } : template;
}

function combineFielding(regular, postseason) {
	const splits = [...fieldingSplits(regular), ...fieldingSplits(postseason)];
	if (!splits.length) return null;

	const out = {
		games: 0,
		gamesPlayed: 0,
		gamesStarted: 0,
		chances: 0,
		putOuts: 0,
		assists: 0,
		errors: 0,
		doublePlays: 0,
		triplePlays: 0,
		throwingErrors: 0
	};

	let outs = 0;
	let catcherOuts = 0;
	let catcherEraOuts = 0;
	let caughtStealing = 0;
	let stolenBases = 0;
	let passedBall = 0;

	for (const split of splits) {
		const stat = split.stat;
		if (!stat) continue;

		for (const key of Object.keys(out)) out[key] += toNumber(stat[key]);

		const splitOuts = inningsToOuts(stat.innings);
		outs += splitOuts;

		const catcherEra = toNumber(stat.catcherERA);
		if (catcherEra > 0) {
			catcherOuts += splitOuts;
			catcherEraOuts += catcherEra * splitOuts;
			caughtStealing += toNumber(stat.caughtStealing);
			stolenBases += toNumber(stat.stolenBases);
			passedBall += toNumber(stat.passedBall);
		}
	}

	const ip = outs / 3;
	const range = out.putOuts + out.assists;

	out.innings = outsToInnings(outs);
	out.fielding = out.chances > 0 ? rate(range / out.chances) : '.000';
	out.rangeFactorPerGame = out.games > 0 ? (range / out.games).toFixed(2) : '0.00';
	out.rangeFactorPer9Inn = ip > 0 ? ((range * 9) / ip).toFixed(2) : '0.00';

	// Catcher-specific keys are left undefined for non-catchers so the page
	// shows "-.--" instead of a bogus value.
	if (catcherOuts > 0) {
		out.catcherERA = (catcherEraOuts / catcherOuts).toFixed(2);
		out.caughtStealing = caughtStealing;
		out.stolenBases = stolenBases;
		out.passedBall = passedBall;
	}

	return out;
}

function fieldingSplits(block) {
	const splits = block?.splits || [];
	const all = splits.filter(
		(split) =>
			split.sport?.id === 0 || String(split.sport?.code).toLowerCase() === 'all'
	);
	const chosen = all.length ? all : splits;

	return chosen.filter(
		(split) =>
			!split.stat ||
			split.stat.innings === undefined ||
			toNumber(split.stat.innings) > 0 ||
			toNumber(split.stat.chances) > 0
	);
}

function groupName(block) {
	return (block?.group?.name || block?.group?.displayName || '').toLowerCase();
}

function aggregateStat(block) {
	const splits = block?.splits || [];
	const all = splits.find(
		(split) =>
			split.sport?.id === 0 || String(split.sport?.code).toLowerCase() === 'all'
	);
	return all?.stat || splits[0]?.stat || null;
}

function combineStats(group, a, b) {
	if (!a) return b;
	if (!b) return a;

	const out = {};
	const keys = new Set([...Object.keys(a), ...Object.keys(b)]);

	for (const key of keys) {
		const va = a[key];
		const vb = b[key];

		// Counting stats are plain numbers, so they add cleanly. Derived stats
		// (averages, rates, innings) come back as strings and are recomputed below.
		if (typeof va === 'number' && typeof vb === 'number') {
			out[key] = va + vb;
		} else if (typeof va === 'number') {
			out[key] = va;
		} else if (typeof vb === 'number') {
			out[key] = vb;
		} else {
			out[key] = va !== undefined ? va : vb;
		}
	}

	if (group === 'hitting') recomputeHitting(out);
	if (group === 'pitching') recomputePitching(out);

	return out;
}

function toNumber(value) {
	const n = typeof value === 'number' ? value : parseFloat(value);
	return Number.isFinite(n) ? n : 0;
}

function rate(value) {
	return value.toFixed(3).replace(/^0/, '');
}

function inningsToOuts(innings) {
	const [whole, frac] = String(innings ?? '0').split('.');
	return (parseInt(whole, 10) || 0) * 3 + (parseInt(frac, 10) || 0);
}

function outsToInnings(outs) {
	return `${Math.floor(outs / 3)}.${outs % 3}`;
}

function recomputeHitting(out) {
	const ab = toNumber(out.atBats);
	const h = toNumber(out.hits);
	const bb = toNumber(out.baseOnBalls);
	const hbp = toNumber(out.hitByPitch);
	const sf = toNumber(out.sacFlies);
	const hr = toNumber(out.homeRuns);
	const doubles = toNumber(out.doubles);
	const triples = toNumber(out.triples);
	const so = toNumber(out.strikeOuts);
	const sb = toNumber(out.stolenBases);
	const cs = toNumber(out.caughtStealing);
	const groundOuts = toNumber(out.groundOuts);
	const airOuts = toNumber(out.airOuts);

	const totalBases = h + doubles + 2 * triples + 3 * hr;
	out.totalBases = totalBases;

	const avg = ab > 0 ? h / ab : 0;
	const obp = ab + bb + hbp + sf > 0 ? (h + bb + hbp) / (ab + bb + hbp + sf) : 0;
	const slg = ab > 0 ? totalBases / ab : 0;

	out.avg = rate(avg);
	out.obp = rate(obp);
	out.slg = rate(slg);
	out.ops = (obp + slg).toFixed(3);

	const babipDenom = ab - so - hr + sf;
	out.babip = babipDenom > 0 ? rate((h - hr) / babipDenom) : '.000';

	const stealDenom = sb + cs;
	out.stolenBasePercentage = stealDenom > 0 ? rate(sb / stealDenom) : '.000';
	out.caughtStealingPercentage = stealDenom > 0 ? rate(cs / stealDenom) : '.000';

	out.groundOutsToAirouts = airOuts > 0 ? (groundOuts / airOuts).toFixed(2) : '0.00';
	out.atBatsPerHomeRun = hr > 0 ? (ab / hr).toFixed(2) : '0.00';
}

function recomputePitching(out) {
	const outs = toNumber(out.outs) || inningsToOuts(out.inningsPitched);
	const ip = outs / 3;
	const h = toNumber(out.hits);
	const bb = toNumber(out.baseOnBalls);
	const hbp = toNumber(out.hitByPitch);
	const sf = toNumber(out.sacFlies);
	const ab = toNumber(out.atBats);
	const hr = toNumber(out.homeRuns);
	const doubles = toNumber(out.doubles);
	const triples = toNumber(out.triples);
	const er = toNumber(out.earnedRuns);
	const so = toNumber(out.strikeOuts);
	const runs = toNumber(out.runs);
	const groundOuts = toNumber(out.groundOuts);
	const airOuts = toNumber(out.airOuts);
	const pitches = toNumber(out.numberOfPitches);
	const strikes = toNumber(out.strikes);
	const wins = toNumber(out.wins);
	const losses = toNumber(out.losses);

	out.outs = outs;
	out.inningsPitched = outsToInnings(outs);
	out.era = ip > 0 ? ((er * 9) / ip).toFixed(2) : '0.00';
	out.whip = ip > 0 ? ((bb + h) / ip).toFixed(2) : '0.00';
	out.strikeoutsPer9Inn = ip > 0 ? ((so * 9) / ip).toFixed(2) : '0.00';
	out.walksPer9Inn = ip > 0 ? ((bb * 9) / ip).toFixed(2) : '0.00';
	out.hitsPer9Inn = ip > 0 ? ((h * 9) / ip).toFixed(2) : '0.00';
	out.runsScoredPer9 = ip > 0 ? ((runs * 9) / ip).toFixed(2) : '0.00';
	out.homeRunsPer9 = ip > 0 ? ((hr * 9) / ip).toFixed(2) : '0.00';
	out.pitchesPerInning = ip > 0 ? (pitches / ip).toFixed(2) : '0.00';
	out.strikePercentage = pitches > 0 ? rate(strikes / pitches) : '.000';
	out.strikeoutWalkRatio = bb > 0 ? (so / bb).toFixed(2) : '0.00';
	out.winPercentage = wins + losses > 0 ? rate(wins / (wins + losses)) : '.000';
	out.groundOutsToAirouts = airOuts > 0 ? (groundOuts / airOuts).toFixed(2) : '0.00';

	const totalBases = h + doubles + 2 * triples + 3 * hr;
	out.totalBases = totalBases;

	const oppAvg = ab > 0 ? h / ab : 0;
	const oppObp = ab + bb + hbp + sf > 0 ? (h + bb + hbp) / (ab + bb + hbp + sf) : 0;
	const oppSlg = ab > 0 ? totalBases / ab : 0;
	out.avg = rate(oppAvg);
	out.obp = rate(oppObp);
	out.slg = rate(oppSlg);
	out.ops = (oppObp + oppSlg).toFixed(3);
}
