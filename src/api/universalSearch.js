import { fetchPybaseball } from '$lib/pybaseball.js';

export async function getPlayer(id) {
	const res = await fetch(`https://statsapi.mlb.com/api/v1/people/${id}`, {
		next: {
			revalidate: 60
		}
	});

	if (!res.ok) {
		throw new Error('Failed to fetch player');
	}

	return res.json();
}

export async function searchPlayers(namesString) {
	if (!namesString.trim()) return [];

	// MLB StatsAPI search accepts a single 'names' parameter
	// It works perfectly for "Shohei", "Ohtani", or "Shohei Ohtani"
	const url = `https://statsapi.mlb.com/api/v1/people/search?names=${encodeURIComponent(namesString.trim())}&sportId=1`;

	try {
		const res = await fetch(url);
		if (!res.ok) throw new Error('MLB Player Search failed');

		const data = await res.json();
		// The API returns an object with a 'people' array
		return data.people || [];
	} catch (err) {
		console.error(err);
		return [];
	}
}

export const teams = [
	{
		id: 147,
		name: 'New York Yankees',
		abbreviation: 'NYY'
	},
	{
		id: 121,
		name: 'New York Mets',
		abbreviation: 'NYM'
	},
	{
		id: 119,
		name: 'Los Angeles Dodgers',
		abbreviation: 'LAD'
	},
	{
		id: 144,
		name: 'Atlanta Braves',
		abbreviation: 'ATL'
	},
	{
		id: 111,
		name: 'Boston Red Sox',
		abbreviation: 'BOS'
	},
	{
		id: 112,
		name: 'Chicago Cubs',
		abbreviation: 'CHC'
	},
	{
		id: 145,
		name: 'Chicago White Sox',
		abbreviation: 'CWS'
	},
	{
		id: 116,
		name: 'Detroit Tigers',
		abbreviation: 'DET'
	},
	{
		id: 115,
		name: 'Colorado Rockies',
		abbreviation: 'COL'
	},
	{
		id: 113,
		name: 'Cincinnati Reds',
		abbreviation: 'CIN'
	},
	{
		id: 114,
		name: 'Cleveland Guardians',
		abbreviation: 'CLE'
	},
	{
		id: 146,
		name: 'Miami Marlins',
		abbreviation: 'MIA'
	},
	{
		id: 158,
		name: 'Milwaukee Brewers',
		abbreviation: 'MIL'
	},
	{
		id: 117,
		name: 'Houston Astros',
		abbreviation: 'HOU'
	},
	{
		id: 118,
		name: 'Kansas City Royals',
		abbreviation: 'KC'
	},
	{
		id: 133,
		name: 'Oakland Athletics',
		abbreviation: 'ATH'
	},
	{
		id: 143,
		name: 'Philadelphia Phillies',
		abbreviation: 'PHI'
	},
	{
		id: 135,
		name: 'San Diego Padres',
		abbreviation: 'SD'
	},
	{
		id: 137,
		name: 'San Francisco Giants',
		abbreviation: 'SF'
	},
	{
		id: 136,
		name: 'Seattle Mariners',
		abbreviation: 'SEA'
	},
	{
		id: 142,
		name: 'Minnesota Twins',
		abbreviation: 'MIN'
	},
	{
		id: 138,
		name: 'St. Louis Cardinals',
		abbreviation: 'STL'
	},
	{
		id: 140,
		name: 'Texas Rangers',
		abbreviation: 'TEX'
	},
	{
		id: 139,
		name: 'Tampa Bay Rays',
		abbreviation: 'TB'
	},
	{
		id: 141,
		name: 'Toronto Blue Jays',
		abbreviation: 'TOR'
	},
	{
		id: 120,
		name: 'Washington Nationals',
		abbreviation: 'WSH'
	},
	{
		id: 134,
		name: 'Pittsburgh Pirates',
		abbreviation: 'PIT'
	},
	{
		id: 110,
		name: 'Baltimore Orioles',
		abbreviation: 'BAL'
	},
	{
		id: 108,
		name: 'Los Angeles Angels',
		abbreviation: 'LAA'
	},
	{
		id: 109,
		name: 'Arizona Diamondbacks',
		abbreviation: 'ARI'
	}
];

export function getPlayerHeadshot(id) {
	return `https://img.mlbstatic.com/mlb-photos/image/upload/c_fill,g_auto/w_50,d_people:generic:headshot:67:current.png,q_auto:best/v1/people/${id}/headshot/67/current`;
}
