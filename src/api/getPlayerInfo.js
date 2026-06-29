export async function getPlayerInfo(id) {
	const res = await fetch(`https://statsapi.mlb.com/api/v1/people/${id}?hydrate=currentTeam`, {
		next: {
			revalidate: 60
		}
	});

	if (!res.ok) {
		throw new Error('Failed to fetch player');
	}

	return res.json();
}
