const LEVELS = [
	{ sportId: 1, level: 'MLB', label: 'MLB' },
	{ sportId: 11, level: 'AAA', label: 'AAA' },
	{ sportId: 12, level: 'AA', label: 'AA' },
	{ sportId: 13, level: 'A+', label: 'A+' },
	{ sportId: 14, level: 'A', label: 'A' },
	{ sportId: 16, level: 'Rookie', label: 'Rookie' }
];

const cache = new Map();

// statsapi gameType codes: R regular season, F Wild Card, D Division Series,
// L League Championship Series, W World Series, and P for the whole postseason.
// Regular season is the default so callers that just want a season keep working.
const DEFAULT_GAME_TYPE = 'R';

/**
 * Synchronous lookup of a previously fetched season games summary.
 * @param {string} id - MLB player id.
 * @param {number|string} season - Season year.
 * @param {string} [gameType='R'] - R (Regular Season), F (Wild Card), D (Division Series), L (League Championship Series), W (World Series), or P (Postseason).
 * @returns {{ total: number, byLevel: { level: string, label: string, games: number }[] } | undefined}
 */
export function getCachedSeasonGames(id, season, gameType = DEFAULT_GAME_TYPE) {
	return cache.get(`${id}-${season}-${gameType}`);
}

async function fetchLevelGames(id, season, sportId, gameType) {
	const url = `https://statsapi.mlb.com/api/v1/people/${id}/stats?stats=season&group=hitting,pitching&season=${season}&sportId=${sportId}&gameType=${gameType}`;

	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`MLB stats fetch failed with status: ${response.status}`);
	}

	const data = await response.json();

	// gamesPlayed may live on either the hitting or pitching split (a two-way
	// player has both); within a group, sum across splits so a season played
	// for multiple teams at the same level is counted fully.
	let games = 0;
	for (const stat of data.stats || []) {
		let sum = 0;
		for (const split of stat.splits || []) {
			sum += split.stat?.gamesPlayed || 0;
		}
		games = Math.max(games, sum);
	}

	return games;
}

/**
 * Fetches how many games a player played in a season, broken down by level
 * (MLB and minor leagues). One request per level, run in parallel.
 * @param {string} id - MLB player id.
 * @param {number|string} season - Season year.
 * @param {string} [gameType='R'] - R (Regular Season), F (Wild Card), D (Division Series), L (League Championship Series), W (World Series), or P (Postseason).
 * @returns {Promise<{ total: number, byLevel: { level: string, label: string, games: number }[] }>}
 */
export async function getPlayerSeasonGames(id, season, gameType = DEFAULT_GAME_TYPE) {
	const key = `${id}-${season}-${gameType}`;
	const cached = cache.get(key);
	if (cached) return cached;

	// A failed level counts as 0 games so one hiccup doesn't hide the summary.
	const settled = await Promise.allSettled(
		LEVELS.map(async ({ sportId, level, label }) => ({
			level,
			label,
			games: await fetchLevelGames(id, season, sportId, gameType)
		}))
	);

	const byLevel = [];
	let total = 0;
	settled.forEach((result, index) => {
		if (result.status !== 'fulfilled') return;
		const { level, label, games } = result.value;
		if (games > 0) {
			byLevel.push({ level, label, games });
			total += games;
		}
	});

	const summary = { total, byLevel };
	cache.set(key, summary);
	return summary;
}