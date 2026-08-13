import { getLeagueContext } from './leagueContext.js';

// headwar's hWAR metrics, built on the MLB Stats API season stat objects
// already fetched on the player page. The formulas approximate FanGraphs'
// published methodology but are not byte-for-byte reproductions (we skip
// infield-fly FIP, leverage, and park adjustments), so the result is branded
// hWAR rather than fWAR.
//
// The replacement levels, positional-adjustment scale and closer bonus were
// calibrated against FanGraphs' fWAR so hWAR tracks it as closely as possible.

// Replacement level for pitchers, in wins per 9 innings above average.
export const PITCHER_REPLACEMENT_STARTER = 0.135;
export const PITCHER_REPLACEMENT_RELIEVER = 0.03;

// FanGraphs prices leverage into reliever WAR (WPA), which a flat FIP model
// misses. Closers convert their save chances in the highest-leverage innings,
// so we add a per-save bonus for pure relievers as a leverage proxy.
export const CLOSER_SAVE_BONUS = 0.025;

// Replacement level for position players, in runs per 600 plate appearances.
export const HITTER_REPLACEMENT_RUNS_PER_600 = 18;

// FanGraphs' positional adjustments (per 162 games) are applied at this
// scale; the calibration converged on a slightly steeper curve.
export const POSITIONAL_ADJUSTMENT_SCALE = 0.7;

// Batting runs now come from FanGraphs' wOBA-based wRAA (see
// computeWobaBattingRuns); baserunning and fielding still come from Statcast.
// The Statcast components run slightly hot against the wOBA-based batting, so
// the whole run block is scaled before the positional adjustment and
// replacement are added.
export const HITTER_RUN_VALUE_SCALE = 0.94;

// FanGraphs positional adjustments, in runs per 162 games.
export const POSITION_ADJUSTMENT = {
	C: 12.5,
	SS: 7.5,
	'2B': 2.5,
	'3B': 2.5,
	CF: 2.5,
	LF: -7.5,
	RF: -7.5,
	'1B': -12.5,
	DH: -17.5,
	P: 0
};

const POSITION_ABBR_MAP = {
	OF: 'LF',
	'Left Field': 'LF',
	'Center Field': 'CF',
	'Right Field': 'RF',
	Outfielder: 'LF',
	Catcher: 'C',
	'First Base': '1B',
	'Second Base': '2B',
	'Third Base': '3B',
	Shortstop: 'SS',
	'Designated Hitter': 'DH',
	Pitcher: 'P'
};

// Fielding splits exclude DH games, so when gamesPlayed is provided any
// unaccounted games are treated as DH time (FanGraphs does the same when
// assigning its positional adjustments).
function filteredFieldingSplits(fieldingSplits = [], { season, isCareerMode } = {}) {
	return isCareerMode
		? fieldingSplits
		: fieldingSplits.filter((s) => Number(s.season) === Number(season));
}

// Tally games by defensive position from the MLB fielding splits, plus total
// defensive games (pitching games count toward that total so they offset any
// residual DH time, but a two-way player's pitching games carry a pitcher
// positional adjustment of zero rather than being misread as DH).
export function computeGamesByPosition(fieldingSplits = [], { season, isCareerMode } = {}) {
	const gamesByPosition = {};
	let defensiveGames = 0;
	for (const split of filteredFieldingSplits(fieldingSplits, { season, isCareerMode })) {
		const abbr = split.position?.abbreviation || split.position?.name;
		if (!abbr || abbr === 'DH') continue;
		const games = Number(split.stat?.gamesPlayed) || 0;
		defensiveGames += games;
		gamesByPosition[abbr] = gamesByPosition[abbr] || 0;
		gamesByPosition[abbr] += games;
	}
	return { gamesByPosition, defensiveGames };
}

// FanGraphs' positional adjustment is applied per 162 games of playing time at
// each position, so a catcher who DHs a lot only gets partial catcher credit.
// MLB gives us games (not innings) per position, so the adjustment is the
// games-weighted sum of the per-position values. Any games not accounted for
// by the fielding splits are treated as DH time.
export function computePositionalAdjustmentRuns(gamesByPosition, gamesPlayed) {
	const games = { ...(gamesByPosition || {}) };
	const defensiveGames = Object.values(games).reduce((sum, n) => sum + n, 0);
	if (gamesPlayed != null) {
		const dhGames = Math.max(Number(gamesPlayed) - defensiveGames, 0);
		if (dhGames > 0) games.DH = (games.DH || 0) + dhGames;
	}
	let runs = 0;
	for (const [abbr, count] of Object.entries(games)) {
		runs += (POSITION_ADJUSTMENT[abbr] ?? 0) * count;
	}
	return runs / 162;
}

// The MLB API lists two-way players as "TWP" and primary positions do not
// reflect where a player actually spent time in the field. Resolve the
// defensive position from the per-position fielding splits (most games played
// in the active period), falling back to the primary position, then DH, and
// finally pitcher.
export function deriveFieldingPosition(
	primaryAbbreviation,
	fieldingSplits = [],
	{ season, isCareerMode, gamesPlayed } = {}
) {
	const { gamesByPosition, defensiveGames } = computeGamesByPosition(fieldingSplits, {
		season,
		isCareerMode
	});

	if (gamesPlayed != null) {
		const dhGames = Math.max(Number(gamesPlayed) - defensiveGames, 0);
		if (dhGames > 0) gamesByPosition.DH = dhGames;
	}

	let best = null;
	let bestGames = 0;
	for (const [abbr, games] of Object.entries(gamesByPosition)) {
		if (abbr === 'P') continue;
		if (games > bestGames) {
			bestGames = games;
			best = abbr;
		}
	}
	if (best) return POSITION_ABBR_MAP[best] || best;
	if (primaryAbbreviation === 'P') return 'P';
	if (primaryAbbreviation === 'TWP') return 'DH';
	return primaryAbbreviation || 'DH';
}

// MLB Stats API reports innings as "47.2" meaning 47 2/3, so the .1/.2 are
// outs, not tenths of an inning.
export function inningsToDecimal(innings) {
	if (innings == null) return 0;
	const str = String(innings);
	const [whole, partial] = str.split('.');
	const full = parseInt(whole, 10) || 0;
	const outs = parseInt(partial, 10) || 0;
	return full + outs / 3;
}

function toNumber(value) {
	const num = Number(value);
	return Number.isFinite(num) ? num : 0;
}

// FIP = (13*HR + 3*(BB+HBP) - 2*K) / IP + constant
// The constant is chosen per season so league-average FIP equals league ERA.
export function computeFip(stat, context = getLeagueContext(stat?.season)) {
	const ip = inningsToDecimal(stat?.inningsPitched);
	if (!stat || !ip || ip <= 0) return null;

	const homeRuns = toNumber(stat.homeRuns);
	const baseOnBalls = toNumber(stat.baseOnBalls);
	const hitByPitch = toNumber(stat.hitByPitch);
	const strikeOuts = toNumber(stat.strikeOuts);

	return (
		(13 * homeRuns + 3 * (baseOnBalls + hitByPitch) - 2 * strikeOuts) / ip + context.fipConstant
	);
}

// FanGraphs-style pitcher WAR from FIP:
//   hWAR = (WPGAA + Replacement Level) * (IP / 9) + Closer Bonus
//   WPGAA = (League FIP - FIP) / Runs Per Win
//   Replacement Level = STARTER * (GS/G) + RELIEVER * (1 - GS/G)
// League FIP is the league ERA (the FIP constant is built so the two are equal).
export function computePitcherHwar(stat, context = getLeagueContext(stat?.season)) {
	const fip = computeFip(stat, context);
	const ip = inningsToDecimal(stat?.inningsPitched);
	if (fip == null || !stat || !ip) return null;

	const games = toNumber(stat.gamesPlayed);
	const gamesStarted = toNumber(stat.gamesStarted);
	const startsShare = games > 0 ? Math.min(gamesStarted, games) / games : 0;
	const replacementLevel =
		PITCHER_REPLACEMENT_STARTER * startsShare + PITCHER_REPLACEMENT_RELIEVER * (1 - startsShare);

	const winsPerGameAboveAverage = (context.leagueEra - fip) / context.runsPerWin;
	let hwar = (winsPerGameAboveAverage + replacementLevel) * (ip / 9);

	if (startsShare === 0) {
		hwar += (toNumber(stat.saves) || 0) * CLOSER_SAVE_BONUS;
	}

	return { fip, hwar };
}

// wOBA is the value of a plate appearance in weighted-on-base terms, built
// from the same event weights FanGraphs publishes (the "guts" constants). It
// can be computed from the MLB Stats API hitting stat object, so no extra
// data fetch is needed. FanGraphs uses wRAA = ((wOBA - lgwOBA) / scale) * PA
// as its batting runs component.
export function computeWoba(stats, context = getLeagueContext()) {
	const w = context.woba;
	if (!stats || !w) return null;

	const atBats = toNumber(stats.atBats);
	const walks = toNumber(stats.baseOnBalls);
	const intentionalWalks = toNumber(stats.intentionalWalks);
	const hitByPitch = toNumber(stats.hitByPitch);
	const sacFlies = toNumber(stats.sacFlies);
	const hits = toNumber(stats.hits);
	const doubles = toNumber(stats.doubles);
	const triples = toNumber(stats.triples);
	const homeRuns = toNumber(stats.homeRuns);

	const singles = hits - doubles - triples - homeRuns;
	const denominator = atBats + walks - intentionalWalks + sacFlies + hitByPitch;
	if (denominator <= 0) return null;

	const numerator =
		w.wBB * (walks - intentionalWalks) +
		w.wHBP * hitByPitch +
		w.w1B * singles +
		w.w2B * doubles +
		w.w3B * triples +
		w.wHR * homeRuns;
	return numerator / denominator;
}

export function computeWobaBattingRuns(stats, context = getLeagueContext()) {
	const woba = computeWoba(stats, context);
	const plateAppearances = toNumber(stats?.plateAppearances);
	if (woba == null || !context.woba || plateAppearances <= 0) return null;
	return ((woba - context.woba.lgwOBA) / context.woba.scale) * plateAppearances;
}

// FanGraphs-style position player WAR from wRAA batting runs plus Statcast
// baserunning and fielding runs (all above average, in runs):
//   hWAR = (Batting + Baserunning + Fielding + Positional Adj + Replacement) / Runs Per Win
// The positional adjustment scales the per-162-games value by games played.
// Pass gamesByPosition (from the MLB fielding splits) for a games-weighted
// multi-position adjustment so a catcher who DHs a lot only gets partial
// catcher credit; otherwise the single position at full games played is used.
// Replacement is 18 runs per 600 plate appearances.
export function computeHitterHwar(
	{
		battingRuns,
		baserunningRuns,
		fieldingRuns,
		plateAppearances,
		gamesPlayed,
		position,
		gamesByPosition
	},
	context = getLeagueContext()
) {
	const [batting, baserunning, fielding] = [battingRuns, baserunningRuns, fieldingRuns].map((v) =>
		typeof v === 'number' && Number.isFinite(v) ? v : 0
	);
	// Needs at least a batting sample to be a meaningful position-player value.
	if (batting === 0 && baserunning === 0 && fielding === 0) return null;
	if (!plateAppearances || plateAppearances <= 0) return null;

	const adjustmentRuns =
		gamesByPosition && Object.keys(gamesByPosition).length > 0
			? computePositionalAdjustmentRuns(gamesByPosition, gamesPlayed)
			: (POSITION_ADJUSTMENT[position] ?? 0) * (toNumber(gamesPlayed) / 162);
	const positionalAdjustment = POSITIONAL_ADJUSTMENT_SCALE * adjustmentRuns;
	const replacementRuns = HITTER_REPLACEMENT_RUNS_PER_600 * (plateAppearances / 600);

	const totalRuns =
		(batting + baserunning + fielding) * HITTER_RUN_VALUE_SCALE +
		positionalAdjustment +
		replacementRuns;
	return totalRuns / context.runsPerWin;
}
