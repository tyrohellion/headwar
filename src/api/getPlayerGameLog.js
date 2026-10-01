import { extractRawEntries } from '../formatters/gameLogFormatter.js';

const cache = new Map();

// Live-seasons logs go stale minutes after a final score posts (and can change
// if a game is suspended), so cache the current season briefly. Completed
// seasons are static and cached for the session.
const CURRENT_SEASON_TTL_MS = 10 * 60 * 1000;

/**
 * Synchronous lookup of a previously fetched season game log.
 * @param {string} id - MLB player id.
 * @param {number|string} season - Season year.
 * @returns {{ entries: Array } | undefined} Cached game log.
 */
export function getCachedPlayerGameLogChunk(id, season) {
	return getRecentCacheEntry(id, season);
}

/**
 * Fetches a player's full regular season gameLog, shaped into Recent
 * Performances entries.
 * @param {string} id - MLB player id.
 * @param {number|string} season - Season year.
 * @returns {Promise<{ entries: Array }>} Raw game entries, one per game.
 */
export async function getPlayerGameLogChunk(id, season) {
	const cached = getRecentCacheEntry(id, season);
	if (cached !== undefined) return cached;

	const main = await fetch(
		`https://statsapi.mlb.com/api/v1/people/${id}/stats?stats=gameLog&group=hitting,pitching&season=${season}&sportId=1&gameType=R`,
	);

	if (!main.ok) {
		throw new Error(`MLB game log fetch failed with status: ${main.status}`);
	}

	const data = await main.json();
	const result = { entries: extractRawEntries(data) };
	cache.set(chunkKey(id, season), { ...result, fetchedAt: Date.now() });
	return result;
}

function chunkKey(id, season) {
	return `${id}-${season}`;
}

function getRecentCacheEntry(id, season) {
	const key = chunkKey(id, season);
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
