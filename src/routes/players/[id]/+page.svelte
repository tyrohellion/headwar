<script>
	import { fetchPybaseball } from '$lib/pybaseball.js';
	import { getPlayerPictureLarge } from '../../../api/getPlayerPicture';
	import { getPlayerInfo } from '../../../api/getPlayerInfo';
	import { page } from '$app/stores';

	import WaTabGroup from '@awesome.me/webawesome/dist/components/tab-group/tab-group.js';
	import WaTabPanel from '@awesome.me/webawesome/dist/components/tab-panel/tab-panel.js';
	import WaDivider from '@awesome.me/webawesome/dist/components/divider/divider.js';
	import WaSkeleton from '@awesome.me/webawesome/dist/components/skeleton/skeleton.js';
	import WaBadge from '@awesome.me/webawesome/dist/components/badge/badge.js';
	import WaFormatDate from '@awesome.me/webawesome/dist/components/format-date/format-date.js';
	import WaIcon from '@awesome.me/webawesome/dist/components/icon/icon.js';
	import WaTooltip from '@awesome.me/webawesome/dist/components/tooltip/tooltip.js';

	let playerData = $state(null);
	let loading = $state(true);
	let errorMsg = $state('');

	$effect(() => {
		const id = $page.params.id;
		if (!id) return;

		async function loadData() {
			loading = true;
			errorMsg = '';
			try {
				const data = await getPlayerInfo(id);
				playerData = data;
			} catch (err) {
				console.error('Failed to load player data', err);
				errorMsg = err.message;
			} finally {
				loading = false;
			}
		}

		loadData();
	});

	let playerProfile = $derived(playerData?.people?.[0] || null);
</script>

{#if loading}
	<div class="skeleton-overview">
		<header>
			<wa-skeleton effect="sheen"></wa-skeleton>
			<wa-skeleton effect="sheen"></wa-skeleton>
		</header>

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
	<div class="wa-heading-m">We couldn't find that player :(</div>
{:else if playerProfile}
	<div class="player-info-box">
		<img
			src={getPlayerPictureLarge($page.params.id)}
			alt="playerHeadshot"
			class="player-thumb"
			loading="lazy"
			onerror={(e) =>
				(e.target.src =
					'https://img.mlbstatic.com/mlb-photos/image/upload/w_50,d_people:generic:headshot:67:current.png/v1/people/generic/headshot/67/current')}
		/>
		<div class="player-text-box">
			<div class="wa-heading-xl">{playerProfile.fullName}</div>
			<div class="small-details-wrapper">
				<p>
					{playerProfile.deathDate ? 'Died at ' : ''}{playerProfile.currentAge} years old
				</p>
				<wa-divider orientation="vertical"></wa-divider>
				{#if playerProfile.mlbDebutDate}
					<wa-tooltip for="debut-wrapper">Years active since MLB debut</wa-tooltip>
					<div id="debut-wrapper">
						<wa-badge appearance="outlined" variant="neutral">
							<wa-format-date
								month="long"
								day="numeric"
								year="numeric"
								date={playerProfile.mlbDebutDate}
							></wa-format-date>
						</wa-badge>

						<wa-icon name="arrow-right" label="arrow right" style="font-size: 12px;"></wa-icon>

						{#if playerProfile.lastPlayedDate}
							<wa-badge appearance="filled" size="l" variant="neutral">
								<wa-format-date
									month="long"
									day="numeric"
									year="numeric"
									date={playerProfile.lastPlayedDate}
								></wa-format-date>
							</wa-badge>
						{:else}
							<wa-badge appearance="filled" variant="brand">present</wa-badge>
						{/if}
					</div>
				{:else}
					<wa-badge appearance="outlined" variant="neutral">No Major League Debut</wa-badge>
				{/if}
				<wa-divider orientation="vertical"></wa-divider>
				<p>{playerProfile.primaryPosition?.name}</p>
				<wa-divider orientation="vertical"></wa-divider>
				<p>{playerProfile.weight} lbs</p>
				<wa-divider orientation="vertical"></wa-divider>
				<p>{playerProfile.height}</p>
			</div>
		</div>
	</div>

	<wa-divider></wa-divider>

	<wa-tab-group placement="start">
		<wa-tab panel="general">Overview</wa-tab>
		<wa-tab panel="custom">Batting</wa-tab>
		<wa-tab panel="advanced">Pitching</wa-tab>
		<wa-tab panel="advanced">Schedule</wa-tab>
		<wa-tab panel="advanced">Accolades</wa-tab>
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

	#statusBadge {
		position: absolute;
		right: -0.9rem;
		top: -0.7rem;
		box-shadow: var(--wa-shadow-s);
	}

	wa-badge {
		height: min-content;
	}

	img {
		max-width: 150px;
		height: auto;
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
