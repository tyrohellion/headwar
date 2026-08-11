<script>
	import WaSkeleton from '@awesome.me/webawesome/dist/components/skeleton/skeleton.js';
	import WaBadge from '@awesome.me/webawesome/dist/components/badge/badge.js';
	import WaTooltip from '@awesome.me/webawesome/dist/components/tooltip/tooltip.js';

	let { label = '', tooltipText = '', pulsing = false } = $props();

	const tooltipId = `statcast-pill-skeleton-${Math.random().toString(36).substring(2, 9)}`;
</script>

{#if tooltipText}
	<wa-tooltip for={tooltipId}>{tooltipText}</wa-tooltip>
{/if}

<div class="statcast-pill" id={tooltipId} aria-disabled="true" aria-busy={pulsing}>
	<div class="pill-header">
		<span class="stat-label">{label}</span>
		{#if !pulsing}
			<wa-badge variant="neutral" appearance="outlined" size="s">Not enough data</wa-badge>
		{/if}
	</div>

	<div class="pill-body">
		<wa-skeleton effect={pulsing ? 'pulse' : ''} class="stat-value-skeleton"></wa-skeleton>
	</div>

	<div class="percentile-track">
		<div class="league-avg-tick" title="50th Percentile (League Avg)"></div>
		<div class="percentile-fill"></div>
	</div>
</div>

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
		border: 1px dashed var(--wa-color-border-quiet, #e0e0e0);
		border-radius: var(--wa-border-radius-m, 8px);
		overflow: hidden;
		cursor: not-allowed;
		opacity: 0.7;
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

	.stat-value-skeleton {
		width: 55%;
		height: 1.5rem;
		--wa-skeleton-radius: var(--wa-border-radius-s, 4px);
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
		width: 45%;
		background-color: var(--wa-color-neutral-300, #cccccc);
		opacity: 0.6;
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
