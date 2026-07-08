<script>
	import { fetchPybaseball } from '$lib/pybaseball.js';
	import { getTeamLogo } from '../../../api/getTeamLogo';
	import { getTeamInfo } from '../../../api/getTeamInfo';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';

	import StatBoxTeamInfo from '$lib/components/statBoxTeamInfo.svelte';
	import StatBoxTeamDivisionStandings from '$lib/components/statBoxTeamDivisionStandings.svelte';
	import RosterShowcase from '$lib/components/rosterShowcase.svelte';

	import WaTabGroup from '@awesome.me/webawesome/dist/components/tab-group/tab-group.js';
	import WaTabPanel from '@awesome.me/webawesome/dist/components/tab-panel/tab-panel.js';
	import WaDivider from '@awesome.me/webawesome/dist/components/divider/divider.js';
	import WaSkeleton from '@awesome.me/webawesome/dist/components/skeleton/skeleton.js';
	import WaBadge from '@awesome.me/webawesome/dist/components/badge/badge.js';
	import WaTooltip from '@awesome.me/webawesome/dist/components/tooltip/tooltip.js';

	let teamData = $state(null);
	let teamLogo = $state(null);
	let loading = $state(true);
	let loadingLogo = $state(true);
	let errorMsg = $state('');
	let errorMsgLogo = $state('');

	let isDesktop = $state(true);

	onMount(() => {
		const mql = window.matchMedia('(min-width: 769px)');
		isDesktop = mql.matches;

		const listener = (e) => (isDesktop = e.matches);
		mql.addEventListener('change', listener);

		return () => mql.removeEventListener('change', listener);
	});

	$effect(() => {
		const id = $page.params.id;
		if (!id) return;

		async function teamOverview() {
			loading = true;
			errorMsg = '';
			try {
				const data = await getTeamInfo(id);

				teamData = data;
			} catch (err) {
				console.error('Failed to load team data', err);
				errorMsg = err.message;
			} finally {
				loading = false;
			}
		}

		teamOverview();
	});

	$effect(() => {
		const id = $page.params.id;
		if (!id) return;

		async function loadLogo() {
			loadingLogo = true;
			errorMsgLogo = '';
			try {
				const data = await getTeamLogo(id);

				teamLogo = data;
			} catch (err) {
				console.error('Failed to load team logo', err);
				errorMsg = err.message;
			} finally {
				loading = false;
			}
		}

		loadLogo();
	});

	let teamProfile = $derived(teamData || null);
</script>

{#if loading}
	<div class="skeleton-overview">
		<wa-skeleton
			effect="sheen"
			style="width: 150px; height: 150px; border-radius: var(--wa-border-radius-m); z-index: 2;"
		></wa-skeleton>
		<wa-skeleton effect="sheen"></wa-skeleton>
		<wa-skeleton effect="sheen"></wa-skeleton>
		<wa-skeleton effect="sheen"></wa-skeleton>
	</div>

	<wa-divider></wa-divider>
	<div class="skeleton-paragraphs">
		<wa-skeleton></wa-skeleton>
		<wa-skeleton></wa-skeleton>
		<wa-skeleton></wa-skeleton>
		<wa-skeleton></wa-skeleton>
		<wa-skeleton></wa-skeleton>
	</div>
{:else if errorMsg}
	<div class="wa-heading-m">We couldn't find that team :(</div>
{:else if teamProfile}
	<div class="player-info-box">
		<img
			src={getTeamLogo($page.params.id)}
			alt="teamLogo"
			class="player-thumb"
			loading="lazy"
			onerror={(e) =>
				(e.target.src =
					'https://img.mlbstatic.com/mlb-photos/image/upload/w_50,d_people:generic:headshot:67:current.png/v1/people/generic/headshot/67/current')}
		/>

		<div class="player-text-box">
			<div class="wa-heading-xl">{teamProfile.name}</div>
			<div class="small-details-wrapper">
				<wa-badge appearance="filled" variant="brand">{teamProfile.league?.name}</wa-badge>
			</div>
		</div>
	</div>

	<wa-divider></wa-divider>

	{#key isDesktop}
		<wa-tab-group placement={isDesktop ? 'start' : 'top'}>
			<wa-tab panel="overview">Overview</wa-tab>
			<wa-tab panel="batting">Batting</wa-tab>
			<wa-tab panel="pitching">Pitching</wa-tab>
			<wa-tab panel="prospects">Prospects</wa-tab>

			<wa-tab-panel name="overview">
				<div class="advanced-tab-panel">
					<div class="horizontal-wrapper">
						<h3>Overview</h3>
					</div>
					<div class="overview-boxes-wrapper">
						<StatBoxTeamInfo
							teamLogo={getTeamLogo($page.params.id)}
							teamName={teamData.name}
							teamId={teamData.id}
							record={teamData.record}
							division={teamData.division.name}
							divisionStandings={teamData.divisionStandings}
						/>

						{#if teamData.divisionStandings?.length > 0}
							<StatBoxTeamDivisionStandings
								divisionName={teamData.division.name}
								divisionStandings={teamData.divisionStandings}
								currentTeamId={teamData.id}
							/>
						{/if}

						{#if teamData.roster?.length > 0}
							<RosterShowcase roster={teamData.roster} />
						{/if}
					</div>
				</div>
			</wa-tab-panel>
			<wa-tab-panel name="batting">This is the batting tab panel.</wa-tab-panel>
			<wa-tab-panel name="pitching">This is the pitching tab panel.</wa-tab-panel>
			<wa-tab-panel name="prospects">This is the prospects tab panel.</wa-tab-panel>
		</wa-tab-group>
	{/key}
{/if}

<style>
	.player-info-box {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		justify-content: center;
	}

	.player-thumb {
		max-width: 150px;
		width: 150px;
		height: 150px;
		max-height: 150px;
		background-color: var(--wa-color-gray-80);
		padding: 2rem;
		box-shadow: var(--wa-shadow-l);
	}

	.horizontal-wrapper {
		display: flex;
		align-items: center;
		margin: 1rem 0 1rem 0;
		height: 40px;
	}

	.overview-boxes-wrapper {
		display: flex;
		justify-content: flex-start;
		flex-wrap: wrap;
		gap: 2rem;
	}

	h3 {
		margin: 0;
		white-space: nowrap;
	}

	.player-text-box {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.small-details-wrapper {
		display: flex;
		gap: 0;
	}

	.skeleton-overview header {
		display: flex;
		align-items: center;
		margin-bottom: 1rem;
	}

	.skeleton-overview header wa-skeleton:last-child {
		flex: 0 0 auto;
		width: 30%;
	}

	.skeleton-overview wa-skeleton {
		margin-bottom: 1rem;
	}

	.skeleton-overview wa-skeleton:nth-child(1) {
		float: left;
		width: 3rem;
		height: 3rem;
		margin-right: 1rem;
		vertical-align: middle;
	}

	.skeleton-overview wa-skeleton:nth-child(3) {
		width: 45%;
	}

	.skeleton-overview wa-skeleton:nth-child(4) {
		width: 35%;
	}

	.skeleton-paragraphs wa-skeleton {
		margin-top: 4rem;
		margin-bottom: 1rem;
	}

	.skeleton-paragraphs wa-skeleton:nth-child(2) {
		width: 95%;
	}

	.skeleton-paragraphs wa-skeleton:nth-child(4) {
		width: 90%;
	}

	.skeleton-paragraphs wa-skeleton:last-child {
		width: 50%;
	}
	@media (max-width: 1250px) {
		.details-filters-wrapper {
			flex-direction: column;
			align-items: start;
			overflow-x: scroll;
			padding: 0 1rem 1.5rem 3px;
			height: auto;
			mask-image: linear-gradient(to right, black calc(100% - 32px), transparent 100%);
			-webkit-mask-image: linear-gradient(to right, black calc(100% - 24px), transparent 100%);
			gap: 1.5rem;
		}
	}

	@media (min-width: 1024px) {
		.stats-grid-container {
			grid-template-columns: 1fr auto 1fr auto 1fr;
			gap: 1.5rem;
		}

		.grid-desktop-divider {
			display: block;
		}
	}

	@media (max-width: 768px) {
		.player-info-box {
			align-items: center;
		}

		#verticalDividers {
			display: none;
		}

		.horizontal-wrapper {
			flex-direction: column;
			height: auto;
			gap: 1rem;
			align-items: start;
		}

		.dropdown-and-switch-wrapper {
			flex-direction: column;
			align-items: start;
		}

		.honor-badges-wrapper {
			justify-content: flex-end;
		}
	}
</style>
