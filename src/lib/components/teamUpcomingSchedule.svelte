<script>
	import { getTeamLogo } from '../../api/getTeamLogo';
	import GameCard from './gameCard.svelte';

	let { upcomingSchedule = [], currentTeamId = null } = $props();

	let logosMap = $state({});
	let sliderEl = $state(null);
	let scrollX = $state(0);
	let maxScroll = $state(0);
	let now = $state(new Date());

	$effect(() => {
		const interval = setInterval(() => {
			now = new Date();
		}, 60000);
		return () => clearInterval(interval);
	});

	$effect(() => {
		if (!upcomingSchedule || upcomingSchedule.length === 0) return;

		async function loadScheduleLogos() {
			try {
				const uniqueTeamIds = new Set();
				upcomingSchedule.forEach((game) => {
					if (game.teams?.away?.team?.id) uniqueTeamIds.add(game.teams.away.team.id);
					if (game.teams?.home?.team?.id) uniqueTeamIds.add(game.teams.home.team.id);
				});

				const logoPromises = Array.from(uniqueTeamIds).map(async (id) => {
					try {
						const logoUrl = await getTeamLogo(id);
						return { id, logoUrl };
					} catch (err) {
						return { id, logoUrl: `https://midas.mlbstatic.com/v1/team/${id}/assets/1/120.svg` };
					}
				});

				const resolvedLogos = await Promise.all(logoPromises);
				const newLogos = {};
				resolvedLogos.forEach((item) => {
					if (item) newLogos[item.id] = item.logoUrl;
				});
				logosMap = newLogos;
			} catch (error) {
				console.error('Error batch resolving schedule logos:', error);
			}
		}
		loadScheduleLogos();
	});

	function updateScrollState() {
		if (!sliderEl) return;
		scrollX = sliderEl.scrollLeft;
		maxScroll = sliderEl.scrollWidth - sliderEl.clientWidth;
	}

	$effect(() => {
		if (sliderEl && upcomingSchedule.length > 0) {
			updateScrollState();
			const resizeObserver = new ResizeObserver(updateScrollState);
			resizeObserver.observe(sliderEl);
			return () => resizeObserver.disconnect();
		}
	});

	function scroll(direction) {
		if (!sliderEl) return;
		const cardWidth = sliderEl.clientWidth + 16;
		sliderEl.scrollBy({ left: direction * cardWidth, behavior: 'smooth' });
	}
</script>

<div class="schedule-container">
	<div class="carousel-layout-grid">
		<button
			type="button"
			class="control-btn"
			disabled={scrollX <= 5}
			onclick={() => scroll(-1)}
			aria-label="Previous game"
		>
			&larr;
		</button>

		<div class="carousel-viewport">
			<div bind:this={sliderEl} onscroll={updateScrollState} class="schedule-molecule">
				{#each upcomingSchedule as game}
					<div class="card-snap-wrapper">
						<GameCard {game} {logosMap} {now} {currentTeamId} />
					</div>
				{/each}
			</div>
		</div>

		<button
			type="button"
			class="control-btn"
			disabled={scrollX >= maxScroll - 5}
			onclick={() => scroll(1)}
			aria-label="Next game"
		>
			&rarr;
		</button>
	</div>
</div>

<style>
	.schedule-container {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		width: 100%;
		height: 100%;
	}

	.carousel-layout-grid {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 0.75rem;
		width: 100%;
		flex-grow: 1;
	}

	.carousel-viewport {
		flex-grow: 1;
		min-width: 0;
		height: 100%;
		display: flex;
		overflow: hidden;
	}

	.control-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		border-radius: var(--wa-border-radius-circle, 50%);
		border: 1px solid var(--wa-color-border-quiet);
		background-color: var(--wa-color-fill-normal);
		color: var(--wa-color-filled-on-normal);
		cursor: pointer;
		font-size: var(--wa-font-size-m);
		transition: all 100ms ease;
		flex-shrink: 0;
	}

	.control-btn:hover:not(:disabled) {
		background-color: var(--wa-color-fill-brand);
		transform: scale(1.03);
	}

	.control-btn:active:not(:disabled) {
		transform: scale(0.9);
	}

	.control-btn:disabled {
		opacity: 0.25;
		cursor: not-allowed;
	}

	.schedule-molecule {
		display: grid;
		grid-auto-flow: column;
		grid-auto-columns: 100%;
		gap: 1rem;
		overflow-x: auto;
		scroll-snap-type: x mandatory;
		scrollbar-width: none;
		width: 100%;
		height: 100%;
	}

	.schedule-molecule::-webkit-scrollbar {
		display: none;
	}

	.card-snap-wrapper {
		scroll-snap-align: start;
		width: 100%;
		height: 100%;
	}
</style>
