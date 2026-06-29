import { fetchPybaseball } from '$lib/pybaseball';

export async function getPlayerSplits(bbrefId, options = {}) {
	loading = true;
	rawData = '';

	// Destructure options with the pybaseball documentation defaults
	const { year = null, player_info = false, pitching_splits = false } = options;

	try {
		// Build the payload dynamically based on documentation parameters
		const payload = {
			playerid: bbrefId,
			player_info: player_info,
			pitching_splits: pitching_splits
		};

		// Only include the year parameter if a specific season is selected
		if (year !== null) {
			payload.year = parseInt(year, 10);
		}

		const data = await fetchPybaseball('get_splits', payload);
		rawData = JSON.stringify(data, null, 2);
	} catch (err) {
		rawData = `Error: ${err.message}`;
	} finally {
		loading = false;
	}
}
