import { summarizeSeasonInjuries } from '../formatters/injuryFormatter.js';

const cache = new Map();

// Current-season summaries include an "ongoing" flag that goes stale the moment
// a player is activated, so they are only cached briefly within a session.
// Completed-seasons are static and cached indefinitely.
const CURRENT_SEASON_TTL_MS = 10 * 60 * 1000;

/**
 * Fetches the dates the player appeared in MLB games in a season. Used to close
 * injured-list stints when the transactions feed never records the activation.
 * @param {string} id - MLB player id.
 * @param {number|string} season - Season year.
 * @returns {Promise<string[]>} Sorted unique YYYY-MM-DD game dates (empty on failure).
 */
async function fetchPlayerGameDates(id, season) {
	const url = `https://statsapi.mlb.com/api/v1/people/${id}/stats?stats=gameLog&group=hitting,pitching&season=${season}&sportId=1&gameType=R`;

	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`MLB game log fetch failed with status: ${response.status}`);
	}

	const data = await response.json();
	const dates = new Set();
	for (const stat of data.stats || []) {
		for (const split of stat.splits || []) {
			const date = split?.date;
			if (date) dates.add(date.slice(0, 10));
		}
	}
	return [...dates].sort();
}

/**
 * Synchronous lookup of a previously fetched season injury summary.
 * @param {string} id - MLB player id.
 * @param {number|string} season - Season year.
 * @returns {{ count: number, injuries: { date: string, reason: string }[] } | undefined}
 */
export function getCachedSeasonInjuries(id, season) {
	const key = `${id}-${season}`;
	const entry = cache.get(key);
	if (!entry) return undefined;

	if (
		Number(season) === new Date().getFullYear() &&
		Date.now() - entry.fetchedAt > CURRENT_SEASON_TTL_MS
	) {
		cache.delete(key);
		return undefined;
	}
	return entry.summary;
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
	const cached = getCachedSeasonInjuries(id, season);
	if (cached) return cached;

	// Cover the full calendar window so offseason moves at the edges of the
	// season are included (e.g. an IL placement effective in early February).
	const injuriesUrl = `https://statsapi.mlb.com/api/v1/transactions?playerId=${id}&startDate=${season}-02-01&endDate=${season}-12-15`;

	// The transactions feed sometimes omits the activation that closed a stint;
	// the game log (whether the player actually played) is the tiebreaker.
	const [injuriesRes, gameDates] = await Promise.allSettled([
		fetch(injuriesUrl),
		fetchPlayerGameDates(id, season)
	]);
	if (injuriesRes.status !== 'fulfilled' || !injuriesRes.value.ok) {
		const status =
			injuriesRes.status === 'fulfilled'
				? injuriesRes.value.status
				: 'network error';
		throw new Error(`MLB transactions fetch failed with status: ${status}`);
	}

	const data = await injuriesRes.value.json();
	const summary = summarizeSeasonInjuries(
		data.transactions || [],
		season,
		gameDates.status === 'fulfilled' ? gameDates.value : []
	);
	cache.set(key, { summary, fetchedAt: Date.now() });
	return summary;
}