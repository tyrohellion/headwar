export const standardBattingConfig = [
	// --- Slash Line & Percentages ---
	{
		key: 'avg',
		abbr: 'AVG',
		label: 'Batting Average',
		category: 'standard',
		description: 'The ratio of safe hits to total official At Bats (H / AB).'
	},
	{
		key: 'obp',
		abbr: 'OBP',
		label: 'On-Base Percentage',
		category: 'standard',
		description:
			'How frequently a batter reaches base safely via hits, walks, or hit by pitches per plate appearance.'
	},
	{
		key: 'slg',
		abbr: 'SLG',
		label: 'Slugging Percentage',
		category: 'standard',
		description:
			'The average number of total bases gained per official At Bat, measuring raw power capacity.'
	},
	{
		key: 'ops',
		abbr: 'OPS',
		label: 'On-Base Plus Slugging',
		category: 'standard',
		description:
			'The mathematical sum of the player’s On-Base Percentage and Slugging Percentage (OBP + SLG).'
	},
	{
		key: 'homeRuns',
		abbr: 'HR',
		label: 'Home Runs',
		category: 'standard',
		description:
			'Total number of hits where the batter safely touched all four bases, typically over the outfield wall.'
	},
	{
		key: 'rbi',
		abbr: 'RBI',
		label: 'Runs Batted In',
		category: 'standard',
		description:
			'Number of runs driven in by the batter via hits, walks, sacrifices, or groundouts.'
	},

	// --- Counting Stats ---
	{
		key: 'gamesPlayed',
		abbr: 'G',
		label: 'Games',
		category: 'counting',
		description: 'Total number of games the player appeared in.'
	},
	{
		key: 'plateAppearances',
		abbr: 'PA',
		label: 'Plate Appearances',
		category: 'counting',
		description:
			'Total completed turns at bat, including hits, outs, walks, hit by pitches, and sacrifices.'
	},
	{
		key: 'atBats',
		abbr: 'AB',
		label: 'At Bats',
		category: 'counting',
		description:
			'Plate appearances excluding walks, hit by pitches, sacrifices, and catcher interference.'
	},
	{
		key: 'runs',
		abbr: 'R',
		label: 'Runs',
		category: 'counting',
		description: 'Number of times the player safely crossed home plate as a runner.'
	},
	{
		key: 'hits',
		abbr: 'H',
		label: 'Hits',
		category: 'counting',
		description:
			'Total number of safe hits reached on a batted ball without a defensive error or fielder choice.'
	},
	{
		key: 'doubles',
		abbr: '2B',
		label: 'Doubles',
		category: 'counting',
		description: 'Total number of safe base hits where the batter advanced to second base.'
	},
	{
		key: 'triples',
		abbr: '3B',
		label: 'Triples',
		category: 'counting',
		description: 'Total number of safe base hits where the batter advanced to third base.'
	},
	{
		key: 'baseOnBalls',
		abbr: 'BB',
		label: 'Walks',
		category: 'counting',
		description:
			'Total times the batter was awarded first base after receiving four pitches outside the strike zone.'
	},
	{
		key: 'strikeOuts',
		abbr: 'SO',
		label: 'Strikeouts',
		category: 'counting',
		description: 'Total times the batter accumulated three strikes, resulting in an out.'
	},

	// --- Baserunning & Situational ---
	{
		key: 'stolenBases',
		abbr: 'SB',
		label: 'Stolen Bases',
		category: 'situational',
		description:
			'Number of times a runner successfully advanced a base on their own timeline during a live pitch.'
	},
	{
		key: 'caughtStealing',
		abbr: 'CS',
		label: 'Caught Stealing',
		category: 'situational',
		description:
			'Number of times the runner was tagged out while trying to advance a base outside a live play.'
	},
	{
		key: 'intentionalWalks',
		abbr: 'IBB',
		label: 'Intentional Walks',
		category: 'situational',
		description:
			'Times a batter was purposely passed to first base by the defensive team to alter force-play mechanics.'
	},
	{
		key: 'hitByPitch',
		abbr: 'HBP',
		label: 'Hit By Pitch',
		category: 'situational',
		description:
			'Total instances where a batter was advanced to first base after making physical contact with an opposing pitch.'
	},
	{
		key: 'sacFlies',
		abbr: 'SF',
		label: 'Sacrifice Flies',
		category: 'situational',
		description:
			'A fly ball out that allows a baserunner on third base to successfully tag up and score a run.'
	},
	{
		key: 'sacBunts',
		abbr: 'SH',
		label: 'Sacrifice Bunts',
		category: 'situational',
		description:
			'A structural bunt out executed specifically to advance one or more baserunners down the line.'
	}
];
