<script>
	import { fetchPybaseball } from '$lib/pybaseball.js';
	import { getPlayerPictureLarge } from '../../../api/getPlayerPicture';
	import { getPlayerInfo } from '../../../api/getPlayerInfo';
	import { getTeamLogo } from '../../../api/getTeamLogo';
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

	let bbrefId = $state('');

	let imgLoading = $state(true);

	$effect(() => {
		if ($page.params.id) {
			imgLoading = true;
		}
	});

	$effect(() => {
		const id = $page.params.id;
		console.log(`[Profile Effect] URL changed. Target MLBAM ID: ${id}`);

		if (!id) return;

		async function loadProfile() {
			loading = true;
			errorMsg = '';
			try {
				const info = await getPlayerInfo(id);
				playerData = info;

				const lookupRes = await fetchPybaseball('playerid_reverse_lookup', {
					player_ids: [id],
					key_type: 'mlbam'
				});
				bbrefId = lookupRes?.[0]?.key_bbref || '';
				console.log(`[Identity Cross-Ref] Resolved BBRef code: ${bbrefId}`);
			} catch (err) {
				console.error('[Profile Effect] Failure in data pipeline:', err);
				errorMsg = err.message;
			} finally {
				loading = false;
			}
		}

		loadProfile();
	});

	let playerProfile = $derived(playerData?.people?.[0] || null);
	let teamLogoUrl = $derived.by(() => {
		const teamId = playerProfile?.currentTeam?.id;
		return teamId ? getTeamLogo(teamId) : '';
	});
</script>

{#if loading}
	<div class="skeleton-overview">
		<div class="img-loading"></div>
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
		<div class="image-container">
			{#if imgLoading}
				<div class="img-loading"></div>
			{/if}

			<img
				src={getPlayerPictureLarge($page.params.id)}
				alt="playerHeadshot"
				class="player-thumb"
				loading="lazy"
				onload={() => (imgLoading = false)}
				onerror={(e) => {
					imgLoading = false;
					e.target.src =
						'https://img.mlbstatic.com/mlb-photos/image/upload/w_50,d_people:generic:headshot:67:current.png/v1/people/generic/headshot/67/current';
				}}
			/>
		</div>
		<div class="player-text-box">
			<div class="player-name-and-team-wrapper">
				<div class="wa-heading-xl">{playerProfile.fullName}</div>
				{#if !playerProfile.deathDate && !playerProfile.lastPlayedDate}
					<wa-divider orientation="vertical"></wa-divider>
					<wa-tooltip for="teamLogoNameButton"
						>{playerProfile.currentTeam?.name} team page</wa-tooltip
					>
					<a
						href="/teams/{playerProfile.currentTeam?.id}"
						class="team-logo-name-wrapper"
						id="teamLogoNameButton"
					>
						{#if teamLogoUrl}
							<img src={teamLogoUrl} alt="Team Logo" class="team-logo" loading="lazy" />
						{/if}
						<p>{playerProfile.currentTeam?.name}</p>
					</a>
				{/if}
			</div>
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
							<wa-badge appearance="filled" variant="brand">Present</wa-badge>
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
		<wa-tab panel="stats">Stats</wa-tab>
		<wa-tab panel="advanced">Pitching</wa-tab>
		<wa-tab panel="schedule">Schedule</wa-tab>
		<wa-tab panel="accolades">Accolades</wa-tab>

		<wa-tab-panel name="general">
			<h3>Player Profile Info</h3>
			<p>Bats: {playerProfile.batSide?.description || 'N/A'}</p>
			<p>Throws: {playerProfile.pitchHand?.description || 'N/A'}</p>
		</wa-tab-panel>

		<wa-tab-panel name="stats">
			<h3>Statistics</h3>
			<p>Statistical metrics infrastructure pending migration...</p>
		</wa-tab-panel>

		<wa-tab-panel name="advanced">This is the advanced tab panel.</wa-tab-panel>
		<wa-tab-panel name="schedule">Schedule panels content.</wa-tab-panel>
		<wa-tab-panel name="accolades">Accolades panel content.</wa-tab-panel>
	</wa-tab-group>
{/if}

<style>
	.player-info-box {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		justify-content: center;
	}

	.player-name-and-team-wrapper {
		display: flex;
		align-items: center;
	}

	wa-badge {
		height: min-content;
	}

	img {
		max-width: 150px;
		height: auto;
		max-height: 225px;
		border-radius: var(--wa-border-radius-m);
		box-shadow: var(--wa-shadow-l);
	}

	a {
		text-decoration: none;
		color: inherit;
	}

	.image-container {
		position: relative;
		width: 150px;
		height: 225px;
		flex-shrink: 0;
		box-shadow: var(--wa-shadow-l);
	}

	.img-loading {
		width: 150px;
		height: 225px;
		border-radius: var(--wa-border-radius-m);
		background-color: var(--wa-color-gray-80);
		z-index: 2;
		margin-bottom: 2rem;
	}

	.team-logo {
		max-width: 32px;
		width: 32px;
		height: auto;
		max-height: 32px;
		background-color: var(--wa-color-gray-70);
		padding: 6px;
		box-shadow: var(--wa-shadow-l);
		transition: all 100ms ease;
	}

	.team-logo-name-wrapper {
		display: flex;
		justify-content: center;
		width: min-content;
		align-items: center;
		gap: 0.5rem;
		white-space: nowrap;
		padding: 0.5rem 1rem 0.5rem 1rem;
		border-radius: var(--wa-border-radius-m);
		transition: all 100ms ease;
	}

	.team-logo-name-wrapper p {
		white-space: nowrap;
	}

	.team-logo-name-wrapper:hover {
		cursor: pointer;
		background-color: var(--wa-color-neutral-fill-normal);
		transform: scale(1.03);
		transition: all 100ms ease;
		text-decoration: underline;
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
		border-radius: var(--wa-border-radius-m);
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
