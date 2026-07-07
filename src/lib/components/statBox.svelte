<script>
	import AnimatedCounter from './animatedCounter.svelte';

	let {
		percentile = 0,
		label = '',
		abbr = '',
		stat = 0,
		careerSeasonLength = 0,
		progressContext = '',
		rank = undefined,
		tooltipText = '',
		isRetired = false
	} = $props();

	const tooltipId = `pill-tip-${Math.random().toString(36).substring(2, 9)}`;

	const isCareer = $derived(label.toLowerCase().includes('career'));
	const isNormalizedStat = $derived(abbr === 'OPS+' || abbr === 'ERA+');
	const isWarStat = $derived(abbr === 'WAR');

	const isCareerWar = $derived(isCareer && isWarStat);

	const disableVisuals = $derived(isNaN(parseFloat(percentile)));

	let numericValue = $derived.by(() => {
		const num = parseFloat(percentile);
		return isNaN(num) ? 0 : num;
	});

	let activeColor = $derived.by(() => {
		if (isNaN(parseFloat(percentile))) return 'var(--wa-color-neutral-text)';

		if (isCareerWar) return 'var(--wa-color-filled-on-normal)';
		if (disableVisuals) return 'var(--wa-color-filled-on-normal)';

		if (isNormalizedStat) {
			if (numericValue >= 140) return 'var(--wa-color-success-60)';
			if (numericValue >= 115) return 'var(--wa-color-success-80)';
			if (numericValue >= 90) return 'var(--wa-color-neutral-50)';
			return 'var(--wa-color-danger-70)';
		} else {
			if (numericValue >= 5.0) return 'var(--wa-color-success-60)';
			if (numericValue >= 2.5) return 'var(--wa-color-success-80)';
			if (numericValue >= 0.5) return 'var(--wa-color-neutral-50)';
			return 'var(--wa-color-danger-70)';
		}
	});

	let fillWidthPercent = $derived.by(() => {
		if (!isNormalizedStat || disableVisuals) return 0;
		return Math.min(Math.max((numericValue / 200) * 100, 0), 100);
	});
</script>

{#if percentile === 'N/A' || percentile === '-.--' || percentile === 'NaN' || !percentile || String(percentile).includes('NaN')}
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
					<AnimatedCounter value={percentile} />
				</span>
				{#if !careerSeasonLength == 0}
					<span class="season-count"> / </span>
					<span class="season-count">
						<AnimatedCounter value={careerSeasonLength} />
					</span>
				{/if}
				{#if progressContext !== ''}
					<span class="progress-count"> / </span>
					<span class="progress-count">
						<AnimatedCounter value={progressContext} />%
					</span>
				{/if}
			</div>
			<div class="badges-wrapper">
				<wa-badge appearance="filled" size="m" variant="neutral">{abbr}</wa-badge>
				{#if rank}
					<wa-badge appearance="filled" size="m" variant="brand">{rank}</wa-badge>
				{/if}
			</div>
		</div>

		{#if isNormalizedStat && !disableVisuals}
			<div class="context-track">
				<div class="league-avg-tick"></div>
				<div
					class="context-fill"
					style="width: {fillWidthPercent}%; background-color: {activeColor};"
				></div>
			</div>
		{/if}

		{#if isWarStat && !disableVisuals && !isCareerWar}
			<div class="segmented-track">
				<div
					class="track-segment"
					style="background-color: {numericValue >= 0
						? activeColor
						: 'var(--wa-color-border-quiet)'}"
				></div>

				<div
					class="track-segment"
					style="background-color: {numericValue >= 0.5
						? activeColor
						: 'var(--wa-color-border-quiet)'}"
				></div>

				<div
					class="track-segment"
					style="background-color: {numericValue >= 2.5
						? activeColor
						: 'var(--wa-color-border-quiet)'}"
				></div>

				<div
					class="track-segment"
					style="background-color: {numericValue >= 5.0
						? activeColor
						: 'var(--wa-color-border-quiet)'}"
				></div>
			</div>
		{/if}
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
		min-width: 160px;
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

	.badges-wrapper {
		display: flex;
		gap: 0.5rem;
	}

	.season-count {
		font-family: var(--font-mono);
		font-variant-numeric: tabular-nums;
		font-weight: var(--wa-font-weight-bold, 600);
		font-size: var(--wa-font-size-s);
		color: var(--wa-color-neutral-on-quiet);
	}

	.progress-count {
		font-family: var(--font-mono);
		font-variant-numeric: tabular-nums;
		font-weight: var(--wa-font-weight-bold, 600);
		font-size: var(--wa-font-size-s);
		color: var(--wa-color-neutral-on-quiet);
	}

	.context-track {
		position: absolute;
		bottom: 0;
		left: 0;
		width: 100%;
		height: 4px;
		background-color: var(--wa-color-border-quiet, rgba(0, 0, 0, 0.05));
	}

	.context-fill {
		height: 100%;
		transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.league-avg-tick {
		position: absolute;
		left: 50%;
		bottom: 0;
		width: 1px;
		height: 12px;
		background-color: var(--wa-color-border-loud, #888);
		z-index: 3;
	}

	/* Segmented Track Styles */
	.segmented-track {
		position: absolute;
		bottom: 0;
		left: 0;
		width: 100%;
		height: 4px;
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 2px;
		background-color: transparent;
	}

	.track-segment {
		height: 100%;
		background-color: var(--wa-color-border-quiet, rgba(0, 0, 0, 0.05));
		transition: background-color 0.4s ease;
	}
</style>
