export const pitchingStatsConfig = [
	// ==========================================
	// COMPLETE CATEGORY (Has Raw Value + Percentile)
	// ==========================================
	{
		key: 'xera',
		percentileKey: 'xera',
		label: 'Expected ERA (xERA)',
		category: 'expected',
		decimals: 2,
		invertColor: true,
		description: 'Expected ERA modeled from exit velocity, launch angle, and strikeout/walk rates.',
		getValue: (data) => data?.pitcherExpectedStats?.xera
	},
	{
		key: 'exit_velocity',
		percentileKey: 'exit_velocity',
		label: 'Avg Exit Velocity',
		category: 'quality_of_contact',
		decimals: 1,
		unit: 'mph',
		invertColor: true,
		description: 'Average exit velocity allowed on all batted balls.',
		getValue: (data) => data?.pitcherExitVeloBarrels?.avg_hit_speed ?? data?.custom?.exit_velocity
	},
	// {
	// 	key: 'max_ev',
	// 	percentileKey: 'max_ev',
	// 	label: 'Max Exit Velocity',
	// 	category: 'quality_of_contact',
	// 	decimals: 1,
	// 	unit: 'mph',
	// 	invertColor: true,
	// 	description: 'The maximum exit velocity allowed on any single batted ball.',
	// 	getValue: (data) => data?.pitcherExitVeloBarrels?.max_hit_speed
	// },
	{
		key: 'ev95percent',
		percentileKey: 'hard_hit_percent',
		label: 'Hard Hit %',
		category: 'quality_of_contact',
		decimals: 1,
		unit: '%',
		invertColor: true,
		description: 'Percentage of batted balls allowed at 95 mph or faster.',
		getValue: (data) => data?.pitcherExitVeloBarrels?.ev95percent ?? data?.custom?.hard_hit_percent
	},
	{
		key: 'brl_percent',
		percentileKey: 'brl_percent',
		label: 'Barrel %',
		category: 'quality_of_contact',
		decimals: 1,
		unit: '%',
		invertColor: true,
		description: 'Percentage of batted balls allowed classified as optimal Barrels.',
		getValue: (data) =>
			data?.pitcherExitVeloBarrels?.brl_percent ?? data?.custom?.barrel_batted_rate
	},
	{
		key: 'woba',
		percentileKey: 'xwoba',
		label: 'Expected wOBA',
		category: 'expected',
		decimals: 3,
		invertColor: true,
		description:
			'Expected Weighted On-Base Average allowed based on hit exit velocity and launch angle.',
		getValue: (data) => data?.pitcherExpectedStats?.est_woba ?? data?.custom?.xwoba
	},
	{
		key: 'xba',
		percentileKey: 'xba',
		label: 'Expected BA',
		category: 'expected',
		decimals: 3,
		invertColor: true,
		description: 'Expected Batting Average allowed based on contact quality and launch angle.',
		getValue: (data) => data?.pitcherExpectedStats?.est_ba
	},
	{
		key: 'xslg',
		percentileKey: 'xslg',
		label: 'Expected SLG',
		category: 'expected',
		decimals: 3,
		invertColor: true,
		description: 'Expected Slugging Percentage allowed measuring contact power permitted.',
		getValue: (data) => data?.pitcherExpectedStats?.est_slg
	},
	{
		key: 'k_percent',
		percentileKey: 'k_percent',
		label: 'Strikeout %',
		category: 'discipline',
		decimals: 1,
		unit: '%',
		invertColor: false,
		description: 'Percentage of total batters faced who were struck out.',
		getValue: (data) => data?.pitcherPercentiles?.k_percent ?? data?.custom?.k_percent
	},
	{
		key: 'bb_percent',
		percentileKey: 'bb_percent',
		label: 'Walk %',
		category: 'discipline',
		decimals: 1,
		unit: '%',
		invertColor: true,
		description: 'Percentage of total batters faced who were walked.',
		getValue: (data) => data?.pitcherPercentiles?.bb_percent ?? data?.custom?.bb_percent
	},
	{
		key: 'whiff_percent',
		percentileKey: 'whiff_percent',
		label: 'Whiff %',
		category: 'discipline',
		decimals: 1,
		unit: '%',
		invertColor: false,
		description: 'Percentage of swings by opposing batters that resulted in a miss.',
		getValue: (data) => data?.pitcherPercentiles?.whiff_percent
	},
	{
		key: 'chase_percent',
		percentileKey: 'chase_percent',
		label: 'Chase %',
		category: 'discipline',
		decimals: 1,
		unit: '%',
		invertColor: false,
		description: 'Percentage of pitches outside the strike zone swung at by batters.',
		getValue: (data) => data?.pitcherPercentiles?.chase_percent
	},

	// ==========================================
	// PITCH METRICS & VELOCITY
	// ==========================================
	{
		key: 'fb_velocity',
		percentileKey: 'fb_velocity',
		label: 'Fastball Velocity',
		category: 'pitch_metrics',
		decimals: 1,
		unit: 'mph',
		invertColor: false,
		description: 'Average velocity of four-seam fastballs thrown.',
		getValue: (data) => data?.pitcherPercentiles?.fb_velocity ?? data?.custom?.fb_velocity
	},
	{
		key: 'fb_spin',
		percentileKey: 'fb_spin',
		label: 'Fastball Spin Rate',
		category: 'pitch_metrics',
		decimals: 0,
		unit: 'rpm',
		invertColor: false,
		description: 'Average spin rate in revolutions per minute on fastballs.',
		getValue: (data) => data?.pitcherPercentiles?.fb_spin_val ?? data?.custom?.fb_spin
	},
	{
		key: 'curve_spin',
		percentileKey: 'curve_spin',
		label: 'Curveball Spin Rate',
		category: 'pitch_metrics',
		decimals: 0,
		unit: 'rpm',
		invertColor: false,
		description: 'Average spin rate in revolutions per minute on curveballs.',
		getValue: (data) => data?.pitcherPercentiles?.curve_spin_val ?? data?.custom?.curve_spin
	},

	// ==========================================
	// BATTED BALL PROFILE & DISTANCES
	// ==========================================
	{
		key: 'sweet_spot_percent',
		percentileKey: 'sweet_spot_percent',
		label: 'Sweet Spot %',
		category: 'profile',
		decimals: 1,
		unit: '%',
		invertColor: true,
		description: 'Percentage of batted balls allowed with launch angle between 8° and 32°.',
		getValue: (data) => data?.pitcherExitVeloBarrels?.anglesweetspotpercent
	},
	{
		key: 'avg_hit_angle',
		percentileKey: 'avg_hit_angle',
		label: 'Launch Angle',
		category: 'profile',
		decimals: 1,
		unit: '°',
		invertColor: false,
		description: 'Average launch angle of all batted balls allowed off the bat.',
		getValue: (data) => data?.pitcherExitVeloBarrels?.avg_hit_angle
	},
	{
		key: 'avg_distance',
		percentileKey: 'avg_distance',
		label: 'Avg Hit Distance',
		category: 'profile',
		decimals: 0,
		unit: 'ft',
		invertColor: true,
		description: 'Average distance traveled on all batted balls allowed.',
		getValue: (data) => data?.pitcherExitVeloBarrels?.avg_distance
	},
	{
		key: 'ev50',
		percentileKey: 'ev50',
		label: 'EV50',
		category: 'quality_of_contact',
		decimals: 1,
		unit: 'mph',
		invertColor: true,
		description: 'Average exit velocity of the top 50% hardest-hit balls allowed.',
		getValue: (data) => data?.pitcherExitVeloBarrels?.ev50
	}
];
