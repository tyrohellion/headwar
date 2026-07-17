export async function getPlayerInfo(id, { season, startDate, endDate } = {}) {
	const isDateRange = !!(startDate && endDate);

	const statType = isDateRange ? 'byDateRange' : 'yearByYear,career';
	const statParams = ['group=[hitting,pitching,fielding]', `type=[${statType}]`];

	if (isDateRange) {
		statParams.push(`startDate=${startDate}`, `endDate=${endDate}`);
	}

	if (isDateRange && season) {
		statParams.push(`season=${season}`);
	}

	const hydrations = ['currentTeam', 'awards', `stats(${statParams.join(',')})`].join(',');

	const res = await fetch(`https://statsapi.mlb.com/api/v1/people/${id}?hydrate=${hydrations}`);

	if (!res.ok) {
		throw new Error('Failed to fetch player');
	}

	return res.json();
}
