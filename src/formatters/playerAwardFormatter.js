export const AWARD_PRESTIGE = {
	MLBHOF: { label: 'Hall of Fame', rank: 1 },
	ALMVP: { label: 'AL MVP', rank: 1 },
	NLMVP: { label: 'NL MVP', rank: 1 },
	ALCY: { label: 'AL Cy Young', rank: 2 },
	NLCY: { label: 'NL Cy Young', rank: 2 },
	WSMVP: { label: 'World Series MVP', rank: 3 },
	WSCHAMP: { label: 'World Series Champion', rank: 4 },
	WBCMVP: { label: 'WBC MVP', rank: 5 },
	ALCSMVP: { label: 'ALCS MVP', rank: 6 },
	NLCSMVP: { label: 'NLCS MVP', rank: 7 },
	ANASMVPA: { label: 'All-Star Game MVP', rank: 8 },

	MLBAFIRST: { label: 'All-MLB First Team', rank: 10 },
	ALSS: { label: 'Silver Slugger', rank: 11 },
	NLSS: { label: 'Silver Slugger', rank: 11 },
	ALGG: { label: 'Gold Glove', rank: 12 },
	NLGG: { label: 'Gold Glove', rank: 12 },
	MLBPLATGG: { label: 'Platinum Glove', rank: 13 },
	ALBTA: { label: 'Babe Ruth Award', rank: 14 },
	MLBSECOND: { label: 'All-MLB Second Team', rank: 15 },
	ALRROY: { label: 'Mariano Rivera AL Reliever of the Year', rank: 16 },
	NLRROY: { label: 'Trevor Hoffman NL Reliever of the Year', rank: 16 },
	ALAS: { label: 'AL All-Star', rank: 17 },
	NLAS: { label: 'NL All-Star', rank: 17 },
	WBCTT: { label: 'WBC All-Tournament Team', rank: 18 },

	NLPOM: { label: 'NL Player of the Month', rank: 30 },
	ALPOM: { label: 'AL Player of the Month', rank: 30 },
	NLPITOM: { label: 'NL Pitcher of the Month', rank: 31 },
	ALPITOM: { label: 'AL Pitcher of the Month', rank: 31 },
	NLROM: { label: 'NL Rookie of the Month', rank: 32 },
	ALROM: { label: 'AL Rookie of the Month', rank: 32 },
	NLRELOM: { label: 'NL Reliever of the Month', rank: 33 },
	ALRELOM: { label: 'AL Reliever of the Month', rank: 33 },
	NLPOW: { label: 'NL Player of the Week', rank: 35 },
	ALPOW: { label: 'AL Player of the Week', rank: 35 },
	HRDERBY: { label: 'Home Run Derby Participant', rank: 38 },

	MLBRCA: { label: 'Roberto Clemente Award', rank: 50 },
	ALROY: { label: 'AL Rookie of the Year', rank: 51 },
	NLROY: { label: 'NL Rookie of the Year', rank: 51 },
	ALMOY: { label: 'AL Manager of the Year', rank: 52 },
	NLMOY: { label: 'NL Manager of the Year', rank: 52 },
	ALHAA: { label: 'Hank Aaron Award', rank: 53 },
	NLHAA: { label: 'Hank Aaron Award', rank: 53 },
	DHOY: { label: 'Edgar Martinez Outstanding DH', rank: 54 },
	BAMLPOY: { label: 'Baseball America Player of the Year', rank: 55 },
	MLBPCPOY: { label: 'Players Choice Player of the Year', rank: 55 }
};

function getFallbackConfig(awardId, awardName) {
	const lowerId = awardId.toLowerCase();
	const lowerName = awardName.toLowerCase();

	// Catch all retired numbers (e.g., RETIREDUNI_147)
	if (lowerId.startsWith('retireduni')) {
		return { label: awardName, rank: 3 };
	}

	if (lowerId.includes('leader') || lowerName.includes('leader')) {
		return { label: awardName, rank: 25 };
	}

	if (lowerId.includes('pow') || lowerName.includes('week')) {
		return { label: awardName, rank: 35 };
	}

	if (lowerId.includes('pom') || lowerName.includes('month')) {
		return { label: awardName, rank: 30 };
	}

	if (lowerId.includes('mvp') || lowerName.includes('mvp')) {
		return { label: awardName, rank: 56 };
	}

	return { label: awardName, rank: 99 };
}

export function processPlayerAwards(rawAwards = []) {
	const aggregated = {};

	rawAwards.forEach((award) => {
		const id = award.id || '';
		const name = award.name || 'Unknown Honor';
		const season = award.season;

		// Extract team data if it exists on the individual award record
		const teamInfo = award.team ? { id: award.team.id, name: award.team.name } : null;

		const config = AWARD_PRESTIGE[id] || getFallbackConfig(id, name);

		if (!aggregated[id]) {
			aggregated[id] = {
				id: id,
				label: config.label,
				rank: config.rank,
				count: 0,
				seasons: [],
				team: teamInfo // Store team metadata here
			};
		}

		aggregated[id].count += 1;

		// Retired numbers use a precise full date rather than just a season year string sometimes
		if (season && !aggregated[id].seasons.includes(season)) {
			aggregated[id].seasons.push(season);
		} else if (award.date && !season) {
			const parsedYear = new Date(award.date).getFullYear().toString();
			if (!aggregated[id].seasons.includes(parsedYear)) {
				aggregated[id].seasons.push(parsedYear);
			}
		}
	});

	return Object.values(aggregated)
		.map((item) => {
			item.seasons.sort((a, b) => parseInt(a) - parseInt(b));
			return item;
		})
		.sort((a, b) => a.rank - b.rank);
}
