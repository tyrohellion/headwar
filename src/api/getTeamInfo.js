export async function getTeamInfo(id) {
	const res = await fetch(`https://statsapi.mlb.com/api/v1/teams/${id}`, {
		next: {
			revalidate: 60
		}
	});

	if (!res.ok) {
		throw new Error('Failed to fetch team data');
	}

	return res.json();
}
