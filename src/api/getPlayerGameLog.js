import { extractRawEntries } from '../formatters/gameLogFormatter.js';

const cache = new Map();

// Live-seasons logs go stale minutes after a final score posts (and can change
// if a game is suspended), so cache the current season briefly. Completed
// seasons are static and cached for the session.
const CURRENT_SEASON_TTL_MS = 10 * 60 * 1000;

// statsapi gameType codes: R regular season, F Wild Card, D Division Series,
// L League Championship Series, W World Series, and P for the whole postseason.
// Regular season is the default so callers that just want a season keep working.
const DEFAULT_GAME_TYPE = 'R';

/**
 * Synchronous lookup of a previously fetched season game log.
 * @param {string} id - MLB player id.
 * @param {number|string} season - Season year.
 * @param {string} [gameType='R'] - R (Regular Season), F (Wild Card), D (Division Series), L (League Championship Series), W (World Series), or P (Postseason).
 * @returns {{ entries: Array } | undefined} Cached game log.
 */
export function getCachedPlayerGameLogChunk(id, season, gameType = DEFAULT_GAME_TYPE) {
	return getRecentCacheEntry(id, season, gameType);
}

/**
 * Fetches a player's gameLog for one game type, shaped into Recent Performances
 * entries.
 * @param {string} id - MLB player id.
 * @param {number|string} season - Season year.
 * @param {string} [gameType='R'] - R (Regular Season), F (Wild Card), D (Division Series), L (League Championship Series), W (World Series), or P (Postseason).
 * @returns {Promise<{ entries: Array }>} Raw game entries, one per game.
 */
export async function getPlayerGameLogChunk(id, season, gameType = DEFAULT_GAME_TYPE) {
	const cached = getRecentCacheEntry(id, season, gameType);
	if (cached !== undefined) return cached;

	const main = await fetch(
		`https://statsapi.mlb.com/api/v1/people/${id}/stats?stats=gameLog&group=hitting,pitching&season=${season}&sportId=1&gameType=${gameType}`,
	);

	if (!main.ok) {
		throw new Error(`MLB game log fetch failed with status: ${main.status}`);
	}

	const data = await main.json();
	const result = { entries: extractRawEntries(data) };
	cache.set(chunkKey(id, season, gameType), { ...result, fetchedAt: Date.now() });
	return result;
}

/**
 * Fetches and merges a player's regular-season and postseason game logs for a
 * season. Date-range filters can straddle both, so the combined entries let
 * "Last X Days" include postseason games instead of regular season only.
 * @param {string} id - MLB player id.
 * @param {number|string} season - Season year.
 * @returns {Promise<{ entries: Array }>} Raw game entries from both scopes.
 */
export async function getPlayerGameLogRange(id, season) {
	const [regular, postseason] = await Promise.all([
		getPlayerGameLogChunk(id, season, 'R'),
		getPlayerGameLogChunk(id, season, 'P'),
	]);

	return { entries: [...regular.entries, ...postseason.entries] };
}

function chunkKey(id, season, gameType) {
	return `${id}-${season}-${gameType}`;
}

function getRecentCacheEntry(id, season, gameType) {
	const key = chunkKey(id, season, gameType);
	const entry = cache.get(key);
	if (!entry) return undefined;

	if (
		Number(season) === new Date().getFullYear() &&
		Date.now() - entry.fetchedAt > CURRENT_SEASON_TTL_MS
	) {
		cache.delete(key);
		return undefined;
	}
	return { entries: entry.entries };
}
