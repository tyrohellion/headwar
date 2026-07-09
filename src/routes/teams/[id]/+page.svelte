<script>
	import { fetchPybaseball } from '$lib/pybaseball.js';
	import { getTeamLogo } from '../../../api/getTeamLogo';
	import { getTeamInfo } from '../../../api/getTeamInfo';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';

	import StatBoxTeamInfo from '$lib/components/statBoxTeamInfo.svelte';
	import StatBoxTeamDivisionStandings from '$lib/components/statBoxTeamDivisionStandings.svelte';
	import RosterShowcase from '$lib/components/rosterShowcase.svelte';
	import TeamUpcomingSchedule from '$lib/components/teamUpcomingSchedule.svelte';

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
					<div class="overview-boxes-wrapper">
						<div class="info-and-schedule-wrapper">
							<StatBoxTeamInfo
								teamLogo={getTeamLogo($page.params.id)}
								teamName={teamData.name}
								teamId={teamData.id}
								record={teamData.record}
								division={teamData.division.name}
								divisionStandings={teamData.divisionStandings}
							/>

							{#if teamData?.upcomingSchedule}
								<TeamUpcomingSchedule
									upcomingSchedule={teamData.upcomingSchedule}
									currentTeamId={teamData.id}
								/>
							{/if}
						</div>

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
		flex-direction: row;
		align-items: center;
		gap: 1.5rem;
		width: 100%;
		margin-bottom: 1rem;
	}

	.player-thumb {
		width: 120px;
		height: 120px;
		background-color: var(--wa-color-gray-80);
		padding: 1.5rem;
		box-shadow: var(--wa-shadow-l);
		border-radius: var(--wa-border-radius-m, 8px);
		object-fit: contain;
	}

	.player-text-box {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.small-details-wrapper {
		display: flex;
		gap: 0.5rem;
	}

	.overview-boxes-wrapper {
		display: flex;
		flex-direction: column;
		width: 100%;
		gap: 2rem;
	}

	.info-and-schedule-wrapper {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		width: 100%;
		gap: 1.5rem;
	}

	.skeleton-overview {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	.skeleton-paragraphs {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin-top: 1.5rem;
	}

	@media (max-width: 992px) {
		.info-and-schedule-wrapper {
			grid-template-columns: minmax(0, 1fr);
		}
	}

	@media (max-width: 768px) {
		.player-info-box {
			flex-direction: column;
			text-align: center;
		}
	}
</style>
