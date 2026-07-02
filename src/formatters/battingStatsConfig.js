export const battingStatConfig = [
	{
		key: 'exit_velocity',
		label: 'Exit Velocity',
		category: 'profile',
		description: 'The average speed (in mph) of all batted balls off the bat.'
	},
	{
		key: 'max_ev',
		label: 'Max Exit Velocity',
		category: 'profile',
		description: 'The absolute maximum speed recorded on any single batted ball.'
	},
	{
		key: 'hard_hit_percent',
		label: 'Hard Hit Percentage',
		category: 'profile',
		description: 'The percentage of batted balls struck at 95 mph or faster.'
	},
	{
		key: 'brl',
		label: 'Barrels',
		category: 'profile',
		description:
			'The raw number of batted balls meeting perfect optimal launch angle and exit velocity.'
	},
	{
		key: 'brl_percent',
		label: 'Barrel Percentage',
		category: 'profile',
		description: 'The percentage of total batted balls that are classified as Barrels.'
	},
	{
		key: 'bat_speed',
		label: 'Bat Speed',
		category: 'profile',
		description: 'The average tracking speed of the sweet spot of the bat at contact.'
	},
	{
		key: 'swing_length',
		label: 'Swing Length',
		category: 'profile',
		description: 'The average distance the bat travels through the strike zone to complete a swing.'
	},
	{
		key: 'squared_up_rate',
		label: 'Squared Up Rate',
		category: 'profile',
		description:
			'The percentage of possible exit velocity achieved based on the player’s bat speed.'
	},
	{
		key: 'bb_percent',
		label: 'Walk Percentage',
		category: 'discipline',
		description: 'How often the hitter draws a walk as a percentage of overall plate appearances.'
	},
	{
		key: 'k_percent',
		label: 'Strikeout Percentage',
		category: 'discipline',
		description: 'How often the hitter strikes out as a percentage of overall plate appearances.'
	},
	{
		key: 'chase_percent',
		label: 'Chase Percentage',
		category: 'discipline',
		description: 'The frequency with which a batter swings at pitches outside of the strike zone.'
	},
	{
		key: 'whiff_percent',
		label: 'Whiff Percentage',
		category: 'discipline',
		description: 'The rate at which a batter swings and misses completely on a pitch.'
	},
	{
		key: 'xba',
		label: 'Expected BA',
		category: 'expected',
		description:
			'Expected Batting Average based purely on quality of contact and launch angle, removing defense.'
	},
	{
		key: 'xobp',
		label: 'Expected OBP',
		category: 'expected',
		description:
			'Expected On-Base Percentage combining quality of contact metrics with actual strike zone discipline.'
	},
	{
		key: 'xslg',
		label: 'Expected SLG',
		category: 'expected',
		description:
			'Expected Slugging Percentage measuring modeled extra-base power based on launch vectors.'
	},
	{
		key: 'xiso',
		label: 'Expected ISO',
		category: 'expected',
		description:
			'Expected Isolated Power (xSLG minus xBA) isolating the hitter’s raw extra-base capability.'
	},
	{
		key: 'xwoba',
		label: 'Expected wOBA',
		category: 'expected',
		description:
			'Expected Weighted On-Base Average, assigning proportional run values to all quality-of-contact outcomes.'
	}
];
