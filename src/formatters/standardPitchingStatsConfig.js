export const standardPitchingConfig = [
	// --- Standard & Performance Metrics ---
	{
		key: 'era',
		abbr: 'ERA',
		label: 'Earned Run Avg',
		category: 'standard',
		description:
			'The average number of earned runs allowed by a pitcher per nine innings pitched (ER × 9 / IP).'
	},
	{
		key: 'whip',
		abbr: 'WHIP',
		label: 'Walks + Hits / IP',
		category: 'standard',
		description:
			'The average number of walks and hits allowed by a pitcher per inning pitched ((BB + H) / IP).'
	},
	{
		key: 'ops',
		abbr: 'oOPS',
		label: 'Opponent OPS',
		category: 'standard',
		description:
			'The mathematical sum of opponents On-Base Percentage and Slugging Percentage against this pitcher.'
	},
	{
		key: 'strikeoutsPer9Inn',
		abbr: 'K/9',
		label: 'K/9 Rate',
		category: 'standard',
		description:
			'The average number of strikeouts accumulated per nine frames pitched (SO × 9 / IP).'
	},
	{
		key: 'walksPer9Inn',
		abbr: 'BB/9',
		label: 'BB/9 Rate',
		category: 'standard',
		description: 'The average number of walks issued per nine frames pitched (BB × 9 / IP).'
	},
	{
		key: 'inningsPitched',
		abbr: 'IP',
		label: 'Innings Pitched',
		category: 'standard',
		description: 'The total number of outs recorded while pitching divided by three.'
	},
	{
		key: 'gamesStarted',
		abbr: 'GS',
		label: 'Games Started',
		category: 'standard',
		description: 'Total number of games where the pitcher was the initial thrower for their team.'
	},
	{
		key: 'obp',
		abbr: 'oOBP',
		label: 'Opponent OBP',
		category: 'standard',
		description:
			'The combined rate at which opposing hitters reach base against this pitcher via hits, walks, or hit-by-pitches.'
	},

	// --- Counting Stats & Box Score Totals ---
	{
		key: 'gamesPlayed',
		abbr: 'G',
		label: 'Games Played',
		category: 'counting',
		description: 'Total number of game appearances, whether starting or coming in as a reliever.'
	},
	{
		key: 'saves',
		abbr: 'SV',
		label: 'Saves',
		category: 'counting',
		description:
			'Number of times a relief pitcher successfully preserves a lead under specific late-game criteria.'
	},
	{
		key: 'strikeOuts',
		abbr: 'SO',
		label: 'Strikeouts',
		category: 'counting',
		description:
			'Total number of batters retired by accumulating three strikes during a single plate appearance.'
	},
	{
		key: 'battersFaced',
		abbr: 'BF',
		label: 'Batters Faced',
		category: 'counting',
		description: 'The complete count of total plate appearances completed against this pitcher.'
	},
	{
		key: 'hits',
		abbr: 'H',
		label: 'Hits Allowed',
		category: 'counting',
		description: 'Total number of safe hits conceded to opposing batters.'
	},
	{
		key: 'earnedRuns',
		abbr: 'ER',
		label: 'Earned Runs',
		category: 'counting',
		description:
			'Any run that scores against a pitcher without the aid of a defensive error or a passed ball.'
	},
	{
		key: 'baseOnBalls',
		abbr: 'BB',
		label: 'Walks Allowed',
		category: 'counting',
		description:
			'Total number of times the pitcher issued four pitches outside the zone to a single batter, yielding first base.'
	},
	{
		key: 'wins',
		abbr: 'W',
		label: 'Wins',
		category: 'counting',
		description:
			'The number of games where the pitcher was on the mound when their team took a lead they never relinquished.'
	},
	{
		key: 'losses',
		abbr: 'L',
		label: 'Losses',
		category: 'counting',
		description:
			'The number of games where the pitcher surrendered the run that gave the opposing team a permanent lead.'
	}
];
