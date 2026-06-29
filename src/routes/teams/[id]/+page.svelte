<script>
	import { fetchPybaseball } from '$lib/pybaseball.js';
	import { getTeamLogo } from '../../../api/getTeamLogo';
	import { getTeamInfo } from '../../../api/getTeamInfo';
	import { page } from '$app/stores';

	import WaTabGroup from '@awesome.me/webawesome/dist/components/tab-group/tab-group.js';
	import WaTabPanel from '@awesome.me/webawesome/dist/components/tab-panel/tab-panel.js';
	import WaDivider from '@awesome.me/webawesome/dist/components/divider/divider.js';
	import WaSkeleton from '@awesome.me/webawesome/dist/components/skeleton/skeleton.js';
	import WaBadge from '@awesome.me/webawesome/dist/components/badge/badge.js';

	let teamData = $state(null);
	let teamLogo = $state(null);
	let loading = $state(true);
	let loadingLogo = $state(true);
	let errorMsg = $state('');
	let errorMsgLogo = $state('');

	$effect(() => {
		const id = $page.params.id;
		if (!id) return;

		async function loadData() {
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

		loadData();
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

	let teamProfile = $derived(teamData?.teams?.[0] || null);
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
		<div class="img-status-wrapper">
			<img
				src={getTeamLogo($page.params.id)}
				alt="teamLogo"
				class="player-thumb"
				loading="lazy"
				onerror={(e) =>
					(e.target.src =
						'https://img.mlbstatic.com/mlb-photos/image/upload/w_50,d_people:generic:headshot:67:current.png/v1/people/generic/headshot/67/current')}
			/>
			{#if teamProfile.active == true}
				<wa-badge pill variant="success">active</wa-badge>
			{:else}
				<wa-badge pill variant="disabled">inactive</wa-badge>
			{/if}
		</div>
		<div class="player-text-box">
			<div class="wa-heading-xl">{teamProfile.name}</div>
			<div class="small-details-wrapper">
				<p>est. {teamProfile.firstYearOfPlay}</p>
				<wa-divider orientation="vertical"></wa-divider>
				<p>{teamProfile.league?.name}</p>
			</div>
		</div>
	</div>

	<wa-divider></wa-divider>

	<wa-tab-group placement="start">
		<wa-tab panel="general">Overview</wa-tab>
		<wa-tab panel="custom">Batting</wa-tab>
		<wa-tab panel="advanced">Pitching</wa-tab>
		<wa-tab panel="advanced">Schedule</wa-tab>
		<wa-tab panel="advanced">Top prospects</wa-tab>
		<wa-tab panel="disabled" disabled>Disabled</wa-tab>

		<wa-tab-panel name="general">Info</wa-tab-panel>
		<wa-tab-panel name="custom">This is the custom tab panel.</wa-tab-panel>
		<wa-tab-panel name="advanced">This is the advanced tab panel.</wa-tab-panel>
		<wa-tab-panel name="disabled">This is a disabled tab panel.</wa-tab-panel>
	</wa-tab-group>
{/if}

<style>
	.player-info-box {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		justify-content: center;
	}

	.img-status-wrapper {
		position: relative;
		width: min-content;
		height: min-content;
	}

	wa-badge {
		position: absolute;
		right: -0.9rem;
		top: -0.7rem;
		box-shadow: var(--wa-shadow-s);
	}

	img {
		max-width: 150px;
		width: 150px;
		height: 150px;
		max-height: 150px;
		background-color: var(--wa-color-gray-80);
		padding: 2rem;
		box-shadow: var(--wa-shadow-l);
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
</style>
