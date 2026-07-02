export const standardFieldingStatsConfig = [
	// Standard defensive metrics (Including Catcher Specific)
	{
		key: 'fielding',
		label: 'Fielding Percentage',
		abbr: 'FLD%',
		category: 'standard',
		description: 'The percentage of total defensive chances handled cleanly without an error.'
	},
	{
		key: 'rangeFactorPerGame',
		label: 'Range Factor / Game',
		abbr: 'RF/G',
		category: 'standard',
		description: 'The average number of putouts and assists completed per game.'
	},
	{
		key: 'rangeFactorPer9Inn',
		label: 'Range Factor / 9 Innings',
		abbr: 'RF/9',
		category: 'standard',
		description: 'The average number of defensive plays completed per nine innings.'
	},
	{
		key: 'caughtStealing',
		label: 'Caught Stealing',
		abbr: 'CS',
		category: 'standard',
		description:
			'Catcher Specific: The number of runners thrown out by this player while attempting to steal a base.'
	},
	{
		key: 'stolenBases',
		label: 'Stolen Bases Allowed',
		abbr: 'SBA',
		category: 'standard',
		description:
			'Catcher Specific: The total number of bases successfully stolen by base runners while this player was behind the plate.'
	},
	{
		key: 'passedBall',
		label: 'Passed Balls',
		abbr: 'PB',
		category: 'standard',
		description:
			'Catcher Specific: The number of pitch deliveries that should have been caught or blocked but allowed runners to advance.'
	},
	{
		key: 'catcherERA',
		label: 'Catcher ERA',
		abbr: 'cERA',
		category: 'standard',
		description:
			'Catcher Specific: The earned run average of the pitching staff while this catcher was behind the plate.'
	},

	// Defensive Counting Stats
	{
		key: 'games',
		label: 'Games Played',
		abbr: 'G',
		category: 'counting',
		description: 'The total number of games a player appeared on defense at any position.'
	},
	{
		key: 'gamesStarted',
		label: 'Games Started',
		abbr: 'GS',
		category: 'counting',
		description: 'The total number of games started at a defensive position.'
	},
	{
		key: 'innings',
		label: 'Innings Defended',
		abbr: 'INN',
		category: 'counting',
		description: 'The total number of defensive innings played.'
	},
	{
		key: 'chances',
		label: 'Total Chances',
		abbr: 'TC',
		category: 'counting',
		description:
			'The overall number of defensive plays where the player could have recorded an out (Putouts + Assists + Errors).'
	},
	{
		key: 'putOuts',
		label: 'Putouts',
		abbr: 'PO',
		category: 'counting',
		description:
			'The number of times a fielder records an out directly, such as catching a fly ball or stepping on a base.'
	},
	{
		key: 'assists',
		label: 'Assists',
		abbr: 'A',
		category: 'counting',
		description:
			'The number of times a defensive player throws or deflects a ball to a teammate to secure an out.'
	},
	{
		key: 'errors',
		label: 'Errors Committed',
		abbr: 'E',
		category: 'counting',
		description: 'The total number of misplays that allow a runner to reach base or advance safely.'
	},
	{
		key: 'doublePlays',
		label: 'Double Plays Turned',
		abbr: 'DP',
		category: 'counting',
		description: 'The number of double plays the player contributed to or completed.'
	},
	{
		key: 'triplePlays',
		label: 'Triple Plays Turned',
		abbr: 'TP',
		category: 'counting',
		description: 'The number of triple plays the player contributed to or completed.'
	}
];
