<script>
	let { percentile = 0, label = 'Exit Velocity', stat = 0, tooltipText = '' } = $props();

	const tooltipId = `tooltip-${label.toLowerCase().replace(/\s+/g, '-')}`;

	let widthPercent = $derived(() => {
		return Math.min(Math.max(percentile, 0), 100);
	});

	let activeColor = $derived.by(() => {
		if (percentile >= 90) return 'var(--wa-color-success-60)';
		if (percentile >= 70) return 'var(--wa-color-success-80)';
		if (percentile >= 40) return 'var(--wa-color-brand-50)';
		if (percentile >= 15) return 'var(--wa-color-brand-50)';
		if (percentile >= 0) return 'var(--wa-color-brand-50)';
	});

	let fillOpacity = $derived.by(() => {
		if (percentile >= 90) return '0.45';
		if (percentile >= 70) return '0.25';
		if (percentile >= 40) return '0.15';
		if (percentile >= 15) return '0.07';
		if (percentile >= 0) return '0.03';
		return '0.10';
	});
</script>

<div class="stat-molucule">
	<div class="horizontal-wrapper">
		<span class="stat-label" id={tooltipId}>{label}</span>
		<span class="stat-value" style="color: {activeColor};">
			{percentile}
		</span>
	</div>

	{#if tooltipText}
		<wa-tooltip for={tooltipId}>{tooltipText}</wa-tooltip>
	{/if}

	<div class="stat-bar-container">
		<div
			class="stat-bar-fill"
			style="width: {widthPercent()}%; background-color: {activeColor}; opacity: {fillOpacity};"
		></div>

		<div class="stat-bar-content"></div>
	</div>
</div>

<style>
	.stat-molucule {
		display: flex;
		justify-content: center;
		flex-direction: column;
		align-items: start;
		width: 100%;
		max-width: 320px;
		height: 3rem;
	}
	.stat-bar-container {
		position: relative;
		width: 100%;
		height: 100%;
		background-color: var(--wa-color-surface-raised);
		border-radius: var(--wa-border-radius-m);
		overflow: hidden;
		border: 1px solid var(--wa-color-border-quiet);
		box-shadow: var(--wa-shadow-l);
		transition: all 100ms ease;
	}

	.stat-bar-container:hover {
		transform: scale(1.03);
		transition: all 100ms ease;
	}

	.stat-bar-fill {
		position: absolute;
		top: 0;
		left: 0;
		height: 100%;
		z-index: 1;
		transition:
			width 0.5s cubic-bezier(0.4, 0, 0.2, 1),
			background-color 0.3s ease;
	}

	.stat-bar-content {
		position: relative;
		z-index: 2;
		height: 100%;
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
		color: var(--wa-color-neutral-text);
	}

	.horizontal-wrapper {
		display: flex;
		align-items: center;
		width: 100%;
		justify-content: space-between;
	}

	.stat-label {
		font-family: 'JetBrains Mono Variable', monospace;
		font-weight: var(--wa-font-weight-semibold, 700);
		color: var(--wa-color-filled-on-normal);
		text-transform: uppercase;
		font-size: var(--wa-font-size-s);
		cursor: help;
		white-space: nowrap;
	}

	.stat-value {
		font-family: 'JetBrains Mono Variable', monospace;
		font-variant-numeric: tabular-nums;
		font-weight: var(--wa-font-weight-bold, 700);
		font-size: var(--wa-font-size-l);
		transition: color 0.3s ease;
	}
</style>
