<script>
	import AnimatedCounter from './animatedCounter.svelte';

	let {
		label = '',
		stat = 0,
		percentile = 0,
		decimals = 3,
		invertColor = false,
		runValue = false,
		tooltipText = '',
		simple = false
	} = $props();

	const tooltipId = `statcast-pill-${Math.random().toString(36).substring(2, 9)}`;

	const numericStat = $derived.by(() => {
		const num = parseFloat(String(stat));
		return isNaN(num) ? null : num;
	});

	const rawPercentile = $derived.by(() => {
		const num = parseFloat(String(percentile));
		if (isNaN(num)) return null;
		return Math.min(Math.max(num, 0), 100);
	});

	const isInvalid = $derived(runValue ? numericStat === null : rawPercentile === null);

	const effectivePercentile = $derived.by(() => {
		if (rawPercentile === null) return 0;
		return invertColor ? 100 - rawPercentile : rawPercentile;
	});

	const formattedStat = $derived.by(() => {
		if (numericStat === null) return stat;
		return decimals > 0 ? numericStat.toFixed(decimals) : Math.round(numericStat);
	});

	const activeColor = $derived.by(() => {
		if (runValue) {
			if (numericStat === null) return 'var(--wa-color-neutral-50)';
			if (numericStat >= 1) return 'var(--wa-color-success-60)';
			if (numericStat <= -0.5) return 'var(--wa-color-danger-80)';
			if (numericStat <= -1) return 'var(--wa-color-danger-40)';
			return 'var(--wa-color-neutral-50)';
		}

		if (isInvalid) return 'var(--wa-color-neutral-500)';

		const p = effectivePercentile;
		if (p >= 90) return 'var(--wa-color-success-60)';
		if (p >= 60) return 'var(--wa-color-success-80)';
		if (p > 40) return 'var(--wa-color-neutral-50)';
		if (p >= 10) return 'var(--wa-color-danger-80)';
		return 'var(--wa-color-danger-40)';
	});
</script>

{#if !isInvalid}
	{#if tooltipText}
		<wa-tooltip for={tooltipId}>{tooltipText}</wa-tooltip>
	{/if}

	<div class="statcast-pill" id={tooltipId}>
		<div class="pill-header">
			<span class="stat-label">{label}</span>
			{#if !simple && !runValue && rawPercentile !== null}
				<wa-badge appearance="filled" size="s">
					{Math.round(rawPercentile)}
				</wa-badge>
			{/if}
		</div>

		<div class="pill-body">
			<span class="stat-value" style="color: {activeColor};">
				{#if typeof stat === 'number' || numericStat !== null}
					<AnimatedCounter value={formattedStat} />
				{:else}
					{formattedStat}
				{/if}
			</span>
		</div>

		{#if !runValue && rawPercentile !== null}
			<div class="percentile-track">
				<div class="league-avg-tick" title="50th Percentile (League Avg)"></div>
				<div
					class="percentile-fill"
					style="width: {rawPercentile}%; background-color: {activeColor};"
				></div>
			</div>
		{/if}
	</div>
{/if}

<style>
	.statcast-pill {
		position: relative;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		gap: 0.5rem;
		min-width: 300px;
		padding: 1rem;
		background-color: var(--wa-color-surface-low, var(--wa-color-neutral-0));
		border: 1px solid var(--wa-color-border-quiet, #e0e0e0);
		border-radius: var(--wa-border-radius-m, 8px);
		overflow: hidden;
		cursor: help;
		transition:
			transform 120ms ease,
			box-shadow 120ms ease;
	}

	.statcast-pill:hover {
		transform: translateY(-2px);
		box-shadow: var(--wa-shadow-s, 0 2px 8px rgba(0, 0, 0, 0.08));
		border-color: var(--wa-color-border-loud, #b0b0b0);
	}

	.pill-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
	}

	.stat-label {
		font-size: var(--wa-font-size-xs, 0.75rem);
		font-weight: var(--wa-font-weight-semibold, 600);
		color: var(--wa-color-text-quiet, #666666);
		text-transform: uppercase;
		letter-spacing: 0.03em;
		white-space: nowrap;
	}

	.pill-body {
		display: flex;
		align-items: baseline;
	}

	.stat-value {
		font-family: var(--font-mono, monospace);
		font-variant-numeric: tabular-nums;
		font-weight: var(--wa-font-weight-bold, 700);
		font-size: var(--wa-font-size-xl, 1.5rem);
		line-height: 1;
		transition: color 0.3s ease;
	}

	.percentile-track {
		position: absolute;
		bottom: 0;
		left: 0;
		width: 100%;
		height: 4px;
	}

	.percentile-fill {
		height: 100%;
		transition: width 0.5s cubic-bezier(0.25, 1, 0.5, 1);
	}

	.league-avg-tick {
		position: absolute;
		left: 50%;
		bottom: 0;
		width: 2px;
		height: 6px;
		background-color: var(--wa-color-neutral-600);
		z-index: 2;
	}

	@media (max-width: 1200px) {
		.statcast-pill {
			flex-wrap: wrap;
			min-width: 200px;
		}
	}
</style>
