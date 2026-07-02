export async function getPlayerInfo(id) {
	const hydrations = [
		'currentTeam',
		'awards',
		'social',
		// Request year-by-year logs AND lifetime career stats for both groups
		'stats(group=[hitting,pitching,fielding],type=[yearByYear,career])'
	].join(',');

	const res = await fetch(`https://statsapi.mlb.com/api/v1/people/${id}?hydrate=${hydrations}`, {
		next: {
			revalidate: 60
		}
	});

	if (!res.ok) {
		throw new Error('Failed to fetch player');
	}

	return res.json();
}
