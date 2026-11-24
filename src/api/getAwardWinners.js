const AWARDS_URL = 'https://statsapi.mlb.com/api/v1/awards';

const MVP_AWARDS = ['ALMVP', 'NLMVP'];
const CY_AWARDS = ['ALCY', 'NLCY'];

const AWARD_LABELS = {
	ALMVP: 'AL MVP',
	NLMVP: 'NL MVP',
	ALCY: 'AL Cy Young',
	NLCY: 'NL Cy Young'
};

async function fetchWinner(awardId, season) {
	const res = await fetch(`${AWARDS_URL}/${awardId}/recipients?season=${season}`);
	if (!res.ok) throw new Error(`Award recipient request failed: ${res.status}`);

	const data = await res.json();
	const recipient = (data.awards || []).find(
		(award) => award.id === awardId && award.player?.id && award.player?.nameFirstLast
	);
	if (!recipient) return null;

	const { id, nameFirstLast } = recipient.player;
	return {
		id,
		name: nameFirstLast,
		href: `/players/${id}`,
		awardId,
		awardLabel: AWARD_LABELS[awardId],
		season: Number(recipient.season || season)
	};
}

async function collectSeasonWinners(awardIds, seasons) {
	const results = await Promise.all(
		seasons.flatMap((season) =>
			awardIds.map(async (awardId) => {
				try {
					return await fetchWinner(awardId, season);
				} catch {
					return null;
				}
			})
		)
	);

	const bySeason = new Map();
	seasons.forEach((season, seasonIndex) => {
		const winners = awardIds.map(
			(_, awardIndex) => results[seasonIndex * awardIds.length + awardIndex]
		);
		if (winners.every(Boolean)) bySeason.set(season, winners);
	});
	return bySeason;
}

export async function getHeroFeaturedPlayers() {
	try {
		const year = new Date().getFullYear();
		const seasons = [year, year - 1, year - 2];

		const [mvpBySeason, cyBySeason] = await Promise.all([
			collectSeasonWinners(MVP_AWARDS, seasons),
			collectSeasonWinners(CY_AWARDS, seasons)
		]);

		const mvpSeasons = [...mvpBySeason.keys()].sort((a, b) => b - a).slice(0, 2);
		const cySeason = [...cyBySeason.keys()].sort((a, b) => b - a)[0];

		const winners = [
			...mvpSeasons.flatMap((season) => mvpBySeason.get(season)),
			...(cySeason ? cyBySeason.get(cySeason) : [])
		];

		const seen = new Set();
		return winners.filter((player) => {
			if (seen.has(player.id)) return false;
			seen.add(player.id);
			return true;
		});
	} catch (err) {
		console.error('Failed to load featured award winners:', err);
		return [];
	}
}
