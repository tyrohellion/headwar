export const standardBattingConfig = [
	// --- Counting Stats ---
	{
		key: 'G',
		label: 'Games',
		category: 'counting',
		description: 'Total number of games the player appeared in.'
	},
	{
		key: 'PA',
		label: 'Plate Appearances',
		category: 'counting',
		description:
			'Total completed turns at bat, including hits, outs, walks, hit by pitches, and sacrifices.'
	},
	{
		key: 'AB',
		label: 'At Bats',
		category: 'counting',
		description:
			'Plate appearances excluding walks, hit by pitches, sacrifices, and catcher interference.'
	},
	{
		key: 'R',
		label: 'Runs',
		category: 'counting',
		description: 'Number of times the player safely crossed home plate as a runner.'
	},
	{
		key: 'H',
		label: 'Hits',
		category: 'counting',
		description:
			'Total number of safe hits reached on a batted ball without a defensive error or fielder choice.'
	},
	{
		key: '2B',
		label: 'Doubles',
		category: 'counting',
		description: 'Total number of safe base hits where the batter advanced to second base.'
	},
	{
		key: '3B',
		label: 'Triples',
		category: 'counting',
		description: 'Total number of safe base hits where the batter advanced to third base.'
	},
	{
		key: 'HR',
		label: 'Home Runs',
		category: 'counting',
		description:
			'Total number of hits where the batter safely touched all four bases, typically over the outfield wall.'
	},
	{
		key: 'RBI',
		label: 'Runs Batted In',
		category: 'counting',
		description:
			'Number of runs driven in by the batter via hits, walks, sacrifices, or groundouts.'
	},

	// --- Slash Line & Percentages ---
	{
		key: 'BA',
		label: 'Batting Average',
		category: 'rates',
		description: 'The ratio of safe hits to total official At Bats (H / AB).'
	},
	{
		key: 'OBP',
		label: 'On-Base Percentage',
		category: 'rates',
		description:
			'How frequently a batter reaches base safely via hits, walks, or hit by pitches per plate appearance.'
	},
	{
		key: 'SLG',
		label: 'Slugging Percentage',
		category: 'rates',
		description:
			'The average number of total bases gained per official At Bat, measuring raw power capacity.'
	},
	{
		key: 'OPS',
		label: 'On-Base Plus Slugging',
		category: 'rates',
		description:
			'The mathematical sum of the player’s On-Base Percentage and Slugging Percentage (OBP + SLG).'
	},
	{
		key: 'BB',
		label: 'Walks',
		category: 'rates',
		description:
			'Total times the batter was awarded first base after receiving four pitches outside the strike zone.'
	},
	{
		key: 'SO',
		label: 'Strikeouts',
		category: 'rates',
		description: 'Total times the batter accumulated three strikes, resulting in an out.'
	},

	// --- Baserunning & Situational ---
	{
		key: 'SB',
		label: 'Stolen Bases',
		category: 'situational',
		description:
			'Number of times a runner successfully advanced a base on their own timeline during a live pitch.'
	},
	{
		key: 'CS',
		label: 'Caught Stealing',
		category: 'situational',
		description:
			'Number of times the runner was tagged out while trying to advance a base outside a live play.'
	},
	{
		key: 'IBB',
		label: 'Intentional Walks',
		category: 'situational',
		description:
			'Times a batter was purposely passed to first base by the defensive team to alter force-play mechanics.'
	},
	{
		key: 'HBP',
		label: 'Hit By Pitch',
		category: 'situational',
		description:
			'Total instances where a batter was advanced to first base after making physical contact with an opposing pitch.'
	},
	{
		key: 'SF',
		label: 'Sacrifice Flies',
		category: 'situational',
		description:
			'A fly ball out that allows a baserunner on third base to successfully tag up and score a run.'
	},
	{
		key: 'SH',
		label: 'Sacrifice Bunts',
		category: 'situational',
		description:
			'A structural bunt out executed specifically to advance one or more baserunners down the line.'
	},
	{
		key: 'GDP',
		label: 'Grounded into Double Play',
		category: 'situational',
		description:
			'Instances where the batter hit a fair ground ball that resulted in multiple continuous defensive outs.'
	}
];
