<script>
	import AnimatedCounter from './animatedCounter.svelte';

	let {
		percentile = 0,
		label = '',
		abbr = '',
		stat = 0,
		careerSeasonLength = 0,
		tooltipText = '',
		isRetired = false
	} = $props();

	const tooltipId = `pill-tip-${Math.random().toString(36).substring(2, 9)}`;

	const isOps = $derived(abbr.toUpperCase() === 'OPS');
	const isBRV = $derived(abbr.toUpperCase() === 'BRV');
	const isBRRV = $derived(abbr.toUpperCase() === 'BRRV');
	const isPRV = $derived(abbr.toUpperCase() === 'PRV');
	const isFRV = $derived(abbr.toUpperCase() === 'FRV');
	const isEra = $derived(abbr.toUpperCase() === 'ERA');
	const isFip = $derived(abbr.toUpperCase() === 'FIP');
	const isHwar = $derived(abbr.toUpperCase() === 'HWAR');
	const isAvg = $derived(abbr.toUpperCase() === 'AVG' || abbr.toUpperCase() === 'BA');
	const isObp = $derived(abbr.toUpperCase() === 'OBP');
	const isSlg = $derived(abbr.toUpperCase() === 'SLG');

	const numericValue = $derived.by(() => {
		const num = parseFloat(stat);
		return isNaN(num) ? 0 : num;
	});

	const disableVisuals = $derived(isNaN(parseFloat(stat)) || numericValue === 0);

	const activeColor = $derived.by(() => {
		if (disableVisuals) return 'var(--wa-color-filled-on-normal)';

		if (isOps) {
			if (numericValue >= 0.9) return 'var(--wa-color-success-60)';
			if (numericValue >= 0.8) return 'var(--wa-color-success-80)';
			if (numericValue >= 0.72) return 'var(--wa-color-neutral-50)';
			return 'var(--wa-color-danger-70)';
		}

		if (isEra || isFip) {
			if (numericValue <= 3.0) return 'var(--wa-color-success-60)';
			if (numericValue <= 4.0) return 'var(--wa-color-success-80)';
			if (numericValue <= 4.8) return 'var(--wa-color-neutral-50)';
			return 'var(--wa-color-danger-70)';
		}

		if (isHwar) {
			if (numericValue >= 8) return 'var(--wa-color-success-60)';
			if (numericValue >= 5) return 'var(--wa-color-success-70)';
			if (numericValue >= 2) return 'var(--wa-color-success-80)';
			if (numericValue >= 0) return 'var(--wa-color-neutral-50)';
			return 'var(--wa-color-danger-70)';
		}

		if (isAvg) {
			if (numericValue >= 0.3) return 'var(--wa-color-success-60)';
			if (numericValue >= 0.27) return 'var(--wa-color-success-80)';
			if (numericValue >= 0.24) return 'var(--wa-color-neutral-50)';
			return 'var(--wa-color-danger-70)';
		}

		if (isObp) {
			if (numericValue >= 0.39) return 'var(--wa-color-success-60)';
			if (numericValue >= 0.35) return 'var(--wa-color-success-80)';
			if (numericValue >= 0.315) return 'var(--wa-color-neutral-50)';
			return 'var(--wa-color-danger-70)';
		}

		if (isSlg) {
			if (numericValue >= 0.5) return 'var(--wa-color-success-60)';
			if (numericValue >= 0.44) return 'var(--wa-color-success-80)';
			if (numericValue >= 0.39) return 'var(--wa-color-neutral-50)';
			return 'var(--wa-color-danger-70)';
		}

		if (isBRV || isBRRV || isPRV || isFRV) {
			if (numericValue >= 25) return 'var(--wa-color-success-60)';
			if (numericValue >= 15) return 'var(--wa-color-success-70)';
			if (numericValue >= 5) return 'var(--wa-color-success-80)';
			if (numericValue >= 0) return 'var(--wa-color-neutral-50)';
			return 'var(--wa-color-danger-70)';
		}

		return 'var(--wa-color-filled-on-normal)';
	});
</script>

{#if stat === 'N/A' || stat === '-.--' || stat === 'NaN' || stat === undefined || stat === null}
	<!-- empty placeholder -->
{:else}
	{#if tooltipText}
		<wa-tooltip for={tooltipId}>{tooltipText}</wa-tooltip>
	{/if}
	<div class="stat-molucule" id={tooltipId}>
		<span class="stat-label">{label}</span>
		<div class="name-badge-wrapper">
			<div class="war-career-length-wrapper">
				<span class="stat-value" style="color: {activeColor};">
					<AnimatedCounter value={stat} />
				</span>
				{#if careerSeasonLength !== 0}
					<span class="season-count"> / </span>
					<span class="season-count">
						<AnimatedCounter value={careerSeasonLength} />
					</span>
				{/if}
			</div>
			<wa-badge appearance="filled" size="m" variant="neutral">{abbr}</wa-badge>
		</div>
	</div>
{/if}

<style>
	.stat-molucule {
		position: relative;
		display: flex;
		flex: 1;
		justify-content: center;
		flex-direction: column;
		align-items: start;
		gap: 1rem;
		min-width: 280px;
		cursor: help;
		padding: 1rem 3rem 1.25rem 1rem;
		transition: all 100ms ease;
		border-radius: var(--wa-border-radius-s);
		border: 1px solid var(--wa-color-border-quiet, var(--wa-color-brand-border-loud));
		overflow: hidden;
	}

	.name-badge-wrapper {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	wa-badge {
		width: 42px;
		height: 26px;
	}

	.stat-molucule:hover {
		transform: scale(1.03);
		transition: all 100ms ease;
		background-color: var(--wa-color-fill-normal);

		.name-badge-wrapper wa-badge {
			border-color: var(--wa-color-border-loud, var(--wa-color-brand-border-loud));
		}
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
		font-size: var(--wa-font-size-xl);
		transition: color 0.3s ease;
	}

	.war-career-length-wrapper {
		display: flex;
		align-items: center;
		gap: 0.2rem;
	}

	.season-count {
		font-family: var(--font-mono);
		font-variant-numeric: tabular-nums;
		font-weight: var(--wa-font-weight-bold, 600);
		font-size: var(--wa-font-size-s);
		color: var(--wa-color-neutral-on-quiet);
	}
</style>
