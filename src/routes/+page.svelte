<script>
	import { onMount } from 'svelte';
	import { getMlbSchedule } from '../api/getMlbSchedule';
	import { getTeamLogo } from '../api/getTeamLogo';
	import GameCard from '$lib/components/gameCard.svelte';
	import { getMlbStandings } from '../api/getMlbDivisionStandings';
	import DivisionStandingsGrid from '$lib/components/divisionStandingsGrid.svelte';

	import { getHomePageSpotlight } from '../api/getHomePageSpotlight';

	import WaSpinner from '@awesome.me/webawesome/dist/components/spinner/spinner.js';
	import WaButton from '@awesome.me/webawesome/dist/components/button/button.js';

	let homepageSchedule = $state([]);
	let divisionRecords = $state([]);
	let playerSpotlights = $state({ ops: [], era: [], topTeams: [] }); // Adjusted mapping layout properties
	let logosMap = $state({});
	let isLoading = $state(true);
	let errorMessage = $state('');
	let now = $state(new Date());

	let isExpanded = $state(false);
	let isDivisionExpanded = $state(false);

	$effect(() => {
		const interval = setInterval(() => {
			now = new Date();
		}, 60000);

		return () => clearInterval(interval);
	});

	onMount(async () => {
		try {
			isLoading = true;

			const [scheduleData, standingsData, leadersData] = await Promise.all([
				getMlbSchedule(),
				getMlbStandings(),
				getHomePageSpotlight()
			]);

			homepageSchedule = scheduleData;
			divisionRecords = standingsData;
			playerSpotlights = leadersData;

			if (homepageSchedule.length > 0 || playerSpotlights.ops.length > 0) {
				const uniqueTeamIds = new Set();

				homepageSchedule.forEach((game) => {
					if (game.teams?.away?.team?.id) uniqueTeamIds.add(game.teams.away.team.id);
					if (game.teams?.home?.team?.id) uniqueTeamIds.add(game.teams.home.team.id);
				});

				['ops', 'era'].forEach((cat) => {
					playerSpotlights[cat].forEach((p) => uniqueTeamIds.add(p.teamId));
				});

				playerSpotlights.topTeams.forEach((t) => uniqueTeamIds.add(t.teamId));

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
				<h3>League Leaders</h3>
				<div class="spotlight-three-column-grid">
					<div class="spotlight-leaderboard-card">
						<div class="column-header-title">OPS Leaders</div>
						<wa-divider></wa-divider>
						<div class="leaderboard-rows-stack">
							{#each playerSpotlights.ops as player, i}
								<a class="leader-row" href="/players/{player?.id}">
									<div class="rank-name-group">
										<span class="row-rank-num">{i + 1}</span>
										<img src={logosMap[player.teamId]} alt="" class="row-team-logo" />
										<span class="player-profile-name">{player.name}</span>
									</div>
									<span class="metric-score-value">{player.value}</span>
								</a>
							{/each}
						</div>
					</div>

					<div class="spotlight-leaderboard-card">
						<div class="column-header-title">ERA Leaders</div>
						<wa-divider></wa-divider>
						<div class="leaderboard-rows-stack">
							{#each playerSpotlights.era as player, i}
								<a class="leader-row" href="/players/{player?.id}">
									<div class="rank-name-group">
										<span class="row-rank-num">{i + 1}</span>
										<img src={logosMap[player.teamId]} alt="" class="row-team-logo" />
										<span class="player-profile-name">{player.name}</span>
									</div>
									<span class="metric-score-value">{player.value}</span>
								</a>
							{/each}
						</div>
					</div>

					<div class="spotlight-leaderboard-card">
						<div class="column-header-title">MLB Top 10 Teams</div>
						<wa-divider></wa-divider>
						<div class="leaderboard-rows-stack">
							{#each playerSpotlights.topTeams as team, i}
								<a class="leader-row" href="/teams/{team?.teamId}">
									<div class="rank-name-group">
										<span class="row-rank-num">{i + 1}</span>
										<img src={logosMap[team.teamId]} alt="" class="row-team-logo" />
										<span class="player-profile-name">{team.name}</span>
									</div>
									<span class="metric-score-value subtitle-record">
										{team.wins}-{team.losses}
									</span>
								</a>
							{/each}
						</div>
					</div>
				</div>
			</section>

			<section class="page-section">
				<h3>Division Standings</h3>
				{#if divisionRecords.length === 0}
					<div class="empty-inline-state">
						<p>Standings data temporarily unavailable.</p>
					</div>
				{:else}
					<div class="collapsible-standings-wrapper" class:is-collapsed={!isDivisionExpanded}>
						<div class="standings-dashboard-grid">
							{#each divisionRecords as division}
								<DivisionStandingsGrid
									divisionName={division.displayName}
									divisionStandings={division.teamRecords || []}
								/>
							{/each}
						</div>

						{#if !isDivisionExpanded}
							<div class="fade-overlay"></div>
						{/if}
					</div>

					<div class="expansion-controls-row">
						<wa-button
							variant="neutral"
							size="s"
							onclick={() => (isDivisionExpanded = !isDivisionExpanded)}
						>
							{isDivisionExpanded ? 'Show less' : 'Show all'}
						</wa-button>
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
		gap: 2rem;
	}

	.page-section h3 {
		font-size: 1.5rem;
		margin: 0 0 1.25rem 0;
		color: var(--wa-color-filled-on-normal);
	}

	.spotlight-three-column-grid {
		display: flex;
		gap: 1.5rem;
		width: 100%;
	}

	.spotlight-leaderboard-card {
		flex: 1;
		background-color: transparent;
		border: 1px solid var(--wa-color-border-quiet);
		border-radius: var(--wa-border-radius-m);
		padding: 1.25rem;
		box-sizing: border-box;
	}

	.column-header-title {
		font-size: 1.1rem;
		font-weight: var(--wa-font-weight-semibold, 600);
		color: var(--wa-color-filled-on-normal);
	}

	.leaderboard-rows-stack {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.leader-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.4rem 0.5rem;
		border-radius: var(--wa-border-radius-s);
		text-decoration: none;
		color: var(--wa-color-filled-on-normal);
		transition: all 100ms ease;
	}

	.leader-row:hover {
		transform: scale(1.015);
		background-color: var(--wa-color-fill-normal);
		cursor: pointer;
		transition: all 100ms ease;

		.player-profile-name {
			text-decoration: underline;
		}
	}

	.leader-row:active {
		transform: scale(0.98);
		transition: all 100ms ease;
	}

	.leader-row:nth-child(even) {
		background-color: color-mix(in srgb, var(--wa-color-fill-normal) 30%, transparent);
	}

	.rank-name-group {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		min-width: 0;
	}

	.row-rank-num {
		font-size: var(--wa-font-size-xs);
		font-family: var(--font-mono, monospace);
		color: var(--wa-color-neutral-on-quiet);
		width: 16px;
		text-align: right;
	}

	.row-team-logo {
		width: 24px;
		height: 24px;
		object-fit: contain;
	}

	.player-profile-name {
		font-size: var(--wa-font-size-m);
		color: var(--wa-color-filled-on-normal);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.metric-score-value {
		font-family: var(--font-mono, monospace);
		font-weight: var(--wa-font-weight-bold, 700);
		color: var(--wa-color-filled-on-normal);
		font-size: var(--wa-font-size-m);
		padding-left: 0.5rem;
	}

	.metric-score-value.subtitle-record {
		font-size: var(--wa-font-size-xs);
		color: var(--wa-color-neutral-on-quiet);
		font-weight: var(--wa-font-weight-normal, 400);
	}

	.collapsible-schedule-wrapper,
	.collapsible-standings-wrapper {
		position: relative;
		width: 100%;
		overflow: hidden;
		transition: max-height 350ms cubic-bezier(0.4, 0, 0.2, 1);
		max-height: 8000px;
	}

	.collapsible-schedule-wrapper.is-collapsed {
		max-height: 400px;
	}

	.collapsible-standings-wrapper.is-collapsed {
		max-height: 370px;
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
		z-index: 2;
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
		gap: 1.5rem;
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
		.spotlight-three-column-grid {
			flex-direction: column;
			gap: 1rem;
		}

		.homepage-card-item {
			max-width: 100%;
		}

		.collapsible-schedule-wrapper.is-collapsed {
			max-height: 440px;
		}

		.collapsible-standings-wrapper.is-collapsed {
			max-height: 470px;
		}
	}
</style>
