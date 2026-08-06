export const fieldingStatcastConfig = [
	{
		key: 'total_runs',
		percentileKey: 'total_runs',
		label: 'Fielding Run Value',
		category: 'overall',
		decimals: 1,
		runValue: true,
		description:
			'Total runs saved or surrendered across all defensive opportunities relative to average.',
		getValue: (data) => data?.fieldingRunValues?.total_runs
	},
	{
		key: 'range_runs',
		percentileKey: 'range_runs',
		label: 'Range (OAA)',
		category: 'defense',
		decimals: 1,
		runValue: true,
		description:
			'Runs saved based on Outs Above Average (OAA), measuring range and difficulty of plays made.',
		getValue: (data) => data?.fieldingRunValues?.range_runs
	},
	{
		key: 'arm_runs',
		percentileKey: 'arm_runs',
		label: 'Arm Value',
		category: 'defense',
		decimals: 1,
		runValue: true,
		description:
			'Runs saved by preventing advancement or throwing out runners on base hits and flyouts.',
		getValue: (data) => data?.fieldingRunValues?.arm_runs
	},
	{
		key: 'inf_of_runs',
		percentileKey: 'inf_of_runs',
		label: 'Inf / OF Run Value',
		category: 'defense',
		decimals: 1,
		runValue: true,
		description: 'Combined defensive run value saved across all non-catcher fielding plays.',
		getValue: (data) => data?.fieldingRunValues?.inf_of_runs
	},
	{
		key: 'catching_runs',
		percentileKey: 'catching_runs',
		label: 'Catcher Run Value',
		category: 'catcher',
		decimals: 1,
		runValue: true,
		description:
			'Overall runs saved by the catcher across framing, blocking, and throwing components.',
		getValue: (data) => data?.fieldingRunValues?.catching_runs
	},
	{
		key: 'framing_runs',
		percentileKey: 'framing_runs',
		label: 'Framing Runs',
		category: 'catcher',
		decimals: 1,
		runValue: true,
		description:
			'Runs saved by converting borderline pitches into called strikes for the pitching staff.',
		getValue: (data) => data?.fieldingRunValues?.framing_runs
	},
	{
		key: 'blocking_runs',
		percentileKey: 'blocking_runs',
		label: 'Blocking Runs',
		category: 'catcher',
		decimals: 1,
		runValue: true,
		description:
			'Runs saved by preventing passed balls and wild pitches on pitches out of the strike zone.',
		getValue: (data) => data?.fieldingRunValues?.blocking_runs
	},
	{
		key: 'throwing_runs',
		percentileKey: 'throwing_runs',
		label: 'Throwing Runs',
		category: 'catcher',
		runValue: true,
		decimals: 1,
		description:
			'Runs saved by controlling the opposition running game and throwing out stolen base attempts.',
		getValue: (data) => data?.fieldingRunValues?.throwing_runs
	},
	{
		key: 'arm_strength',
		percentileKey: 'arm_strength',
		label: 'Arm Strength',
		category: 'defense',
		runValue: false,
		decimals: 0,
		simple: true,
		description:
			'Percentile the player falls in for how hard they can throw the ball compared to the rest of the league.',
		getValue: (data) => data?.percentiles?.arm_strength
	}
];
