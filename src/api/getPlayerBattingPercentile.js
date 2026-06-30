import { fetchPybaseball } from '$lib/pybaseball';

/**
 * Fetches Statcast batter percentile ranks for a season and filters it for a single player.
 * @param {string|number} mlbId - The MLBAM ID of the player (e.g., 660271).
 * @param {number} [year=2026] - The year to fetch data for.
 * @returns {Promise<Object|null>} The player's percentile rank object, or null if not found.
 */
export async function getPlayerBattingPercentileStats(mlbId, year = 2026) {
	if (!mlbId) return null;

	try {
		// Call the dynamic endpoint for statcast_batter_percentile_ranks
		const fullLeagueData = await fetchPybaseball('statcast_batter_percentile_ranks', {
			year
		});

		console.log(`[Statcast Raw Data] Full Percentile Leaderboard Array (${year}):`, fullLeagueData);

		// Filter down to just this player's matching Statcast player_id row
		const playerRow = fullLeagueData.find((row) => {
			if (!row.player_id) return false;
			return String(row.player_id).trim() === String(mlbId).trim();
		});

		if (playerRow) {
			console.log(`[Statcast Target Data] Found percentile ranks for MLB ID ${mlbId}:`, playerRow);
			return playerRow;
		}

		console.warn(`[Statcast] No matching ${year} percentile ranks found for MLB ID: ${mlbId}`);
		return null;
	} catch (err) {
		console.error('[getPlayerBattingPercentileStats] Failed to execute pipeline:', err);
		throw err;
	}
}
