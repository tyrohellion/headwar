// League context used by the WAR/FIP calculators.
//
// Values are computed from MLB Stats API league pitching totals (all 30 teams)
// per season, so the FIP constant makes league-average FIP equal league ERA
// and the runs-per-win value uses the league run environment, matching the
// published FanGraphs methodology. Seasons before 2015 (pre-statcast) are not
// relevant to the site's advanced stats and fall back to the nearest entry.

export const LEAGUE_CONTEXT = {
	2015: { fipConstant: 3.127, leagueEra: 3.956, runsPerGame: 4.25, runsPerWin: 9.375 },
	2016: { fipConstant: 3.139, leagueEra: 4.183, runsPerGame: 4.478, runsPerWin: 9.717 },
	2017: { fipConstant: 3.151, leagueEra: 4.351, runsPerGame: 4.647, runsPerWin: 9.97 },
	2018: { fipConstant: 3.155, leagueEra: 4.145, runsPerGame: 4.449, runsPerWin: 9.673 },
	2019: { fipConstant: 3.203, leagueEra: 4.495, runsPerGame: 4.831, runsPerWin: 10.246 },
	2020: { fipConstant: 3.184, leagueEra: 4.446, runsPerGame: 4.646, runsPerWin: 9.969 },
	2021: { fipConstant: 3.163, leagueEra: 4.259, runsPerGame: 4.531, runsPerWin: 9.796 },
	2022: { fipConstant: 3.107, leagueEra: 3.963, runsPerGame: 4.283, runsPerWin: 9.425 },
	2023: { fipConstant: 3.25, leagueEra: 4.327, runsPerGame: 4.616, runsPerWin: 9.923 },
	2024: { fipConstant: 3.16, leagueEra: 4.073, runsPerGame: 4.393, runsPerWin: 9.59 },
	2025: { fipConstant: 3.128, leagueEra: 4.152, runsPerGame: 4.447, runsPerWin: 9.671 }
};

// FanGraphs wOBA guts constants (league wOBA, the scale divisor, and the
// per-event linear weights). Used to turn a batting line into wRAA, matching
// FanGraphs' batting runs component. Source: FanGraphs guts leaderboards.
export const WOBA_GUTS = {
	2015: {
		lgwOBA: 0.313,
		scale: 1.251,
		wBB: 0.687,
		wHBP: 0.718,
		w1B: 0.881,
		w2B: 1.256,
		w3B: 1.594,
		wHR: 2.065
	},
	2016: {
		lgwOBA: 0.318,
		scale: 1.212,
		wBB: 0.691,
		wHBP: 0.721,
		w1B: 0.878,
		w2B: 1.242,
		w3B: 1.569,
		wHR: 2.015
	},
	2017: {
		lgwOBA: 0.321,
		scale: 1.185,
		wBB: 0.693,
		wHBP: 0.723,
		w1B: 0.877,
		w2B: 1.232,
		w3B: 1.552,
		wHR: 1.98
	},
	2018: {
		lgwOBA: 0.315,
		scale: 1.226,
		wBB: 0.69,
		wHBP: 0.72,
		w1B: 0.88,
		w2B: 1.247,
		w3B: 1.578,
		wHR: 2.031
	},
	2019: {
		lgwOBA: 0.32,
		scale: 1.157,
		wBB: 0.69,
		wHBP: 0.719,
		w1B: 0.87,
		w2B: 1.217,
		w3B: 1.529,
		wHR: 1.94
	},
	2020: {
		lgwOBA: 0.32,
		scale: 1.185,
		wBB: 0.699,
		wHBP: 0.728,
		w1B: 0.883,
		w2B: 1.238,
		w3B: 1.558,
		wHR: 1.979
	},
	2021: {
		lgwOBA: 0.314,
		scale: 1.209,
		wBB: 0.692,
		wHBP: 0.722,
		w1B: 0.879,
		w2B: 1.242,
		w3B: 1.568,
		wHR: 2.007
	},
	2022: {
		lgwOBA: 0.31,
		scale: 1.259,
		wBB: 0.689,
		wHBP: 0.72,
		w1B: 0.884,
		w2B: 1.261,
		w3B: 1.601,
		wHR: 2.072
	},
	2023: {
		lgwOBA: 0.318,
		scale: 1.204,
		wBB: 0.696,
		wHBP: 0.726,
		w1B: 0.883,
		w2B: 1.244,
		w3B: 1.569,
		wHR: 2.004
	},
	2024: {
		lgwOBA: 0.31,
		scale: 1.242,
		wBB: 0.689,
		wHBP: 0.72,
		w1B: 0.882,
		w2B: 1.254,
		w3B: 1.59,
		wHR: 2.05
	},
	2025: {
		lgwOBA: 0.313,
		scale: 1.232,
		wBB: 0.691,
		wHBP: 0.722,
		w1B: 0.882,
		w2B: 1.252,
		w3B: 1.584,
		wHR: 2.037
	},
	2026: {
		lgwOBA: 0.316,
		scale: 1.237,
		wBB: 0.698,
		wHBP: 0.729,
		w1B: 0.89,
		w2B: 1.261,
		w3B: 1.594,
		wHR: 2.048
	}
};

export function getLeagueContext(season) {
	const year = Number(season);
	if (Number.isFinite(year) && LEAGUE_CONTEXT[year]) {
		return { ...LEAGUE_CONTEXT[year], woba: WOBA_GUTS[year] || null };
	}

	const years = Object.keys(LEAGUE_CONTEXT)
		.map(Number)
		.sort((a, b) => a - b);
	const nearest = !Number.isFinite(year) || year < years[0] ? years[0] : years[years.length - 1];
	return { ...LEAGUE_CONTEXT[nearest], woba: WOBA_GUTS[nearest] || null };
}
