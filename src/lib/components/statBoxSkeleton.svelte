<script>
	import WaSkeleton from '@awesome.me/webawesome/dist/components/skeleton/skeleton.js';

	let {
		abbr = '',
		careerSeasonLength = 0,
		rank = undefined,
		progressContext = '',
		pulsing = true
	} = $props();
</script>

<div class="stat-molucule" aria-disabled="true" aria-busy={pulsing}>
	<wa-skeleton effect={pulsing ? 'pulse' : ''} class="label-skeleton"></wa-skeleton>
	<div class="name-badge-wrapper">
		<wa-skeleton effect={pulsing ? 'pulse' : ''} class="value-skeleton"></wa-skeleton>
		<div class="badges-wrapper">
			<wa-skeleton effect={pulsing ? 'pulse' : ''} class="badge-skeleton"></wa-skeleton>
			{#if careerSeasonLength !== 0}
				<wa-skeleton effect={pulsing ? 'pulse' : ''} class="badge-skeleton wide"></wa-skeleton>
			{/if}
			{#if rank}
				<wa-skeleton effect={pulsing ? 'pulse' : ''} class="badge-skeleton rank"></wa-skeleton>
			{/if}
			{#if progressContext !== ''}
				<wa-skeleton effect={pulsing ? 'pulse' : ''} class="badge-skeleton wide"></wa-skeleton>
			{/if}
		</div>
	</div>

	{#if abbr === 'OPS+' || abbr === 'ERA+'}
		<div class="context-track">
			<div class="league-avg-tick"></div>
			<div class="context-fill"></div>
		</div>
	{:else if abbr === 'WAR'}
		<div class="segmented-track">
			{#each Array(4) as _, i}
				<div class="track-segment"></div>
			{/each}
		</div>
	{/if}
</div>

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
		padding: 1rem 3rem 1.25rem 1rem;
		border-radius: var(--wa-border-radius-s);
		border: 1px solid var(--wa-color-border-quiet, var(--wa-color-brand-border-loud));
		overflow: hidden;
	}

	.name-badge-wrapper {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.label-skeleton {
		width: 8rem;
		height: var(--wa-font-size-s, 0.875rem);
		--wa-skeleton-radius: var(--wa-border-radius-s, 4px);
	}

	.value-skeleton {
		width: 5rem;
		height: var(--wa-font-size-xl, 1.25rem);
		--wa-skeleton-radius: var(--wa-border-radius-s, 4px);
	}

	.badges-wrapper {
		display: flex;
		gap: 0.5rem;
	}

	.badge-skeleton {
		width: 42px;
		height: 26px;
		--wa-skeleton-radius: var(--wa-border-radius-s, 4px);
	}

	.badge-skeleton.wide {
		width: 72px;
	}

	.badge-skeleton.rank {
		width: 48px;
	}

	.context-track {
		position: absolute;
		bottom: 0;
		left: 0;
		width: 100%;
		height: 4px;
		background-color: var(--wa-color-border-quiet);
	}

	.context-fill {
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
		height: 12px;
		border-top-right-radius: 1rem;
		border-top-left-radius: 1rem;
		background-color: var(--wa-color-border-loud);
		z-index: 3;
	}

	.segmented-track {
		position: absolute;
		bottom: 0;
		left: 0;
		width: 100%;
		height: 4px;
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 4px;
		background-color: transparent;
	}

	.track-segment {
		height: 100%;
		background-color: var(--wa-color-neutral-300, #cccccc);
		opacity: 0.6;
	}
</style>
