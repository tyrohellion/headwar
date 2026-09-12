import { summarizeSeasonInjuries } from '../formatters/injuryFormatter.js';

const cache = new Map();

/**
 * Synchronous lookup of a previously fetched season injury summary.
 * @param {string} id - MLB player id.
 * @param {number|string} season - Season year.
 * @returns {{ count: number, injuries: { date: string, reason: string }[] } | undefined}
 */
export function getCachedSeasonInjuries(id, season) {
	return cache.get(`${id}-${season}`);
}

/**
 * Fetches a player's transactions for one season from the MLB Stats API and
 * returns a summary of their distinct injured-list stints that season.
 * @param {string} id - MLB player id.
 * @param {number|string} season - Season year.
 * @returns {Promise<{ count: number, injuries: { date: string, reason: string }[] }>}
 */
export async function getPlayerSeasonInjuries(id, season) {
	const key = `${id}-${season}`;
	const cached = cache.get(key);
	if (cached) return cached;

	// Cover the full calendar window so offseason moves at the edges of the
	// season are included (e.g. an IL placement effective in early February).
	const url = `https://statsapi.mlb.com/api/v1/transactions?playerId=${id}&startDate=${season}-02-01&endDate=${season}-12-15`;

	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`MLB transactions fetch failed with status: ${response.status}`);
	}

	const data = await response.json();
	const summary = summarizeSeasonInjuries(data.transactions || [], season);
	cache.set(key, summary);
	return summary;
}