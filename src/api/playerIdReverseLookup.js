import { fetchPybaseball } from '$lib/pybaseball';

export async function playerIdReverseLookup(id) {
	loading = true;
	rawData = '';
	try {
		const data = await fetchPybaseball('playerid_reverse_lookup', {
			player_ids: [id],
			key_type: 'mlbam'
		});
		rawData = JSON.stringify(data, null, 2);
	} catch (err) {
		rawData = `Error: ${err.message}`;
	} finally {
		loading = false;
	}
}
