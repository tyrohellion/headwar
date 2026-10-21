<script>
	import AnimatedCounter from './animatedCounter.svelte';
	import { ordinal } from '$lib/mlbRanks.js';

	let { percentile = 0, label = '', abbr = '', stat = 0, tooltipText = '', rank = 0 } = $props();
	const tooltipId = `pill-tip-${Math.random().toString(36).substring(2, 9)}`;
	const rankTooltipId = `pill-rank-${Math.random().toString(36).substring(2, 9)}`;

</script>

{#if percentile === 'N/A' || percentile === '-.--' || percentile === 'NaN' || !percentile || String(percentile).includes('NaN')}
	<div class="stat-molucule-disabled">
		<div class="horizontal-wrapper"></div>

		{#if tooltipText}
			<wa-tooltip for={tooltipId}>{tooltipText}</wa-tooltip>
		{/if}

		<div class="stat-bar-container-disabled">
			<div class="stat-bar-content">
				<span class="stat-label" id={tooltipId}>{label}</span>
				<span class="stat-value">0</span>
			</div>
		</div>
	</div>
{:else}
	{#if tooltipText}
		<wa-tooltip for={tooltipId}>{tooltipText}</wa-tooltip>
	{/if}
	{#if rank}
		<wa-tooltip for={rankTooltipId}>Ranked {ordinal(rank)} in the MLB</wa-tooltip>
	{/if}
	<div class="stat-molucule">
		<div class="horizontal-wrapper"></div>
		<div class="stat-bar-container">
			<div class="stat-bar-content">
				<span class="stat-label" id={tooltipId}>{label}</span>
				<div class="name-badge-wrapper">
					<span class="stat-value">
						<AnimatedCounter value={percentile} />
					</span>
					{#if rank}
						<wa-badge
							appearance="accent"
							size="m"
							variant="brand"
							class="stat-rank"
							id={rankTooltipId}
						>
							#{rank}
						</wa-badge>
					{/if}
					<wa-badge appearance="filled" size="m" variant="neutral">{abbr}</wa-badge>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.stat-molucule {
		display: flex;
		justify-content: center;
		flex-direction: column;
		align-items: start;
		width: 100%;
		height: min-content;
		cursor: help;
	}

	.name-badge-wrapper {
		display: flex;
		gap: 0.5rem;
	}

	wa-badge {
		width: 42px;
		height: 26px;
	}

	.stat-rank {
		width: auto;
		height: 26px;
		font-variant-numeric: tabular-nums;
		font-weight: var(--wa-font-weight-bold, 600);
	}

	.stat-molucule-disabled {
		display: flex;
		justify-content: center;
		flex-direction: column;
		align-items: start;
		width: 100%;
		opacity: 0.25;
	}

	.stat-bar-container,
	.stat-bar-container-disabled {
		position: relative;
		width: 100%;
		height: 100%;
		border-radius: var(--wa-border-radius-s);
		overflow: hidden;
		padding: 0.5rem;
		transition: all 100ms ease;
	}

	.stat-bar-container:hover {
		transition: all 100ms ease;
		background-color: var(--wa-color-fill-normal);

		.name-badge-wrapper wa-badge {
			border-color: var(--wa-color-border-loud, var(--wa-color-brand-border-loud));
		}
	}

	.stat-bar-content {
		position: relative;
		z-index: 2;
		height: 100%;
		display: flex;
		justify-content: space-between;
		align-items: center;
		color: var(--wa-color-neutral-text);
	}

	.horizontal-wrapper {
		display: flex;
		align-items: center;
		width: 100%;
		justify-content: space-between;
	}

	.stat-label {
		font-weight: var(--wa-font-weight-semibold, 700);
		color: var(--wa-color-filled-on-normal);
		font-size: var(--wa-font-size-s);
		white-space: nowrap;
	}

	.stat-value {
		font-family: var(--font-mono);
		font-variant-numeric: tabular-nums;
		font-weight: var(--wa-font-weight-bold, 600);
		font-size: var(--wa-font-size-m);
		transition: color 0.3s ease;
	}
</style>
