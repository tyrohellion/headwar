<script>
	import { fetchPybaseball } from '$lib/pybaseball.js';
	import { getPlayerPictureLarge } from '../../../api/getPlayerPicture';
	import { getPlayerInfo } from '../../../api/getPlayerInfo';
	import { getTeamLogo } from '../../../api/getTeamLogo';
	import { getPlayerBattingStatsBref } from '../../../api/getPlayerBattingStats';
	import { getPlayerBattingPercentileStats } from '../../../api/getPlayerBattingPercentile';
	import { standardBattingConfig } from '../../../api/standardBattingStatsConfig';
	import { battingStatConfig } from '../../../api/battingStatsConfig';
	import { page } from '$app/stores';

	import WaTabGroup from '@awesome.me/webawesome/dist/components/tab-group/tab-group.js';
	import WaTabPanel from '@awesome.me/webawesome/dist/components/tab-panel/tab-panel.js';
	import WaDivider from '@awesome.me/webawesome/dist/components/divider/divider.js';
	import WaSkeleton from '@awesome.me/webawesome/dist/components/skeleton/skeleton.js';
	import WaBadge from '@awesome.me/webawesome/dist/components/badge/badge.js';
	import WaFormatDate from '@awesome.me/webawesome/dist/components/format-date/format-date.js';
	import WaIcon from '@awesome.me/webawesome/dist/components/icon/icon.js';
	import WaTooltip from '@awesome.me/webawesome/dist/components/tooltip/tooltip.js';
	import WaSelect from '@awesome.me/webawesome/dist/components/select/select.js';
	import WaSpinner from '@awesome.me/webawesome/dist/components/spinner/spinner.js';
	import WaProgressBar from '@awesome.me/webawesome/dist/components/progress-bar/progress-bar.js';

	import StatBar from '$lib/components/statBar.svelte';
	import StatPill from '$lib/components/statPill.svelte';

	let playerData = $state(null);
	let loading = $state(true);
	let errorMsg = $state('');
	let bbrefId = $state('');
	let imgLoading = $state(true);

	let battingStats = $state(null);
	let isBattingStatsLoading = $state(false);
	let battingPercentileStats = $state(null);
	let isBattingPercentileStatsLoading = $state(false);

	let userSelectedYear = $state(new Date().getFullYear().toString());
	let userSelectedYearStandard = $state(new Date().getFullYear().toString());

	$effect(() => {
		if ($page.params.id) {
			imgLoading = true;
		}
	});

	$effect(() => {
		const id = $page.params.id;
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

				const profile = info?.people?.[0];
				if (profile?.mlbDebutDate) {
					if (profile.lastPlayedDate) {
						const finalYear = new Date(profile.lastPlayedDate).getFullYear().toString();
						userSelectedYear = finalYear;
						userSelectedYearStandard = finalYear;
					} else {
						const currentYear = new Date().getFullYear().toString();
						userSelectedYear = currentYear;
						userSelectedYearStandard = currentYear;
					}
				}
			} catch (err) {
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

	let availableSeasons = $derived.by(() => {
		if (!playerProfile?.mlbDebutDate) return [];

		const rawStartYear = new Date(playerProfile.mlbDebutDate).getFullYear();
		const startYear = Math.max(rawStartYear, 2015);

		const endYear = playerProfile.lastPlayedDate
			? new Date(playerProfile.lastPlayedDate).getFullYear()
			: new Date().getFullYear();

		if (endYear < 2015 || startYear > endYear) return [];

		const years = [];
		for (let y = endYear; y >= startYear; y--) {
			years.push(y.toString());
		}
		return years;
	});

	let availableSeasonsStandard = $derived.by(() => {
		if (!playerProfile?.mlbDebutDate) return [];

		const rawStartYear = new Date(playerProfile.mlbDebutDate).getFullYear();
		const startYear = Math.max(rawStartYear, 2008);

		const endYear = playerProfile.lastPlayedDate
			? new Date(playerProfile.lastPlayedDate).getFullYear()
			: new Date().getFullYear();

		if (endYear < 2008 || startYear > endYear) return [];

		const years = [];
		for (let y = endYear; y >= startYear; y--) {
			years.push(y.toString());
		}
		return years;
	});

	$effect(() => {
		const id = $page.params.id;
		const targetYear = userSelectedYearStandard;

		async function loadBattingStats() {
			isBattingStatsLoading = true;
			try {
				battingStats = await getPlayerBattingStatsBref(id, targetYear);
			} catch (err) {
				battingStats = null;
			} finally {
				isBattingStatsLoading = false;
			}
		}

		loadBattingStats();
	});

	$effect(() => {
		const id = $page.params.id;
		const targetYear = userSelectedYear;
		if (!id || availableSeasons.length === 0 || !availableSeasons.includes(targetYear)) {
			battingPercentileStats = null;
			return;
		}

		async function loadPercentiles() {
			isBattingPercentileStatsLoading = true;
			try {
				battingPercentileStats = await getPlayerBattingPercentileStats(id, targetYear);
			} catch (err) {
				battingPercentileStats = null;
			} finally {
				isBattingPercentileStatsLoading = false;
			}
		}

		loadPercentiles();
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
		<wa-tab panel="batting">Batting</wa-tab>
		<wa-tab panel="advanced">Pitching</wa-tab>
		<wa-tab panel="advanced">Fielding</wa-tab>
		<wa-tab panel="accolades">Accolades</wa-tab>

		<wa-tab-panel name="general">
			<h3>Overview</h3>
			<p>Bats: {playerProfile.batSide?.description || 'N/A'}</p>
			<p>Throws: {playerProfile.pitchHand?.description || 'N/A'}</p>
		</wa-tab-panel>

		<wa-tab-panel name="batting">
			<wa-tooltip for="battingExplanation">
				93 would mean a player is in the top 7 percent of MLB players in that category. 50 is always
				going to be the league average.
			</wa-tooltip>
			<div class="horizontal-wrapper">
				<h3 id="battingExplanation" style="cursor: help;">Batting Percentiles</h3>
				<wa-divider orientation="vertical"></wa-divider>
				<wa-badge variant="brand" appearance="filled">Higher number is better</wa-badge>
				<wa-divider orientation="vertical"></wa-divider>
				{#if availableSeasons.length === 0}
					<wa-tooltip for="percentileYearSelector">
						Only 2015-Present data available for statcast percentiles or player has no data to show
					</wa-tooltip>
				{/if}

				<wa-select
					id="percentileYearSelector"
					value={userSelectedYear}
					disabled={availableSeasons.length <= 1 || null}
					size="s"
					style="width: 6rem;"
					onchange={(e) => {
						userSelectedYear = e.target.value;
						console.log(`[UI Control] Dropdown picked new year: ${userSelectedYear}`);
					}}
				>
					{#if availableSeasons.length === 0}
						<wa-option value={userSelectedYear}>{userSelectedYear}</wa-option>
					{:else}
						{#each availableSeasons as season}
							<wa-option value={season}>{season}</wa-option>
						{/each}
					{/if}
				</wa-select>
			</div>

			{#if availableSeasons.length > 0}
				<div class="stats-grid-container">
					<div class="stats-column">
						<div class="category-heading-wrapper">
							<h4 class="category-heading">Power Profile</h4>
						</div>
						<div class="wa-stack">
							{#each battingStatConfig.filter((s) => s.category === 'profile') as stat}
								{#if battingPercentileStats?.[stat.key] !== undefined && battingPercentileStats?.[stat.key] !== null}
									<StatBar
										label={stat.label}
										percentile={battingPercentileStats[stat.key]}
										tooltipText={stat.description}
									/>
								{:else}
									<StatBar label="No data" percentile="N/A" />
								{/if}
							{/each}
						</div>
					</div>

					<wa-divider orientation="vertical" class="grid-desktop-divider"></wa-divider>

					<div class="stats-column">
						<div class="category-heading-wrapper">
							<h4 class="category-heading">Plate Discipline</h4>
						</div>
						<div class="wa-stack">
							{#each battingStatConfig.filter((s) => s.category === 'discipline') as stat}
								{#if battingPercentileStats?.[stat.key] !== undefined && battingPercentileStats?.[stat.key] !== null}
									<StatBar
										label={stat.label}
										percentile={battingPercentileStats[stat.key]}
										tooltipText={stat.description}
									/>
								{:else}
									<StatBar label="No data" percentile="N/A" />
								{/if}
							{/each}
						</div>
					</div>

					<wa-divider orientation="vertical" class="grid-desktop-divider"></wa-divider>

					<div class="stats-column">
						<wa-tooltip for="expectedHeading"
							>Calculates what a player's numbers should look like based entirely on exit velocity
							and launch angle, completely removing defense. If a player's real stats are much lower
							than the expected, they have arguably been getting unlucky.</wa-tooltip
						>
						<div class="category-heading-wrapper">
							<h4 class="category-heading" id="expectedHeading" style="cursor: help;">
								Expected Metrics
							</h4>
						</div>
						<div class="wa-stack">
							{#each battingStatConfig.filter((s) => s.category === 'expected') as stat}
								{#if battingPercentileStats?.[stat.key] !== undefined && battingPercentileStats?.[stat.key] !== null}
									<StatBar
										label={stat.label}
										percentile={battingPercentileStats[stat.key]}
										tooltipText={stat.description}
									/>
								{:else}
									<StatBar label="No data" percentile="N/A" />
								{/if}
							{/each}
						</div>
					</div>
				</div>
			{:else}
				<p>
					Statcast advanced percentile metrics are unavailable for this player because their career
					either concluded prior to the introduction of modern tracking systems in 2015, or they
					have no Major League debut yet.
				</p>
			{/if}

			<wa-divider style="margin: 3rem 0 3em 0;"></wa-divider>

			<!-- basic batting stats -->
			<wa-tooltip for="battingExplanationStandard">
				Basic batting stats. Unlike percentage, some of these stats are linear numbers. Think Home
				runs or Triples.
			</wa-tooltip>
			<div class="horizontal-wrapper">
				<h3 id="battingExplanationStandard" style="cursor: help;">Batting Stats</h3>
				<wa-divider orientation="vertical"></wa-divider>

				{#if availableSeasonsStandard.length === 0}
					<wa-tooltip for="battingYearSelector"
						>Only 2008-Present data available or player has no data to show</wa-tooltip
					>
				{/if}

				<wa-select
					id="battingYearSelector"
					value={userSelectedYearStandard}
					disabled={availableSeasonsStandard.length <= 1 || null}
					size="s"
					style="width: 6rem;"
					onchange={(e) => {
						userSelectedYearStandard = e.target.value;
						console.log(`[UI Control] Dropdown picked new year: ${userSelectedYearStandard}`);
					}}
				>
					{#if availableSeasonsStandard.length === 0}
						<wa-option value={userSelectedYearStandard}>{userSelectedYearStandard}</wa-option>
					{:else}
						{#each availableSeasonsStandard as season}
							<wa-option value={season}>{season}</wa-option>
						{/each}
					{/if}
				</wa-select>
			</div>

			{#if availableSeasonsStandard.length > 0}
				{#if isBattingStatsLoading == true}
					<div class="stats-grid-container">
						<div class="stats-column">
							<div class="category-heading-wrapper">
								<h4 class="category-heading">Standard</h4>
							</div>
							<div class="wa-stack">
								{#each standardBattingConfig.filter((s) => s.category === 'standard') as stat}
									<wa-progress-bar indeterminate style="margin-bottom: 0.5rem;"></wa-progress-bar>
								{/each}
							</div>
						</div>

						<wa-divider orientation="vertical" class="grid-desktop-divider"></wa-divider>

						<div class="stats-column">
							<div class="category-heading-wrapper">
								<h4 class="category-heading">Counting</h4>
							</div>
							<div class="wa-stack">
								{#each standardBattingConfig.filter((s) => s.category === 'counting') as stat}
									<wa-progress-bar indeterminate style="margin-bottom: 0.5rem;"></wa-progress-bar>
								{/each}
							</div>
						</div>

						<wa-divider orientation="vertical" class="grid-desktop-divider"></wa-divider>

						<div class="stats-column">
							<div class="category-heading-wrapper">
								<h4 class="category-heading">Situational</h4>
							</div>
							<div class="wa-stack">
								{#each standardBattingConfig.filter((s) => s.category === 'situational') as stat}
									<wa-progress-bar indeterminate style="margin-bottom: 0.5rem;"></wa-progress-bar>
								{/each}
							</div>
						</div>
					</div>
				{:else}
					<div class="stats-grid-container">
						<div class="stats-column">
							<div class="category-heading-wrapper">
								<h4 class="category-heading">Standard</h4>
							</div>
							<div class="wa-stack">
								{#each standardBattingConfig.filter((s) => s.category === 'standard') as stat}
									{#if battingStats?.[stat.key] !== undefined && battingStats?.[stat.key] !== null}
										<StatPill
											label={stat.label}
											abbr={stat.key}
											percentile={stat.key === 'BA' || stat.key === 'OBP' || stat.key === 'SLG'
												? battingStats[stat.key].toFixed(3).replace(/^0/, '') // Formats as .297 instead of 0.297
												: stat.key === 'OPS'
													? battingStats[stat.key].toFixed(3)
													: battingStats[stat.key]}
											tooltipText={stat.description}
										/>
									{:else}
										<StatPill label="No data" percentile="N/A" />
									{/if}
								{/each}
							</div>
						</div>

						<wa-divider orientation="vertical" class="grid-desktop-divider"></wa-divider>

						<div class="stats-column">
							<div class="category-heading-wrapper">
								<h4 class="category-heading">Counting</h4>
							</div>
							<div class="wa-stack">
								{#each standardBattingConfig.filter((s) => s.category === 'counting') as stat}
									{#if battingStats?.[stat.key] !== undefined && battingStats?.[stat.key] !== null}
										<StatPill
											abbr={stat.key}
											label={stat.label}
											percentile={battingStats[stat.key]}
											tooltipText={stat.description}
										/>
									{:else}
										<StatPill label="No data" percentile="N/A" />
									{/if}
								{/each}
							</div>
						</div>

						<wa-divider orientation="vertical" class="grid-desktop-divider"></wa-divider>

						<div class="stats-column">
							<div class="category-heading-wrapper">
								<h4 class="category-heading">Situational</h4>
							</div>
							<div class="wa-stack">
								{#each standardBattingConfig.filter((s) => s.category === 'situational') as stat}
									{#if battingStats?.[stat.key] !== undefined && battingStats?.[stat.key] !== null}
										<StatPill
											abbr={stat.key}
											label={stat.label}
											percentile={battingStats[stat.key]}
											tooltipText={stat.description}
										/>
									{:else}
										<StatPill label="No data" percentile="N/A" />
									{/if}
								{/each}
							</div>
						</div>
					</div>
				{/if}
			{:else}
				<p>
					Player either has no MLB debut yet or their career ended before 2008. Only data from
					2008-Present is available.
				</p>
			{/if}
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
		padding-bottom: 0.5rem;
		width: min-content;
		white-space: nowrap;
	}

	.category-heading-wrapper {
		border-bottom: 1px dashed var(--wa-color-border-quiet);
		width: 100%;
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
		margin: 1rem 0 2rem 0;
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
