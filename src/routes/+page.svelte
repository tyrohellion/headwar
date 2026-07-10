<script>
	import { onMount } from 'svelte';
	import { getMlbSchedule } from '../api/getMlbSchedule';
	import { getTeamLogo } from '../api/getTeamLogo';
	import GameCard from '$lib/components/gameCard.svelte';
	import { getMlbStandings } from '../api/getMlbDivisionStandings';
	import DivisionStandingsGrid from '$lib/components/divisionStandingsGrid.svelte';

	import WaSpinner from '@awesome.me/webawesome/dist/components/spinner/spinner.js';
	import WaButton from '@awesome.me/webawesome/dist/components/button/button.js';

	let homepageSchedule = $state([]);
	let divisionRecords = $state([]);
	let logosMap = $state({});
	let isLoading = $state(true);
	let errorMessage = $state('');
	let now = $state(new Date());

	let isExpanded = $state(false);

	$effect(() => {
		const interval = setInterval(() => {
			now = new Date();
		}, 60000);

		return () => clearInterval(interval);
	});

	onMount(async () => {
		try {
			isLoading = true;

			const [scheduleData, standingsData] = await Promise.all([
				getMlbSchedule(),
				getMlbStandings()
			]);

			homepageSchedule = scheduleData;
			divisionRecords = standingsData;

			if (homepageSchedule.length > 0) {
				const uniqueTeamIds = new Set();
				homepageSchedule.forEach((game) => {
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
			}
		} catch (error) {
			errorMessage = "Failed to load today's MLB metrics. Please check back shortly.";
			console.error(error);
		} finally {
			isLoading = false;
		}
	});
</script>

<main class="homepage-layout">
	{#if isLoading}
		<div class="status-message">
			<wa-spinner style="font-size: 3rem;"></wa-spinner>
		</div>
	{:else}
		{#if errorMessage}
			<div class="status-message error">
				<p>{errorMessage}</p>
			</div>
		{:else}
			<section class="page-section">
				<h3>Games today</h3>
				{#if homepageSchedule.length === 0}
					<div class="empty-inline-state">
						<p>No games scheduled for today.</p>
					</div>
				{:else}
					<div class="collapsible-schedule-wrapper" class:is-collapsed={!isExpanded}>
						<div class="homepage-schedule-flex-grid">
							{#each homepageSchedule as game (game.gamePk)}
								<div class="homepage-card-item">
									<GameCard {game} {logosMap} {now} />
								</div>
							{/each}
						</div>

						{#if !isExpanded}
							<div class="fade-overlay"></div>
						{/if}
					</div>

					<div class="expansion-controls-row">
						<wa-button variant="neutral" size="s" onclick={() => (isExpanded = !isExpanded)}>
							{isExpanded ? 'Show less' : 'Show all'}
						</wa-button>
					</div>
				{/if}
			</section>

			<section class="page-section">
				<h3>Division Standings</h3>
				{#if divisionRecords.length === 0}
					<div class="empty-inline-state">
						<p>Standings data temporarily unavailable.</p>
					</div>
				{:else}
					<div class="standings-dashboard-grid">
						{#each divisionRecords as division}
							<DivisionStandingsGrid
								divisionName={division.displayName}
								divisionStandings={division.teamRecords || []}
							/>
						{/each}
					</div>
				{/if}
			</section>
		{/if}
	{/if}
</main>

<style>
	.homepage-layout {
		margin: 0 auto;
		padding: 2rem 1rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.page-section h3 {
		font-size: 1.5rem;
		margin: 0 0 1.25rem 0;
		color: var(--wa-color-filled-on-normal);
	}

	.collapsible-schedule-wrapper {
		position: relative;
		width: 100%;
		overflow: hidden;
		transition: max-height 350ms cubic-bezier(0.4, 0, 0.2, 1);
		max-height: 2000px;
	}

	.collapsible-schedule-wrapper.is-collapsed {
		max-height: 410px;
	}

	.fade-overlay {
		position: absolute;
		bottom: 0;
		left: 0;
		width: 100%;
		height: 120px;
		background: linear-gradient(
			to bottom,
			transparent 0%,
			var(--wa-color-canvas-background, var(--wa-color-surface-default)) 100%
		);
		pointer-events: none;
	}

	.expansion-controls-row {
		display: flex;
		justify-content: center;
		align-items: center;
		padding-top: 1.25rem;
		width: 100%;
	}

	.homepage-schedule-flex-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 1.25rem;
		width: 100%;
	}

	.homepage-card-item {
		flex: 1 1 calc(33.333% - 1.25rem);
		min-width: 300px;
		max-width: calc(50% - 0.625rem);
	}

	.standings-dashboard-grid {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		width: 100%;
	}

	.status-message {
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: 400px;
		font-size: 1.15rem;
		color: var(--wa-color-neutral-on-quiet);
	}

	.status-message.error {
		color: #d9534f;
	}

	.empty-inline-state {
		padding: 2rem;
		text-align: center;
		border: 1px dashed var(--wa-color-border-quiet);
		border-radius: var(--wa-border-radius-m);
		color: var(--wa-color-neutral-on-quiet);
	}

	@media (max-width: 900px) {
		.homepage-card-item {
			max-width: 100%;
		}

		/* Adjust mobile collapsed view bounds if row height changes when stacked */
		.collapsible-schedule-wrapper.is-collapsed {
			max-height: 460px;
		}
	}
</style>
