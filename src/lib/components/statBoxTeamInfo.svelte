<script>
	import AnimatedCounter from './animatedCounter.svelte';

	let {
		teamName = '',
		teamId = null,
		teamLogo = '',
		record = { wins: 0, losses: 0, winningPercentage: '.000', divisionRank: '1' },
		division = '',
		divisionStandings = []
	} = $props();

	const deepStats = $derived(
		divisionStandings.find((row) => row.team?.id === Number(teamId)) || null
	);

	const xRecordSeason = $derived(
		deepStats?.records?.expectedRecords?.find((r) => r.type === 'xWinLossSeason') || null
	);

	const winrate = $derived(parseFloat(record.winningPercentage) || 0);

	const activeColor = $derived.by(() => {
		if (winrate > 0.5) return 'var(--wa-color-success-60)';
		if (winrate < 0.5) return 'var(--wa-color-danger-70)';
		return 'var(--wa-color-filled-on-normal)';
	});

	const badgeVariant = $derived(winrate >= 0.5 ? 'brand' : 'neutral');

	const formatDiff = (diff) => {
		const num = parseInt(diff);
		if (isNaN(num)) return '0';
		return num > 0 ? `+${num}` : `${num}`;
	};
</script>

<div class="stat-molecule">
	<div class="team-header">
		{#if teamLogo}
			<img src={teamLogo} alt="{teamName} logo" class="team-logo" />
		{/if}
		<div class="team-identity">
			<span class="team-title">{teamName}</span>
			<span class="division-rank">
				#{record?.divisionRank || deepStats?.divisionRank || '1'} in {division}
				{#if deepStats && deepStats.gamesBack !== '-'}
					<span class="games-back">(-{deepStats.gamesBack} Games)</span>
				{/if}
			</span>
		</div>
	</div>

	<div class="record-wrapper">
		<div class="record-numbers">
			<span class="stat-value" style="color: {activeColor};">
				<AnimatedCounter value={record?.wins} />
			</span>
			<span class="record-separator">-</span>
			<span class="stat-value">
				<AnimatedCounter value={record?.losses} />
			</span>
		</div>
		<span class="stat-value-supporting-text">
			<AnimatedCounter value={record?.winningPercentage} />
		</span>

		{#if deepStats?.streak?.streakCode}
			<span class="streak-pill" class:hot={deepStats.streak.streakType === 'wins'}>
				{deepStats.streak.streakCode}
			</span>
		{/if}
	</div>

	{#if deepStats}
		<div class="deep-insights-grid">
			<div class="insight-item">
				<span class="insight-label">Diff</span>
				<span class="insight-value" class:positive={parseInt(deepStats.runDifferential) > 0}>
					<AnimatedCounter value={formatDiff(deepStats.runDifferential)} />
				</span>
			</div>

			<wa-divider orientation="vertical"></wa-divider>

			<div class="insight-item">
				<span class="insight-label">Runs</span>
				<span class="insight-value text-muted">
					<AnimatedCounter value={deepStats.runsScored} />/<AnimatedCounter
						value={deepStats.runsAllowed}
					/>
				</span>
			</div>

			<wa-divider orientation="vertical"></wa-divider>

			{#if xRecordSeason}
				<div class="insight-item long">
					<span class="insight-label">Projected Pace</span>
					<span class="insight-value projection-text">
						<AnimatedCounter value={xRecordSeason.wins} /> - <AnimatedCounter
							value={xRecordSeason.losses}
						/>
					</span>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.stat-molecule {
		position: relative;
		display: flex;
		flex: 1;
		justify-content: center;
		flex-direction: column;
		align-items: start;
		gap: 1rem;
		min-width: 280px;
		padding: 1.25rem 1.5rem;
		transition: all 100ms ease;
		border-radius: var(--wa-border-radius-s);
		border: 1px solid var(--wa-color-border-quiet, var(--wa-color-brand-border-loud));
		overflow: hidden;
		background-color: transparent;
	}

	.stat-molecule:hover {
		transform: scale(1.02);
		background-color: var(--wa-color-fill-normal);

		wa-badge {
			border-color: var(--wa-color-border-loud, var(--wa-color-brand-border-loud));
		}
	}

	.team-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		width: 100%;
	}

	.team-logo {
		max-width: 44px;
		width: 44px;
		height: 44px;
		max-height: 44px;
		background-color: var(--wa-color-gray-80);
		padding: 0.6rem;
		box-shadow: var(--wa-shadow-l);
	}

	.team-identity {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}

	.team-title {
		font-weight: var(--wa-font-weight-semibold, 700);
		color: var(--wa-color-filled-on-normal);
		font-size: var(--wa-font-size-m);
		line-height: 1.2;
	}

	.division-rank {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		font-size: var(--wa-font-size-s);
		color: var(--wa-color-neutral-on-quiet);
		font-weight: var(--wa-font-weight-medium, 500);
	}

	.games-back {
		font-size: var(--wa-font-size-xs);
		color: var(--wa-color-neutral-on-quiet);
		opacity: 0.85;
	}

	.record-wrapper {
		display: flex;
		align-items: center;
		justify-content: start;
		gap: 0.75rem;
		width: 100%;
	}

	.record-numbers {
		display: flex;
		align-items: center;
		gap: 0.3rem;
	}

	.stat-value {
		font-family: var(--font-mono);
		font-variant-numeric: tabular-nums;
		font-weight: var(--wa-font-weight-bold, 600);
		font-size: var(--wa-font-size-xl);
		transition: color 0.3s ease;
		color: var(--wa-color-filled-on-normal);
	}

	.record-separator {
		font-family: var(--font-mono);
		font-size: var(--wa-font-size-xl);
		color: var(--wa-color-neutral-on-quiet);
		font-weight: var(--wa-font-weight-bold, 600);
	}

	.stat-value-supporting-text {
		font-family: var(--font-mono);
		font-variant-numeric: tabular-nums;
		font-weight: var(--wa-font-weight-bold, 600);
		font-size: var(--wa-font-size-s);
		color: var(--wa-color-neutral-on-quiet);
	}

	wa-badge {
		font-family: var(--font-mono);
		height: 26px;
		padding: 0 0.5rem;
	}

	.streak-pill {
		display: flex;
		justify-content: center;
		align-items: center;
		font-size: var(--wa-font-size-xs);
		font-family: var(--font-mono);
		padding: 4px 6px 4px 6px;
		border-radius: var(--wa-border-radius-s);
		background-color: rgba(var(--wa-color-neutral-rgb, 128, 128, 128), 0.1);
		color: var(--wa-color-neutral-on-quiet);
		border: 1px solid var(--wa-color-border-quiet);
	}

	.streak-pill.hot {
		background-color: rgba(46, 204, 113, 0.1);
		color: var(--wa-color-success-60);
		border-color: rgba(46, 204, 113, 0.2);
	}

	.deep-insights-grid {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		width: 100%;
		gap: 1rem;
		padding-top: 1rem;
		border-top: 1px dashed var(--wa-color-border-quiet);
	}

	.insight-item {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.insight-item.long {
		min-width: 100px;
	}

	.insight-label {
		font-size: 10px;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--wa-color-neutral-on-quiet);
		font-weight: var(--wa-font-weight-medium, 500);
	}

	.insight-value {
		font-size: var(--wa-font-size-s);
		font-family: var(--font-mono);
		font-weight: var(--wa-font-weight-semibold, 600);
		color: var(--wa-color-danger-70);
	}

	.insight-value.positive {
		color: var(--wa-color-success-60);
	}

	.insight-value.text-muted {
		color: var(--wa-color-filled-on-normal);
		opacity: 0.8;
	}

	.projection-text {
		color: var(--wa-color-brand-text, var(--wa-color-filled-on-normal));
	}

	@media (max-width: 768px) {
		.deep-insights-grid {
			gap: 0.5rem;
		}
	}
</style>
