<script>
	import AnimatedCounter from './animatedCounter.svelte';

	let { percentile = 0, label = '', abbr = '', stat = 0, tooltipText = '' } = $props();
	const tooltipId = `tooltip-${label.toLowerCase().replace(/\s+/g, '-')}`;
</script>

{#if percentile === 'N/A' || percentile === '-.--'}
	<div class="stat-molucule-disabled">
		<div class="horizontal-wrapper"></div>

		{#if tooltipText}
			<wa-tooltip for={tooltipId}>{tooltipText}</wa-tooltip>
		{/if}

		<div class="stat-bar-container-disabled">
			<div class="stat-bar-content">
				<span class="stat-label" id={tooltipId}>{label}</span>
				<span class="stat-value">
					{percentile}
				</span>
			</div>
		</div>
	</div>
{:else}
	{#if tooltipText}
		<wa-tooltip for={tooltipId}>{tooltipText}</wa-tooltip>
	{/if}
	<div class="stat-molucule" id={tooltipId}>
		<div class="horizontal-wrapper"></div>
		<div class="stat-bar-container">
			<div class="stat-bar-content">
				<span class="stat-label">{label}</span>
				<div class="name-badge-wrapper">
					<span class="stat-value">
						<!-- Animate the changes to the number safely here -->
						<AnimatedCounter value={percentile} />
					</span>
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
	}

	.name-badge-wrapper {
		display: flex;
		gap: 0.5rem;
	}

	wa-badge {
		width: 42px;
		height: 26px;
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
		transform: scale(1.03);
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
		cursor: help;
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
