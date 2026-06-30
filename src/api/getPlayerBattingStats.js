import { fetchPybaseball } from '$lib/pybaseball.js';

/**
 * Fetches the BRef batting leaderboard for a season and filters it for a single player.
 * @param {string|number} mlbId - The MLBAM ID of the player (e.g., 660271).
 * @param {number} [season=2026] - The year to fetch data for.
 * @returns {Promise<Object|null>} The player's stat row object, or null if not found.
 */
export async function getPlayerBattingStatsBref(mlbId, season = 2026) {
	if (!mlbId) return null;

	try {
		const fullLeagueData = await fetchPybaseball('batting_stats_bref', { season });

		console.log(`[Pybaseball Raw Data] Full League Leaderboard Array (${season}):`, fullLeagueData);

		const playerRow = fullLeagueData.find((row) => {
			if (!row.mlbID) return false;
			return String(row.mlbID).trim() === String(mlbId).trim();
		});

		if (playerRow) {
			console.log(`[Pybaseball Target Data] Found row for MLB ID ${mlbId}:`, playerRow);
			return playerRow;
		}

		console.warn(`[Pybaseball] No matching ${season} stats found for MLB ID: ${mlbId}`);
		return null;
	} catch (err) {
		console.error('[getPlayerBattingStatsBref] Failed to execute pipeline:', err);
		throw err;
	}
}
