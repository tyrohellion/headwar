/**
 * Fetches the MLB schedule with live scoring data for a specific date.
 * @param {string} [dateString] - Optional target date formatted as "YYYY-MM-DD". Defaults to today.
 * @returns {Promise<Array>} Array of game objects for the selected date.
 */
export async function getMlbSchedule(dateString) {
	try {
		let targetDate = dateString;
		if (!targetDate) {
			const today = new Date();
			const year = today.getFullYear();
			const month = String(today.getMonth() + 1).padStart(2, '0');
			const day = String(today.getDate()).padStart(2, '0');
			targetDate = `${year}-${month}-${day}`;
		}

		const url = `https://statsapi.mlb.com/api/v1/schedule?sportId=1&startDate=${targetDate}&endDate=${targetDate}&hydrate=team,linescore,venue`;

		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`MLB API fetch failed with status: ${response.status}`);
		}

		const data = await response.json();

		console.log(`[Schedule Debug] Games fetched for date ${targetDate}:`, data.dates?.[0]?.games);

		return data.dates?.[0]?.games || [];
	} catch (error) {
		console.error('Error fetching MLB schedule:', error);
		return [];
	}
}
