/**
 * Fetches the current day's MLB schedule with live scoring data.
 * @returns {Promise<Array>} Array of game objects for today
 */
export async function getMlbSchedule() {
	try {
		const url = 'https://statsapi.mlb.com/api/v1/schedule?sportId=1&hydrate=team,linescore,venue';

		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`MLB API fetch failed with status: ${response.status}`);
		}

		const data = await response.json();

		return data.dates?.[0]?.games || [];
	} catch (error) {
		console.error("Error fetching today's MLB schedule:", error);
		return [];
	}
}
