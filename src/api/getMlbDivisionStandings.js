/**
 * Fetches the complete regular season division standings for the MLB.
 * @returns {Promise<Array>} Array of division record objects
 */
export async function getMlbStandings() {
	try {
		const currentYear = new Date().getFullYear();
		const url = `https://statsapi.mlb.com/api/v1/standings?leagueId=103,104&season=${currentYear}&standingsTypes=regularSeason&hydrate=division`;

		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`Standings fetch failed with status: ${response.status}`);
		}

		const data = await response.json();

		const records = (data.records || []).map((record) => {
			return {
				...record,
				displayName:
					record.division?.name || record.division?.nameShort || `Division ${record.division?.id}`
			};
		});

		return records;
	} catch (error) {
		console.error('Error fetching MLB standings:', error);
		return [];
	}
}
