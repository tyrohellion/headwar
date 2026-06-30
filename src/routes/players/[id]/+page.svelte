<script>
	import { fetchPybaseball } from '$lib/pybaseball.js';
	import { getPlayerPictureLarge } from '../../../api/getPlayerPicture';
	import { getPlayerInfo } from '../../../api/getPlayerInfo';
	import { getTeamLogo } from '../../../api/getTeamLogo';
	import { getPlayerBattingStatsBref } from '../../../api/getPlayerBattingStats';
	import { getPlayerBattingPercentileStats } from '../../../api/getPlayerBattingPercentile';
	import { page } from '$app/stores';

	import WaTabGroup from '@awesome.me/webawesome/dist/components/tab-group/tab-group.js';
	import WaTabPanel from '@awesome.me/webawesome/dist/components/tab-panel/tab-panel.js';
	import WaDivider from '@awesome.me/webawesome/dist/components/divider/divider.js';
	import WaSkeleton from '@awesome.me/webawesome/dist/components/skeleton/skeleton.js';
	import WaBadge from '@awesome.me/webawesome/dist/components/badge/badge.js';
	import WaFormatDate from '@awesome.me/webawesome/dist/components/format-date/format-date.js';
	import WaIcon from '@awesome.me/webawesome/dist/components/icon/icon.js';
	import WaTooltip from '@awesome.me/webawesome/dist/components/tooltip/tooltip.js';

	import StatBar from '$lib/components/statBar.svelte';

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

	let battingStats = $state(null);
	let isBattingStatsLoading = $state(false);
	let userSelectedYear = $state('2026');

	$effect(() => {
		const id = $page.params.id;
		if (!id) return;

		async function loadBattingStats() {
			isBattingStatsLoading = true;
			try {
				battingStats = await getPlayerBattingStatsBref(id, userSelectedYear);
			} catch (err) {
				battingStats = null;
			} finally {
				isBattingStatsLoading = false;
			}
		}

		loadBattingStats();
	});

	let isBattingPercentileStatsLoading = $state(false);
	let battingPercentileStats = $state(null);

	$effect(() => {
		const id = $page.params.id;
		if (!id) return;

		async function loadPercentiles() {
			isBattingPercentileStatsLoading = true;
			try {
				battingPercentileStats = await getPlayerBattingPercentileStats(id, userSelectedYear);
			} catch (err) {
				battingPercentileStats = null;
			} finally {
				isBattingPercentileStatsLoading = false;
			}
		}

		loadPercentiles();
	});

	const battingStatConfig = [
		// --- 1. Statcast Profile (Power & Batted Ball) ---
		{
			key: 'exit_velocity',
			label: 'Exit Velocity',
			category: 'profile',
			description: 'The average speed (in mph) of all batted balls off the bat.'
		},
		{
			key: 'max_ev',
			label: 'Max Exit Velocity',
			category: 'profile',
			description: 'The absolute maximum speed recorded on any single batted ball.'
		},
		{
			key: 'hard_hit_percent',
			label: 'Hard Hit Percentage',
			category: 'profile',
			description: 'The percentage of batted balls struck at 95 mph or faster.'
		},
		{
			key: 'brl',
			label: 'Barrels',
			category: 'profile',
			description:
				'The raw number of batted balls meeting perfect optimal launch angle and exit velocity.'
		},
		{
			key: 'brl_percent',
			label: 'Barrel Percentage',
			category: 'profile',
			description: 'The percentage of total batted balls that are classified as Barrels.'
		},
		{
			key: 'bat_speed',
			label: 'Bat Speed',
			category: 'profile',
			description: 'The average tracking speed of the sweet spot of the bat at contact.'
		},
		{
			key: 'swing_length',
			label: 'Swing Length',
			category: 'profile',
			description:
				'The average distance the bat travels through the strike zone to complete a swing.'
		},
		{
			key: 'squared_up_rate',
			label: 'Squared Up Rate',
			category: 'profile',
			description:
				'The percentage of possible exit velocity achieved based on the player’s bat speed.'
		},

		// --- 2. Plate Discipline & Contact ---
		{
			key: 'bb_percent',
			label: 'Walk Percentage',
			category: 'discipline',
			description: 'How often the hitter draws a walk as a percentage of overall plate appearances.'
		},
		{
			key: 'k_percent',
			label: 'Strikeout Percentage',
			category: 'discipline',
			description: 'How often the hitter strikes out as a percentage of overall plate appearances.'
		},
		{
			key: 'chase_percent',
			label: 'Chase Percentage',
			category: 'discipline',
			description: 'The frequency with which a batter swings at pitches outside of the strike zone.'
		},
		{
			key: 'whiff_percent',
			label: 'Whiff Percentage',
			category: 'discipline',
			description: 'The rate at which a batter swings and misses completely on a pitch.'
		},

		// --- 3. Expected Metrics ---
		{
			key: 'xba',
			label: 'Expected BA',
			category: 'expected',
			description:
				'Expected Batting Average based purely on quality of contact and launch angle, removing defense.'
		},
		{
			key: 'xobp',
			label: 'Expected OBP',
			category: 'expected',
			description:
				'Expected On-Base Percentage combining quality of contact metrics with actual strike zone discipline.'
		},
		{
			key: 'xslg',
			label: 'Expected SLG',
			category: 'expected',
			description:
				'Expected Slugging Percentage measuring modeled extra-base power based on launch vectors.'
		},
		{
			key: 'xiso',
			label: 'Expected ISO',
			category: 'expected',
			description:
				'Expected Isolated Power (xSLG minus xBA) isolating the hitter’s raw extra-base capability.'
		},
		{
			key: 'xwoba',
			label: 'Expected wOBA',
			category: 'expected',
			description:
				'Expected Weighted On-Base Average, assigning proportional run values to all quality-of-contact outcomes.'
		}
	];
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
		<wa-tab panel="batting">Batting</wa-tab>
		<wa-tab panel="advanced">Pitching</wa-tab>
		<wa-tab panel="advanced">Fielding</wa-tab>
		<wa-tab panel="accolades">Accolades</wa-tab>

		<wa-tab-panel name="general">
			<h3>Player Profile Info</h3>
			<p>Bats: {playerProfile.batSide?.description || 'N/A'}</p>
			<p>Throws: {playerProfile.pitchHand?.description || 'N/A'}</p>
		</wa-tab-panel>

		<wa-tab-panel name="batting">
			<wa-tooltip for="battingExplanation">
				For example: 93 means that player is in the top 93 percent of MLB players in that category.
			</wa-tooltip>
			<div class="horizontal-wrapper" id="battingExplanation">
				<h3>Batting Percentiles</h3>
				<wa-divider orientation="vertical"></wa-divider>
				<wa-badge variant="brand" appearance="filled">Higher number is better</wa-badge>
			</div>

			<div class="stats-grid-container">
				<div class="stats-column">
					<h4 class="category-heading">Power Profile</h4>
					<div class="wa-stack">
						{#each battingStatConfig.filter((s) => s.category === 'profile') as stat}
							{#if battingPercentileStats?.[stat.key] !== undefined && battingPercentileStats?.[stat.key] !== null}
								<StatBar
									label={stat.label}
									percentile={battingPercentileStats[stat.key]}
									tooltipText={stat.description}
								/>
							{/if}
						{/each}
					</div>
				</div>

				<wa-divider orientation="vertical" class="grid-desktop-divider"></wa-divider>

				<div class="stats-column">
					<h4 class="category-heading">Plate Discipline</h4>
					<div class="wa-stack">
						{#each battingStatConfig.filter((s) => s.category === 'discipline') as stat}
							{#if battingPercentileStats?.[stat.key] !== undefined && battingPercentileStats?.[stat.key] !== null}
								<StatBar
									label={stat.label}
									percentile={battingPercentileStats[stat.key]}
									tooltipText={stat.description}
								/>
							{/if}
						{/each}
					</div>
				</div>

				<wa-divider orientation="vertical" class="grid-desktop-divider"></wa-divider>

				<div class="stats-column">
					<h4 class="category-heading">Expected Metrics</h4>
					<div class="wa-stack">
						{#each battingStatConfig.filter((s) => s.category === 'expected') as stat}
							{#if battingPercentileStats?.[stat.key] !== undefined && battingPercentileStats?.[stat.key] !== null}
								<StatBar
									label={stat.label}
									percentile={battingPercentileStats[stat.key]}
									tooltipText={stat.description}
								/>
							{/if}
						{/each}
					</div>
				</div>
			</div>
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

	.stats-grid-container {
		display: grid;
		grid-template-columns: 1fr;
		gap: 2rem;
		align-items: start;
		margin-top: 1rem;
		width: 100%;
	}

	.stats-column {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.grid-desktop-divider {
		display: none;
		height: 100%;
		align-self: stretch;
	}

	.category-heading {
		margin: 0;
		font-size: var(--wa-font-size-m);
		color: var(--wa-color-brand-on-quiet);
		text-transform: uppercase;
		letter-spacing: 0.5px;
		border-bottom: 1px dashed var(--wa-color-border-quiet);
		padding-bottom: 0.5rem;
	}

	@media (min-width: 1024px) {
		.stats-grid-container {
			/* 3 main content columns with 2 auto-sized tracks for vertical lines */
			grid-template-columns: 1fr auto 1fr auto 1fr;
			gap: 1.5rem;
		}

		.grid-desktop-divider {
			display: block;
		}
	}

	.horizontal-wrapper {
		display: flex;
		align-items: center;
		margin: 2rem 0 2rem 0;
		width: min-content;
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
