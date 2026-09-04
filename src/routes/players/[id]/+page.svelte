<script>
	import { advancedStats, loadAdvancedMetrics } from '$lib/warStore.svelte.js';
	import { getPlayerStatcastProfile } from '$lib/advancedData.js';
	import {
		computePitcherHwar,
		computeHitterHwar,
		computeWobaBattingRuns,
		computeGamesByPosition,
		deriveFieldingPosition,
		inningsToDecimal
	} from '$lib/warCalculator.js';
	import { getLeagueContext } from '$lib/leagueContext.js';
	import { getPlayerPictureLarge } from '../../../api/getPlayerPicture';
	import { getPlayerInfo } from '../../../api/getPlayerInfo';
	import { getTeamLogo } from '../../../api/getTeamLogo';
	import { standardBattingConfig } from '../../../formatters/standardBattingStatsConfig';
	import { battingStatConfig } from '../../../formatters/battingStatsConfig';
	import { processPlayerAwards } from '../../../formatters/playerAwardFormatter';
	import { standardPitchingConfig } from '../../../formatters/standardPitchingStatsConfig';
	import { standardFieldingStatsConfig } from '../../../formatters/fieldingStatsConfig';
	import { pitchingStatsConfig } from '../../../formatters/pitchingStatsConfig';
	import { fieldingStatcastConfig } from '../../../formatters/fieldingStatcastConfig';
	import { getSeasonProgressPercentage } from '../../../formatters/getSeasonProgressPercentage';
	import { page } from '$app/stores';
	import { onMount, untrack } from 'svelte';
	import { goto } from '$app/navigation';

	import {
		findStatBlock,
		calculateActiveHittingStats,
		calculateActivePitchingStats,
		calculateActiveFieldingStats,
		getAvailableFieldingPositions
	} from '../../../formatters/playerUtils';

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
	import WaButton from '@awesome.me/webawesome/dist/components/button/button.js';
	import WaSwitch from '@awesome.me/webawesome/dist/components/switch/switch.js';

	import StatBar from '$lib/components/statBar.svelte';
	import StatPill from '$lib/components/statPill.svelte';
	import StatcastStatBar from '$lib/components/statcastStatBar.svelte';
	import StatcastStatBarSkeleton from '$lib/components/statcastStatBarSkeleton.svelte';
	import StatBox from '$lib/components/statBox.svelte';
	import StatBoxSkeleton from '$lib/components/statBoxSkeleton.svelte';
	import StatBoxStandard from '$lib/components/statBoxStandard.svelte';
	import StatBoxStandardPitching from '$lib/components/statBoxStandardPitching.svelte';
	import StatBoxStandardDual from '$lib/components/statBoxStandardDual.svelte';

	const seasonProgress = $derived.by(() => getSeasonProgressPercentage());

	let playerData = $state(null);
	let loading = $state(true);
	let errorMsg = $state('');
	let imgLoading = $state(true);

	let battingStatcast = $state(null);
	let fieldingStatcast = $state(null);
	let isFieldingPercentileStatsLoading = $state(false);
	let pitchingStatcast = $state(null);
	let isBattingPercentileStatsLoading = $state(false);
	let isPitchingPercentileStatsLoading = $state(false);

	let hasPitcherPercentiles = $derived(
		pitchingStatcast && hasAnyValue(pitchingStatcast.pitcherPercentiles)
	);

	let hasFieldingStatcast = $derived(
		fieldingStatcast &&
			(hasAnyValue(fieldingStatcast.fieldingRunValues) ||
				hasAnyValue(fieldingStatcast.armStrength) ||
				(fieldingStatcast.percentiles?.arm_strength ?? null) != null)
	);

	let hasBattingStatcast = $derived(
		battingStatcast &&
			battingStatConfig.some(
				(conf) => battingStatcast.percentiles?.[conf.percentileKey ?? conf.key] != null
			)
	);

	let statcastNoDataText = $derived(
		isCareerMode
			? 'Statcast data is not available in career mode.'
			: isDateFilterActive
				? 'Statcast data is not available for custom date ranges.'
				: `No statcast data available for ${userSelectedYear}.`
	);

	function hasAnyValue(obj) {
		if (!obj) return false;
		return Object.values(obj).some((v) => v != null && v !== '' && !Number.isNaN(Number(v)));
	}

	let userSelectedYear = $state(new Date().getFullYear().toString());
	let isCareerMode = $state(false);
	let userSelectedTeam = $state('ALL');
	let selectedRangeLabel = $state('NONE');

	let userSelectedFieldingPosition = $state('ALL');
	let hasDefaultedViewMode = $state(false);
	let advancedDisplayMode = $state('season');
	let isDesktop = $state(true);

	let startDate = $state('');
	let endDate = $state('');
	let isDateFilterActive = $state(false);

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

		const filterActive = isDateFilterActive;
		const start = startDate;
		const end = endDate;

		async function loadProfile() {
			loading = true;
			errorMsg = '';
			try {
				const info =
					filterActive && start && end
						? await getPlayerInfo(id, { startDate: start, endDate: end })
						: await getPlayerInfo(id);

				playerData = info;

				console.log('DEBUG 1 -> Full API payload response:', info);

				const profile = info?.people?.[0];
				if (profile?.mlbDebutDate) {
					untrack(() => {
						if (availableOverviewSeasons.length > 0) {
							userSelectedYear = availableOverviewSeasons[0];
						} else {
							userSelectedYear = profile.lastPlayedDate
								? new Date(profile.lastPlayedDate).getFullYear().toString()
								: new Date().getFullYear().toString();
						}
					});
				}
			} catch (err) {
				errorMsg = err.message;
			} finally {
				loading = false;
			}
		}

		loadProfile();
	});

	$effect(() => {
		if (startDate && endDate) {
			untrack(() => {
				isCareerMode = false;
				isDateFilterActive = true;
				advancedDisplayMode = 'season';
			});
		} else {
			untrack(() => {
				isDateFilterActive = false;
			});
		}
	});

	$effect(() => {
		isCareerMode;
		isDateFilterActive;

		untrack(() => {
			userSelectedTeam = 'ALL';
		});
	});

	function clearDateRange() {
		startDate = '';
		endDate = '';
		isDateFilterActive = false;
		selectedRangeLabel = 'NONE';
		if (availableOverviewSeasons.length > 0) {
			userSelectedYear = availableOverviewSeasons[0];
		}
	}

	$effect(() => {
		const id = $page.params.id;
		const targetYear = userSelectedYear || new Date().getFullYear().toString();

		if (id) {
			if (isDateFilterActive && startDate && endDate) {
				loadAdvancedMetrics(id, targetYear, { startDate, endDate });
			} else {
				loadAdvancedMetrics(id, targetYear);
			}
		}
	});

	let playerProfile = $derived(playerData?.people?.[0] || null);

	let teamLogoUrl = $derived.by(() => {
		const teamId = playerProfile?.currentTeam?.id;
		return teamId ? getTeamLogo(teamId) : '';
	});

	let processedAccolades = $derived(processPlayerAwards(playerProfile?.awards || []));

	let hittingStatsBlock = $derived(
		findStatBlock(playerProfile, 'hitting', 'yearbyyear', isDateFilterActive)
	);
	let careerStatsBlock = $derived(
		findStatBlock(playerProfile, 'hitting', 'career', isDateFilterActive)
	);
	let pitchingStatsBlock = $derived(
		findStatBlock(playerProfile, 'pitching', 'yearbyyear', isDateFilterActive)
	);
	let careerPitchingStatsBlock = $derived(
		findStatBlock(playerProfile, 'pitching', 'career', isDateFilterActive)
	);
	let fieldingStatsBlock = $derived(
		findStatBlock(playerProfile, 'fielding', 'yearbyyear', isDateFilterActive)
	);

	let availableOverviewSeasons = $derived.by(() => {
		const getSeasonsForTeam = (block, teamId) => {
			if (!block?.splits) return [];
			return block.splits
				.filter((split) => {
					if (!split.season) return false;
					if (teamId !== 'ALL') {
						return split.team && String(split.team.id) === String(teamId);
					}
					return true;
				})
				.map((split) => split.season);
		};

		const hittingYears = getSeasonsForTeam(hittingStatsBlock, userSelectedTeam);
		const pitchingYears = getSeasonsForTeam(pitchingStatsBlock, userSelectedTeam);
		const fieldingYears = getSeasonsForTeam(fieldingStatsBlock, userSelectedTeam);

		return [...new Set([...hittingYears, ...pitchingYears, ...fieldingYears])].sort(
			(a, b) => parseInt(b) - parseInt(a)
		);
	});

	let availableTeams = $derived.by(() => {
		const teamMap = new Map();

		const blocks = [hittingStatsBlock, pitchingStatsBlock, fieldingStatsBlock];

		blocks.forEach((block) => {
			if (block?.splits) {
				block.splits.forEach((split) => {
					if (split.team?.id && split.team?.name) {
						if (!String(split.team.name).toLowerCase().includes('teams')) {
							teamMap.set(split.team.id, split.team.name);
						}
					}
				});
			}
		});

		return Array.from(teamMap.entries()).map(([id, name]) => ({ id, name }));
	});

	$effect(() => {
		const seasons = availableOverviewSeasons;
		const currentYear = userSelectedYear;

		if (seasons.length > 0 && !seasons.includes(currentYear)) {
			untrack(() => {
				userSelectedYear = seasons[0];
			});
		}
	});

	let activeSeasonStats = $derived(
		calculateActiveHittingStats({
			isCareerMode,
			isDateFilterActive,
			userSelectedYear,
			userSelectedTeam,
			careerStatsBlock,
			hittingStatsBlock,
			startDate,
			endDate
		})
	);

	let activePitchingStats = $derived(
		calculateActivePitchingStats({
			isCareerMode,
			isDateFilterActive,
			userSelectedYear,
			userSelectedTeam,
			careerPitchingStatsBlock,
			pitchingStatsBlock,
			startDate,
			endDate
		})
	);

	let leagueContext = $derived(
		getLeagueContext(Number(userSelectedYear) || new Date().getFullYear())
	);

	let battingPosition = $derived(
		deriveFieldingPosition(
			playerProfile?.primaryPosition?.abbreviation,
			fieldingStatsBlock?.splits,
			{
				season: userSelectedYear,
				isCareerMode,
				gamesPlayed: activeSeasonStats?.gamesPlayed
			}
		)
	);

	let battingGamesByPosition = $derived(
		computeGamesByPosition(fieldingStatsBlock?.splits, {
			season: userSelectedYear,
			isCareerMode
		}).gamesByPosition
	);

	let pitcherAdvanced = $derived.by(() => {
		if (!activePitchingStats?.inningsPitched) return null;
		if (!(inningsToDecimal(activePitchingStats.inningsPitched) > 0)) return null;
		return computePitcherHwar(activePitchingStats, leagueContext);
	});

	let hitterAdvanced = $derived.by(() => {
		if (!activeSeasonStats?.plateAppearances || battingPosition === 'P') return null;
		const battingRuns =
			computeWobaBattingRuns(activeSeasonStats, leagueContext) ??
			battingStatcast?.runValues?.runs_all;
		if (typeof battingRuns !== 'number') return null;
		return computeHitterHwar(
			{
				battingRuns,
				baserunningRuns: battingStatcast?.baserunningRunValues?.runner_runs_tot,
				fieldingRuns: battingStatcast?.fieldingRunValues?.total_runs,
				plateAppearances: activeSeasonStats.plateAppearances,
				gamesPlayed: activeSeasonStats.gamesPlayed,
				position: battingPosition,
				gamesByPosition: battingGamesByPosition
			},
			leagueContext
		);
	});

	let seasonHwar = $derived.by(() => {
		const pitching = pitcherAdvanced?.hwar ?? 0;
		const batting = hitterAdvanced ?? 0;
		if (pitching === 0 && batting === 0) return null;
		return pitching + batting;
	});

	let activeFieldingStats = $derived(
		calculateActiveFieldingStats({
			isCareerMode,
			isDateFilterActive,
			userSelectedYear,
			userSelectedFieldingPosition,
			userSelectedTeam,
			fieldingStatsBlock,
			startDate,
			endDate
		})
	);

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

	$effect(() => {
		const id = $page.params.id;
		const targetYear = userSelectedYear;

		let cancelled = false;

		if (
			!id ||
			isDateFilterActive ||
			isCareerMode ||
			availableSeasons.length === 0 ||
			!availableSeasons.includes(targetYear)
		) {
			battingStatcast = null;
			pitchingStatcast = null;
			fieldingStatcast = null;
			isBattingPercentileStatsLoading = false;
			isPitchingPercentileStatsLoading = false;
			isFieldingPercentileStatsLoading = false;
			return;
		}

		async function loadAllStatcastProfiles() {
			isBattingPercentileStatsLoading = true;
			isPitchingPercentileStatsLoading = true;
			isFieldingPercentileStatsLoading = true;

			try {
				const [battingRes] = await Promise.allSettled([getPlayerStatcastProfile(id, targetYear)]);

				const batterProfile = battingRes.status === 'fulfilled' ? battingRes.value : null;

				if (cancelled) return;

				battingStatcast = batterProfile;

				fieldingStatcast = batterProfile;

				pitchingStatcast = batterProfile;
			} catch (err) {
				console.error('[Statcast Effect Error]:', err);
				if (cancelled) return;
				battingStatcast = null;
				pitchingStatcast = null;
				fieldingStatcast = null;
			} finally {
				if (!cancelled) {
					isBattingPercentileStatsLoading = false;
					isPitchingPercentileStatsLoading = false;
					isFieldingPercentileStatsLoading = false;
				}
			}
		}

		loadAllStatcastProfiles();

		return () => {
			cancelled = true;
		};
	});

	let availableFieldingPositions = $derived(
		getAvailableFieldingPositions(fieldingStatsBlock, userSelectedYear, isCareerMode)
	);

	$effect(() => {
		const positions = availableFieldingPositions;
		untrack(() => {
			if (positions.length === 1) {
				userSelectedFieldingPosition = positions[0];
			} else if (!positions.includes(userSelectedFieldingPosition)) {
				userSelectedFieldingPosition = 'ALL';
			}
		});
	});

	$effect(() => {
		if (userSelectedYear && !isDateFilterActive) {
			advancedDisplayMode = isCareerMode ? 'career' : 'season';
		}
	});

	$effect(() => {
		const id = $page.params.id;
		untrack(() => {
			id;
			hasDefaultedViewMode = false;
			isCareerMode = false;
			advancedDisplayMode = 'season';
			startDate = '';
			endDate = '';
			isDateFilterActive = false;
			userSelectedTeam = 'ALL';

			if (availableOverviewSeasons.length > 0) {
				userSelectedYear = availableOverviewSeasons[0];
			} else {
				userSelectedYear = new Date().getFullYear().toString();
			}
		});
	});

	$effect(() => {
		if (
			typeof advancedStats !== 'undefined' &&
			!advancedStats.loading &&
			advancedStats.isRetired &&
			!hasDefaultedViewMode &&
			!isDateFilterActive
		) {
			untrack(() => {
				advancedDisplayMode = 'career';
				isCareerMode = true;
				hasDefaultedViewMode = true;
			});
		}
	});

	function handleRangeChange(e) {
		const val = e.target.value;
		selectedRangeLabel = val;

		if (val === 'NONE') {
			clearDateRange();
			return;
		}

		const today = new Date();
		let calculatedStartDate = new Date();

		if (val === '24 Hours') {
			calculatedStartDate.setDate(today.getDate() - 1);
		} else if (val === '7 Days') {
			calculatedStartDate.setDate(today.getDate() - 7);
		} else if (val === '30 Days') {
			calculatedStartDate.setDate(today.getDate() - 30);
		}

		startDate = formatDate(calculatedStartDate);
		endDate = formatDate(today);
		isDateFilterActive = true;
	}

	function formatDate(date) {
		const yyyy = date.getFullYear();
		const mm = String(date.getMonth() + 1).padStart(2, '0');
		const dd = String(date.getDate()).padStart(2, '0');
		return `${yyyy}-${mm}-${dd}`;
	}
</script>

{#if loading}
	<div class="status-message">
		<wa-spinner style="font-size: 3rem;"></wa-spinner>
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
					<wa-divider orientation="vertical" id="verticalDividers"></wa-divider>
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
		</div>
	</div>
	<div class="details-filters-wrapper">
		<div class="small-details-wrapper">
			<p>{playerProfile.deathDate ? 'Died at ' : ''}{playerProfile.currentAge} years old</p>
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
					<wa-icon name="arrow-right" label="arrow right" class="debut-arrow"></wa-icon>
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
			<wa-badge appearance="filled" size="l" variant="neutral"
				>Bats: {playerProfile.batSide?.description || 'N/A'}</wa-badge
			>
			<wa-divider orientation="vertical"></wa-divider>
			<wa-badge appearance="filled" size="l" variant="neutral"
				>Throws: {playerProfile.pitchHand?.description || 'N/A'}</wa-badge
			>
			<wa-divider orientation="vertical"></wa-divider>
			<p>{playerProfile.weight} lbs</p>
			<wa-divider orientation="vertical"></wa-divider>
			<p>{playerProfile.height}</p>
		</div>
		<div class="filter-controls-group">
			{#if !isCareerMode && new Date().getFullYear() == userSelectedYear}
				<div class="date-range-inputs">
					<wa-select
						appearance="filled"
						size="s"
						value={selectedRangeLabel}
						placeholder="Select Range"
						onchange={handleRangeChange}
						style="width: 160px;"
					>
						<wa-option value="NONE">Season Year</wa-option>
						<wa-option value="24 Hours">Last 24 Hours</wa-option>
						<wa-option value="7 Days">Last 7 Days</wa-option>
						<wa-option value="30 Days">Last 30 Days</wa-option>
					</wa-select>

					{#if isDateFilterActive}
						<wa-button size="s" variant="neutral" onclick={clearDateRange}>Clear Range</wa-button>
					{/if}
				</div>
			{/if}

			{#if !isDateFilterActive}
				{#if !isCareerMode && availableOverviewSeasons.length > 0}
					<wa-select
						appearance="filled"
						size="s"
						value={userSelectedYear}
						onchange={(e) => (userSelectedYear = e.target.value)}
						style="width: 110px;"
					>
						{#each availableOverviewSeasons as season}
							<wa-option value={season}>{season}</wa-option>
						{/each}
					</wa-select>
				{/if}

				{#if availableTeams && availableTeams.length > 0 && !isCareerMode}
					<wa-select
						appearance="filled"
						size="s"
						value={userSelectedTeam}
						onchange={(e) => (userSelectedTeam = e.target.value)}
						style="width: 216px;"
					>
						<wa-option value="ALL">All Teams</wa-option>
						{#each availableTeams as team}
							<wa-option value={String(team.id)}>{team.name}</wa-option>
						{/each}
					</wa-select>
				{/if}

				<wa-switch
					size="s"
					checked={isCareerMode}
					onchange={(e) => (isCareerMode = e.target.checked)}
				>
					Career Stats
				</wa-switch>
			{/if}
		</div>
	</div>

	<wa-divider style="margin-top: 0px;"></wa-divider>

	{#key isDesktop}
		<wa-tab-group placement={isDesktop ? 'start' : 'top'}>
			{#snippet statcastSkeletonGrid(config, categories, pulsing)}
				{#each categories as category, i (category)}
					{#if i > 0}
						<wa-divider></wa-divider>
					{/if}
					<div class="statcast-grid">
						{#each config.filter((c) => c.category === category) as conf (conf.key)}
							<StatcastStatBarSkeleton
								label={conf.label}
								tooltipText={conf.description}
								{pulsing}
							/>
						{/each}
					</div>
				{/each}
			{/snippet}

			<wa-tab panel="overview">Overview</wa-tab>
			{#if activeSeasonStats && activeSeasonStats.atBats > 0}
				<wa-tab panel="batting">Batting</wa-tab>
			{/if}
			{#if activePitchingStats?.gamesPlayed > 0}
				<wa-tab panel="pitching">Pitching</wa-tab>
			{/if}
			<wa-tab panel="fielding">Fielding</wa-tab>
			<wa-tab panel="awards">Awards</wa-tab>

			<wa-tab-panel name="overview">
				<div class="advanced-tab-panel">
					{#if !isDateFilterActive}
						<div class="horizontal-wrapper">
							{#if !isCareerMode}
								<h3>{userSelectedYear} Overview</h3>
							{:else}
								<h3>Career Overview</h3>
							{/if}
							<wa-divider orientation="vertical" id="verticalDividers"></wa-divider>
							<wa-badge variant="neutral" appearance="outlined"
								>not filterable by team or custom date range</wa-badge
							>
						</div>
						<div class="overview-boxes-wrapper">
							{#if advancedStats.loading}
								{#if isCareerMode}
									<StatBoxSkeleton abbr="WAR" careerSeasonLength={1} />
									<StatBoxSkeleton abbr="OPS+" progressContext="x" />
									<StatBoxSkeleton abbr="ERA+" progressContext="x" />
								{:else}
									<StatBoxSkeleton abbr="WAR" careerSeasonLength={1} />
									<StatBoxSkeleton abbr="WAR" progressContext="x" rank={1} />
									<StatBoxSkeleton abbr="OPS+" progressContext="x" rank={1} />
									<StatBoxSkeleton abbr="ERA+" progressContext="x" rank={1} />
								{/if}
							{:else if isCareerMode}
								<StatBox
									label="Career bWAR"
									abbr="WAR"
									careerSeasonLength={Object.keys(advancedStats.seasons).length}
									percentile={advancedStats.careerWar}
									isRetired={advancedStats.isRetired}
									tooltipText="The total estimated wins a player added to their teams over a baseline replacement-level player. 60+ WAR is the standard benchmark for the Hall of Fame. {playerProfile.fullName} accumulated this amount over {Object.keys(
										advancedStats.seasons
									).length} seasons"
								/>
							{:else}
								{const currentYear = new Date().getFullYear()}
								<StatBox
									label="{userSelectedYear} bWAR"
									abbr="WAR"
									progressContext={playerProfile?.primaryPosition?.abbreviation === 'P'
										? `${activePitchingStats?.gamesPlayed ?? 0} G`
										: `${activeSeasonStats?.gamesPlayed ?? 0} G`}
									percentile={advancedStats.currentSeasonWar}
									rank={advancedStats.currentSeasonWarRank
										? `#${advancedStats.currentSeasonWarRank}`
										: null}
									isRetired={advancedStats.isRetired}
									tooltipText="The total estimated wins a player added to their teams over a baseline replacement-level player throughout the selected season. 2.0+ is a solid starter, 5.0+ is an All-Star, and 8.0+ is an MVP-caliber performance. This stat is additive over the year. The percentage value is how far into the MLB season we are."
								/>

								{#if seasonHwar && userSelectedYear > 2014}
									<StatBox
										label="{userSelectedYear} hWAR"
										abbr="hWAR"
										progressContext={playerProfile?.primaryPosition?.abbreviation === 'P'
											? `${activePitchingStats?.gamesPlayed ?? 0} G`
											: `${activeSeasonStats?.gamesPlayed ?? 0} G`}
										percentile={seasonHwar.toFixed(1)}
										isRetired={advancedStats.isRetired}
										tooltipText="The total estimated wins a player added to their teams over a baseline replacement-level player throughout the selected season. Batters: wOBA-based batting runs (wRAA) plus Statcast baserunning and fielding, then positional and replacement adjustments. Pitchers: built from FIP. Two-way players combine both. Very similar formula to fWAR, but branded as hWAR because it varies slightly. 2.0+ is a solid starter, 5.0+ is an All-Star, 8.0+ is MVP-caliber."
									/>
								{/if}
							{/if}

							<StatBox
								label={isCareerMode ? 'Career OPS+' : `${userSelectedYear} OPS+`}
								abbr="OPS+"
								percentile={isCareerMode
									? advancedStats.careerOpsPlus
									: advancedStats.currentSeasonOpsPlus}
								{...!isCareerMode && advancedStats.currentSeasonOpsPlusRank !== 'N/A'
									? { rank: `#${advancedStats.currentSeasonOpsPlusRank}` }
									: {}}
								isRetired={advancedStats.isRetired}
								progressContext={activeSeasonStats?.atBats}
								tooltipText={isCareerMode
									? 'Park-adjusted offensive production over their career. 100 is league average; a 150 score means the hitter was 50% better than the rest of the league.'
									: 'Park-adjusted offensive production for this season. 100 is league average; a 150 score means the hitter was 50% better than the rest of the league.'}
							/>

							<StatBox
								label={isCareerMode ? 'Career ERA+' : `${userSelectedYear} ERA+`}
								abbr="ERA+"
								percentile={isCareerMode
									? advancedStats.careerEraPlus
									: advancedStats.currentSeasonEraPlus}
								rank={!isCareerMode && advancedStats.currentSeasonEraPlusRank !== 'N/A'
									? `#${advancedStats.currentSeasonEraPlusRank}`
									: undefined}
								isRetired={advancedStats.isRetired}
								progressContext={activePitchingStats?.inningsPitched}
								tooltipText={isCareerMode
									? 'Park and league-adjusted pitching efficiency for their career. 100 is perfectly average; higher numbers are better (e.g., 125 means 25% better at preventing runs).'
									: 'Park and league-adjusted pitching efficiency for this season. 100 is perfectly average; higher numbers are better (e.g., 125 means 25% better at preventing runs).'}
							/>

							{#if pitcherAdvanced && activePitchingStats?.inningsPitched > 9}
								{@const eraDisplay =
									activePitchingStats?.era != null
										? (typeof activePitchingStats.era === 'number'
												? activePitchingStats.era
												: parseFloat(activePitchingStats.era)
											).toFixed(2)
										: 'N/A'}
								<StatBoxStandardDual
									label="ERA"
									abbr="ERA"
									stat={eraDisplay}
									label2="FIP"
									abbr2="FIP"
									stat2={pitcherAdvanced.fip.toFixed(2)}
									tooltipText="ERA measures actual runs allowed per nine innings, while FIP estimates the runs a pitcher 'should' have allowed based only on events they control (strikeouts, walks, hit-by-pitches, home runs). A large gap between them hints at good or bad luck. Lower is better for both."
								/>
							{/if}

							{#if activeSeasonStats && activeSeasonStats?.plateAppearances > 19}
								{@const avgDisplay =
									activeSeasonStats.avg != null
										? (typeof activeSeasonStats.avg === 'number'
												? activeSeasonStats.avg
												: parseFloat(activeSeasonStats.avg)
											).toFixed(3)
											.replace(/^0/, '')
										: 'N/A'}
								{@const opsDisplay =
									activeSeasonStats.ops != null
										? (typeof activeSeasonStats.ops === 'number'
												? activeSeasonStats.ops
												: parseFloat(activeSeasonStats.ops)
											).toFixed(3)
											.replace(/^0/, '')
										: 'N/A'}
								<StatBoxStandardDual
									label="AVG"
									abbr="AVG"
									stat={avgDisplay}
									label2="OPS"
									abbr2="OPS"
									stat2={opsDisplay}
									tooltipText="Batting Average measures how often a batter gets a hit per at-bat (H / AB). OPS combines On-Base Percentage and Slugging Percentage into one number that captures both contact and power. Both are standard measures of offensive production."
								/>
							{/if}
						</div>
					{/if}
					{#if !isCareerMode && !isDateFilterActive && (isBattingPercentileStatsLoading || battingStatcast?.runValues?.runs_all !== undefined || battingStatcast?.baserunningRunValues?.runs_all !== undefined || battingStatcast?.pitcherRunValues?.runs_all !== undefined || battingStatcast?.fieldingRunValues?.total_runs !== undefined)}
						<wa-divider></wa-divider>
						<div class="horizontal-wrapper">
							<h3>{userSelectedYear} Run Values</h3>
							<wa-divider orientation="vertical" id="verticalDividers"></wa-divider>
							<wa-badge variant="neutral" appearance="outlined"
								>not filterable by team or custom date range</wa-badge
							>
						</div>

						<div class="statcast-grid">
							{#if isBattingPercentileStatsLoading}
								<StatcastStatBarSkeleton label="Batting Run Value" />
								<StatcastStatBarSkeleton label="Pitching Run Value" />
								<StatcastStatBarSkeleton label="Fielding Run Value" />
								<StatcastStatBarSkeleton label="Baserunning Run Value" />
							{:else}
								{#if battingStatcast.runValues && activeSeasonStats?.plateAppearances > 19}
									<StatcastStatBar
										label="Batting Run Value"
										stat={battingStatcast.runValues?.runs_all}
										percentile={battingStatcast.percentiles?.bat_run_val}
										decimals={1}
										runValue={true}
										tooltipText="Total run value contributed across all batting outcomes according to statcast data. A value of 0 is league average."
									/>
								{/if}

								{#if battingStatcast.pitcherRunValues && activePitchingStats?.inningsPitched > 9}
									<StatcastStatBar
										label="Pitching Run Value"
										stat={battingStatcast.pitcherRunValues?.runs_all}
										percentile={battingStatcast.pitcherPercentiles?.pitch_run_val}
										decimals={1}
										runValue={true}
										tooltipText="Total run value contributed across all pitching outcomes according to statcast data. A value of 0 is league average."
									/>
								{/if}

								{#if battingStatcast.fieldingRunValues}
									<StatcastStatBar
										label="Fielding Run Value"
										stat={battingStatcast.fieldingRunValues?.total_runs}
										percentile={battingStatcast.percentiles?.total_runs}
										decimals={1}
										runValue={true}
										tooltipText="Total run value contributed across all fielding outcomes according to statcast data. A value of 0 is league average."
									/>
								{/if}

								{#if battingStatcast.baserunningRunValues}
									<StatcastStatBar
										label="Baserunning Run Value"
										stat={battingStatcast.baserunningRunValues?.runner_runs_tot}
										percentile={battingStatcast.percentiles?.base_run_val}
										decimals={1}
										runValue={true}
										tooltipText="Total run value contributed across all baserunning outcomes according to statcast data. A value of 0 is league average."
									/>
								{/if}
							{/if}
						</div>
					{/if}

					{#if !isCareerMode && isDateFilterActive}
						<div class="horizontal-wrapper">
							<h3>Last {selectedRangeLabel}</h3>
						</div>
					{:else if !isCareerMode && !isDateFilterActive}
						<wa-divider></wa-divider>
						<div class="horizontal-wrapper">
							<h3>{userSelectedYear} Basics</h3>
						</div>
					{:else}
						<wa-divider></wa-divider>
						<div class="horizontal-wrapper">
							<h3>Career Basics</h3>
						</div>
					{/if}

					<!-- HITTING STATS BLOCK -->
					<div class="overview-boxes-wrapper-standard">
						{#if activeSeasonStats && activeSeasonStats.atBats > 0}
							{#each standardBattingConfig.filter((s) => s.category === 'standard') as stat}
								{@const rawValue = activeSeasonStats?.[stat.key]}
								{#if rawValue !== undefined && rawValue !== null}
									{@const formattedValue = ['avg', 'obp', 'slg', 'ops'].includes(stat.key)
										? (typeof rawValue === 'number' ? rawValue : parseFloat(rawValue))
												.toFixed(3)
												.replace(/^0/, '')
										: rawValue}

									<StatBoxStandard
										label={stat.label}
										abbr={stat.abbr}
										stat={formattedValue}
										tooltipText={stat.description}
									/>
								{/if}
							{/each}
						{/if}

						<!-- PITCHING STATS BLOCK -->
						{#if pitchingStatsBlock?.splits?.length > 0}
							{#each standardPitchingConfig.filter((s) => s.category === 'standard') as stat}
								{@const rawValue = activePitchingStats?.[stat.key]}
								{#if rawValue !== undefined && rawValue !== null}
									{@const formattedValue = ['era'].includes(stat.key)
										? (typeof rawValue === 'number' ? rawValue : parseFloat(rawValue)).toFixed(2)
										: ['ops', 'obp', 'avg', 'whip'].includes(stat.key)
											? (typeof rawValue === 'number' ? rawValue : parseFloat(rawValue))
													.toFixed(3)
													.replace(/^0/, '')
											: ['strikeoutsPer9Inn', 'walksPer9Inn'].includes(stat.key)
												? (typeof rawValue === 'number' ? rawValue : parseFloat(rawValue)).toFixed(
														2
													)
												: rawValue}

									<StatBoxStandardPitching
										label={stat.label}
										abbr={stat.abbr}
										stat={formattedValue}
										tooltipText={stat.description}
									/>
								{/if}
							{/each}
						{/if}
					</div>
				</div>
			</wa-tab-panel>

			<wa-tab-panel name="batting">
				<wa-tooltip for="battingExplanation">
					93 would mean a player is in the top 7 percent of MLB players in that category. 50 is
					always going to be the league average.
				</wa-tooltip>
				<div class="horizontal-wrapper">
					<h3 id="battingExplanation" class="help-trigger">Advanced Batting</h3>
					<wa-divider orientation="vertical" id="verticalDividers"></wa-divider>
					<wa-badge variant="brand" appearance="filled">Higher number is better</wa-badge>
					<wa-divider orientation="vertical" id="verticalDividers"></wa-divider>
					<wa-badge variant="neutral" appearance="outlined"
						>not filterable by team or custom date range</wa-badge
					>
				</div>

				{#if isBattingPercentileStatsLoading}
					{@render statcastSkeletonGrid(
						battingStatConfig,
						['expected', 'complete', 'discipline'],
						true
					)}
				{:else if battingStatcast && hasBattingStatcast}
					<div class="statcast-grid">
						{#each battingStatConfig.filter((c) => c.category === 'expected') as conf (conf.key)}
							{@const percentileVal = battingStatcast.percentiles?.[conf.percentileKey ?? conf.key]}
							{@const statVal = conf.getValue(battingStatcast)}

							{#if percentileVal !== undefined && percentileVal !== null}
								<StatcastStatBar
									label={conf.label}
									stat={statVal ?? percentileVal}
									percentile={percentileVal}
									decimals={conf.decimals ?? 1}
									invertColor={false}
									tooltipText={conf.description}
									simple={conf.simple}
									runValue={conf.runValue ?? false}
								/>
							{:else}
								<StatcastStatBarSkeleton label={conf.label} tooltipText={conf.description} />
							{/if}
						{/each}
					</div>
					<wa-divider></wa-divider>
					<div class="statcast-grid">
						{#each battingStatConfig.filter((c) => c.category === 'complete') as conf (conf.key)}
							{@const percentileVal = battingStatcast.percentiles?.[conf.percentileKey ?? conf.key]}
							{@const statVal = conf.getValue(battingStatcast)}

							{#if percentileVal !== undefined && percentileVal !== null}
								<StatcastStatBar
									label={conf.label}
									stat={statVal ?? percentileVal}
									percentile={percentileVal}
									decimals={conf.decimals ?? 1}
									invertColor={false}
									tooltipText={conf.description}
									simple={false}
									runValue={conf.runValue ?? false}
								/>
							{:else}
								<StatcastStatBarSkeleton label={conf.label} tooltipText={conf.description} />
							{/if}
						{/each}
					</div>
					<wa-divider></wa-divider>
					<div class="statcast-grid">
						{#each battingStatConfig.filter((c) => c.category === 'discipline') as conf (conf.key)}
							{@const percentileVal = battingStatcast.percentiles?.[conf.percentileKey ?? conf.key]}
							{@const statVal = conf.getValue(battingStatcast)}

							{#if percentileVal !== undefined && percentileVal !== null}
								<StatcastStatBar
									label={conf.label}
									stat={statVal ?? percentileVal}
									percentile={percentileVal}
									decimals={0}
									invertColor={false}
									tooltipText={conf.description}
									simple={true}
									runValue={conf.runValue ?? false}
								/>
							{:else}
								<StatcastStatBarSkeleton label={conf.label} tooltipText={conf.description} />
							{/if}
						{/each}
					</div>
					<wa-divider></wa-divider>
					<div class="statcast-grid">
						{#each battingStatConfig.filter((c) => c.category === 'running') as conf (conf.key)}
							{@const percentileVal = battingStatcast.percentiles?.[conf.percentileKey ?? conf.key]}
							{@const statVal = conf.getValue(battingStatcast)}

							{#if percentileVal !== undefined && percentileVal !== null}
								<StatcastStatBar
									label={conf.label}
									stat={statVal ?? percentileVal}
									percentile={percentileVal}
									decimals={0}
									invertColor={false}
									tooltipText={conf.description}
									simple={true}
									runValue={conf.runValue ?? false}
								/>
							{:else}
								<StatcastStatBarSkeleton label={conf.label} tooltipText={conf.description} />
							{/if}
						{/each}
					</div>
				{:else}
					{@render statcastSkeletonGrid(
						battingStatConfig,
						['expected', 'complete', 'discipline', 'running'],
						false
					)}
				{/if}

				<wa-divider class="section-divider"></wa-divider>

				<div class="horizontal-wrapper">
					{#if !isCareerMode && !isDateFilterActive}
						<h3 id="battingExplanationStandard">{userSelectedYear} Batting</h3>
					{:else if isDateFilterActive}
						<h3 id="battingExplanationStandard">Last {selectedRangeLabel} Batting</h3>
					{:else}
						<h3 id="battingExplanationStandard">Career Batting</h3>
					{/if}
				</div>

				{#if activeSeasonStats && activeSeasonStats.atBats > 0}
					<div class="stats-grid-container">
						<div class="stats-column">
							<div class="category-heading-wrapper"><h4 class="category-heading">Standard</h4></div>
							<div class="wa-stack" style="gap: 0px">
								{#each standardBattingConfig.filter((s) => s.category === 'standard') as stat}
									{@const rawValue = activeSeasonStats?.[stat.key]}
									{#if rawValue !== undefined && rawValue !== null}
										{@const formattedValue = ['avg', 'obp', 'slg', 'ops'].includes(stat.key)
											? (typeof rawValue === 'number' ? rawValue : parseFloat(rawValue))
													.toFixed(3)
													.replace(/^0/, '')
											: rawValue}
										<div id="stat-pill-{stat.key}">
											<StatPill
												label={stat.label}
												abbr={stat.abbr}
												percentile={formattedValue}
												tooltipText={stat.description}
											/>
										</div>
									{:else}
										<StatPill label={stat.label} abbr={stat.abbr} percentile="-.--" />
									{/if}
								{/each}
							</div>
						</div>
						<wa-divider orientation="vertical" class="grid-desktop-divider"></wa-divider>
						<div class="stats-column">
							<div class="category-heading-wrapper"><h4 class="category-heading">Counting</h4></div>
							<div class="wa-stack" style="gap: 0px">
								{#each standardBattingConfig.filter((s) => s.category === 'counting') as stat}
									{#if activeSeasonStats?.[stat.key] !== undefined && activeSeasonStats?.[stat.key] !== null}
										<StatPill
											abbr={stat.abbr}
											label={stat.label}
											percentile={activeSeasonStats[stat.key]}
											tooltipText={stat.description}
										/>
									{:else}
										<StatPill label={stat.label} abbr={stat.abbr} percentile="N/A" />
									{/if}
								{/each}
							</div>
						</div>
						<wa-divider orientation="vertical" class="grid-desktop-divider"></wa-divider>
						<div class="stats-column">
							<div class="category-heading-wrapper">
								<h4 class="category-heading">Situational</h4>
							</div>
							<div class="wa-stack" style="gap: 0px">
								{#each standardBattingConfig.filter((s) => s.category === 'situational') as stat}
									{#if activeSeasonStats?.[stat.key] !== undefined && activeSeasonStats?.[stat.key] !== null}
										<StatPill
											abbr={stat.abbr}
											label={stat.label}
											percentile={activeSeasonStats[stat.key]}
											tooltipText={stat.description}
										/>
									{:else}
										<StatPill label={stat.label} abbr={stat.abbr} percentile="N/A" />
									{/if}
								{/each}
							</div>
						</div>
					</div>
				{:else}
					<p>No hitting records found for this player.</p>
				{/if}
			</wa-tab-panel>

			<wa-tab-panel name="pitching">
				<wa-tooltip for="pitchingExplanation">
					93 would mean a player is in the top 7 percent of MLB players in that category. 50 is
					always going to be the league average.
				</wa-tooltip>
				<div class="horizontal-wrapper">
					<h3 id="pitchingExplanation" class="help-trigger">Advanced Pitching</h3>
					<wa-divider orientation="vertical" id="verticalDividers"></wa-divider>
					<wa-badge variant="brand" appearance="filled">Higher percentile is better</wa-badge>
					<wa-divider orientation="vertical" id="verticalDividers"></wa-divider>
					<wa-badge variant="neutral" appearance="outlined"
						>not filterable by team or custom date range</wa-badge
					>
				</div>

				{#if isPitchingPercentileStatsLoading}
					{@render statcastSkeletonGrid(
						pitchingStatsConfig,
						['expected', 'discipline', 'quality_of_contact', 'pitch_metrics', 'run_value'],
						true
					)}
				{:else if pitchingStatcast && hasPitcherPercentiles}
					<div class="statcast-grid">
						{#each pitchingStatsConfig.filter((c) => c.category === 'expected') as conf (conf.key)}
							{@const percentileVal =
								pitchingStatcast.pitcherPercentiles?.[conf.percentileKey ?? conf.key]}
							{@const statVal = conf.getValue(pitchingStatcast)}

							{#if percentileVal !== undefined && percentileVal !== null}
								<StatcastStatBar
									label={conf.label}
									stat={statVal ?? percentileVal}
									percentile={percentileVal}
									decimals={conf.decimals ?? 1}
									invertColor={false}
									tooltipText={conf.description}
									simple={conf.simple}
									runValue={conf.runValue ?? false}
								/>
							{:else}
								<StatcastStatBarSkeleton label={conf.label} tooltipText={conf.description} />
							{/if}
						{/each}
					</div>
					<wa-divider></wa-divider>
					<div class="statcast-grid">
						{#each pitchingStatsConfig.filter((c) => c.category === 'discipline') as conf (conf.key)}
							{@const percentileVal =
								pitchingStatcast.pitcherPercentiles?.[conf.percentileKey ?? conf.key]}
							{@const statVal = conf.getValue(pitchingStatcast)}

							{#if percentileVal !== undefined && percentileVal !== null}
								<StatcastStatBar
									label={conf.label}
									stat={statVal ?? percentileVal}
									percentile={percentileVal}
									decimals={0}
									invertColor={false}
									tooltipText={conf.description}
									simple={true}
									runValue={conf.runValue ?? false}
								/>
							{:else}
								<StatcastStatBarSkeleton label={conf.label} tooltipText={conf.description} />
							{/if}
						{/each}
					</div>
					<wa-divider></wa-divider>
					<div class="statcast-grid">
						{#each pitchingStatsConfig.filter((c) => c.category === 'quality_of_contact') as conf (conf.key)}
							{@const percentileVal =
								pitchingStatcast.pitcherPercentiles?.[conf.percentileKey ?? conf.key]}
							{@const statVal = conf.getValue(pitchingStatcast)}

							{#if percentileVal !== undefined && percentileVal !== null}
								<StatcastStatBar
									label={conf.label}
									stat={statVal ?? percentileVal}
									percentile={percentileVal}
									decimals={conf.decimals ?? 1}
									invertColor={false}
									tooltipText={conf.description}
									simple={false}
									runValue={conf.runValue ?? false}
								/>
							{:else}
								<StatcastStatBarSkeleton label={conf.label} tooltipText={conf.description} />
							{/if}
						{/each}
					</div>
					<wa-divider></wa-divider>
					<div class="statcast-grid">
						{#each pitchingStatsConfig.filter((c) => c.category === 'pitch_metrics') as conf (conf.key)}
							{@const percentileVal =
								pitchingStatcast.pitcherPercentiles?.[conf.percentileKey ?? conf.key]}
							{@const statVal = conf.getValue(pitchingStatcast)}

							{#if percentileVal !== undefined && percentileVal !== null}
								<StatcastStatBar
									label={conf.label}
									stat={statVal ?? percentileVal}
									percentile={percentileVal}
									decimals={0}
									invertColor={false}
									tooltipText={conf.description}
									simple={true}
									runValue={conf.runValue ?? false}
								/>
							{:else}
								<StatcastStatBarSkeleton label={conf.label} tooltipText={conf.description} />
							{/if}
						{/each}
					</div>
				{:else}
					{@render statcastSkeletonGrid(
						pitchingStatsConfig,
						['expected', 'discipline', 'quality_of_contact', 'pitch_metrics', 'run_value'],
						false
					)}
				{/if}
				<wa-divider class="section-divider"></wa-divider>
				<div class="horizontal-wrapper">
					{#if !isCareerMode && !isDateFilterActive}
						<h3 id="pitchingExplanationStandard">{userSelectedYear} Pitching</h3>
					{:else if isDateFilterActive}
						<h3 id="pitchingExplanationStandard">Last {selectedRangeLabel} Pitching</h3>
					{:else}
						<h3 id="pitchingExplanationStandard">Career Pitching</h3>
					{/if}
				</div>

				{#if pitchingStatsBlock?.splits?.length > 0}
					<div class="stats-grid-container">
						<div class="stats-column">
							<div class="category-heading-wrapper"><h4 class="category-heading">Standard</h4></div>
							<div class="wa-stack" style="gap: 0px">
								{#each standardPitchingConfig.filter((s) => s.category === 'standard') as stat}
									{@const rawValue = activePitchingStats?.[stat.key]}
									{#if rawValue !== undefined && rawValue !== null}
										{@const formattedValue = ['era'].includes(stat.key)
											? (typeof rawValue === 'number' ? rawValue : parseFloat(rawValue)).toFixed(2)
											: ['ops', 'obp', 'avg', 'whip'].includes(stat.key)
												? (typeof rawValue === 'number' ? rawValue : parseFloat(rawValue))
														.toFixed(3)
														.replace(/^0/, '')
												: ['strikeoutsPer9Inn', 'walksPer9Inn'].includes(stat.key)
													? (typeof rawValue === 'number'
															? rawValue
															: parseFloat(rawValue)
														).toFixed(2)
													: rawValue}
										<div id="stat-pill-{stat.key}">
											<StatPill
												label={stat.label}
												abbr={stat.abbr}
												percentile={formattedValue}
												tooltipText={stat.description}
											/>
										</div>
									{:else}
										<StatPill label={stat.label} abbr={stat.abbr} percentile="-.--" />
									{/if}
								{/each}
							</div>
						</div>

						<wa-divider orientation="vertical" class="grid-desktop-divider"></wa-divider>

						<div class="stats-column">
							<div class="category-heading-wrapper"><h4 class="category-heading">Counting</h4></div>
							<div class="wa-stack" style="gap: 0px">
								{#each standardPitchingConfig.filter((s) => s.category === 'counting') as stat}
									{#if activePitchingStats?.[stat.key] !== undefined && activePitchingStats?.[stat.key] !== null}
										<StatPill
											abbr={stat.abbr}
											label={stat.label}
											percentile={activePitchingStats[stat.key]}
											tooltipText={stat.description}
										/>
									{:else}
										<StatPill label={stat.label} abbr={stat.abbr} percentile="N/A" />
									{/if}
								{/each}
							</div>
						</div>
					</div>
				{:else}
					<p>No pitching records found for this player.</p>
				{/if}
			</wa-tab-panel>

			<wa-tab-panel name="fielding">
				<wa-tooltip for="fieldingExplanation">
					93 would mean a player is in the top 7 percent of MLB players in that category. 50 is
					always going to be the league average.
				</wa-tooltip>
				<div class="horizontal-wrapper">
					<h3 id="fieldingExplanation" class="help-trigger">Advanced Fielding</h3>
					<wa-divider orientation="vertical" id="verticalDividers"></wa-divider>
					<wa-badge variant="brand" appearance="filled">Higher number is better</wa-badge>
					<wa-divider orientation="vertical" id="verticalDividers"></wa-divider>
					<wa-badge variant="neutral" appearance="outlined"
						>not filterable by team or custom date range</wa-badge
					>
				</div>

				{#if isFieldingPercentileStatsLoading}
					{@render statcastSkeletonGrid(fieldingStatcastConfig, ['defense'], true)}
				{:else if fieldingStatcast && hasFieldingStatcast}
					<div class="statcast-grid">
						{#each fieldingStatcastConfig.filter((c) => c.category === 'overall' || c.category === 'defense') as conf (conf.key)}
							{@const percentileVal =
								fieldingStatcast.percentiles?.[conf.percentileKey ?? conf.key]}
							{@const statVal = conf.getValue(fieldingStatcast)}

							{#if statVal !== undefined && statVal !== null}
								<StatcastStatBar
									label={conf.label}
									stat={statVal}
									decimals={conf.decimals ?? 1}
									percentile={percentileVal}
									runValue={conf.runValue ?? false}
									tooltipText={conf.description}
									simple={conf.simple ?? (percentileVal === undefined || percentileVal === null)}
								/>
							{:else}
								<StatcastStatBarSkeleton label={conf.label} tooltipText={conf.description} />
							{/if}
						{/each}
					</div>

					<wa-divider></wa-divider>

					<div class="statcast-grid">
						{#each fieldingStatcastConfig.filter((c) => c.category === 'strength') as conf (conf.key)}
							{@const percentileVal = fieldingStatcast.percentiles?.[conf.percentileKey]}
							{@const statVal = conf.getValue(fieldingStatcast)}

							{#if statVal !== undefined && statVal !== null}
								<StatcastStatBar
									label={conf.label}
									decimals={conf.decimals ?? 1}
									stat={statVal}
									percentile={statVal}
									runValue={conf.runValue ?? false}
									tooltipText={conf.description}
									simple={conf.simple ?? (percentileVal === undefined || percentileVal === null)}
								/>
							{:else}
								<StatcastStatBarSkeleton label={conf.label} tooltipText={conf.description} />
							{/if}
						{/each}
					</div>

					{#if fieldingStatcastConfig.some((c) => c.category === 'catcher' && c.getValue(fieldingStatcast) !== null && c.getValue(fieldingStatcast) !== undefined)}
						<wa-divider></wa-divider>
						<div class="statcast-grid">
							{#each fieldingStatcastConfig.filter((c) => c.category === 'catcher') as conf (conf.key)}
								{@const percentileVal =
									fieldingStatcast.percentiles?.[conf.percentileKey ?? conf.key]}
								{@const statVal = conf.getValue(fieldingStatcast)}

								{#if statVal !== undefined && statVal !== null}
									<StatcastStatBar
										label={conf.label}
										stat={statVal}
										decimals={conf.decimals ?? 0}
										runValue={conf.runValue ?? false}
										tooltipText={conf.description}
										simple={conf.simple ?? (percentileVal === undefined || percentileVal === null)}
									/>
								{:else}
									<StatcastStatBarSkeleton label={conf.label} tooltipText={conf.description} />
								{/if}
							{/each}
						</div>
					{/if}
				{:else}
					{@render statcastSkeletonGrid(fieldingStatcastConfig, ['defense'], false)}
				{/if}

				<wa-divider class="section-divider"></wa-divider>

				<div class="horizontal-wrapper">
					{#if !isCareerMode && !isDateFilterActive}
						<h3 id="fieldingExplanationStandard">{userSelectedYear} Fielding</h3>
					{:else if isDateFilterActive}
						<h3 id="fieldingExplanationStandard">Last {selectedRangeLabel} Fielding</h3>
					{:else}
						<h3 id="fieldingExplanationStandard">Career Fielding</h3>
					{/if}
					<wa-divider orientation="vertical" id="verticalDividers"></wa-divider>

					<div class="dropdown-and-switch-wrapper">
						<wa-select
							id="fieldingPositionSelector"
							value={userSelectedFieldingPosition}
							disabled={availableFieldingPositions.length <= 1 || null}
							class="position-dropdown"
							size="s"
							onchange={(e) => {
								userSelectedFieldingPosition = e.target.value;
							}}
						>
							<wa-option value="ALL"> All </wa-option>
							{#each availableFieldingPositions as pos}
								<wa-option value={pos}>
									{pos}
								</wa-option>
							{/each}
						</wa-select>
					</div>
				</div>

				{#if fieldingStatsBlock?.splits?.length > 0}
					<div class="stats-grid-container">
						<div class="stats-column">
							<div class="category-heading-wrapper"><h4 class="category-heading">Standard</h4></div>
							<div class="wa-stack" style="gap: 0px">
								{#each standardFieldingStatsConfig.filter((s) => s.category === 'standard') as stat}
									{@const rawValue = activeFieldingStats?.[stat.key]}
									{#if rawValue !== undefined && rawValue !== null}
										{@const formattedValue =
											stat.key === 'fielding'
												? (typeof rawValue === 'number' ? rawValue : parseFloat(rawValue)).toFixed(
														3
													)
												: (typeof rawValue === 'number' ? rawValue : parseFloat(rawValue)).toFixed(
														2
													)}
										<div id="stat-pill-{stat.key}">
											<StatPill
												label={stat.label}
												abbr={stat.abbr}
												percentile={formattedValue}
												tooltipText={stat.description}
											/>
										</div>
									{:else}
										<StatPill label={stat.label} abbr={stat.abbr} percentile="-.--" />
									{/if}
								{/each}
							</div>
						</div>

						<wa-divider orientation="vertical" class="grid-desktop-divider"></wa-divider>

						<div class="stats-column">
							<div class="category-heading-wrapper"><h4 class="category-heading">Counting</h4></div>
							<div class="wa-stack" style="gap: 0px">
								{#each standardFieldingStatsConfig.filter((s) => s.category === 'counting') as stat}
									{#if activeFieldingStats?.[stat.key] !== undefined && activeFieldingStats?.[stat.key] !== null}
										<StatPill
											abbr={stat.abbr}
											label={stat.label}
											percentile={activeFieldingStats[stat.key]}
											tooltipText={stat.description}
										/>
									{:else}
										<StatPill label={stat.label} abbr={stat.abbr} percentile="N/A" />
									{/if}
								{/each}
							</div>
						</div>
					</div>
				{:else}
					<p>No fielding records found for this player.</p>
				{/if}
			</wa-tab-panel>

			<wa-tab-panel name="awards">
				<div class="horizontal-wrapper">
					<h3>Player Awards</h3>
				</div>
				{#if processedAccolades.length > 0}
					<div class="accolades-list">
						{#each processedAccolades as honor}
							<div class="honor-card">
								<div>
									<strong class="honor-label">{honor.label}</strong>
									<span class="honor-count">({honor.count}x)</span>
								</div>
								<div class="honor-badges-wrapper">
									{#each honor.seasons as yr}
										<wa-badge appearance="filled" variant={honor.rank <= 4 ? 'brand' : 'neutral'}
											>{yr}</wa-badge
										>
									{/each}
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<p>This player has not received any tracked MLB honors or awards.</p>
				{/if}
			</wa-tab-panel>
		</wa-tab-group>
	{/key}
{/if}

<style>
	.status-message {
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: 400px;
		font-size: 1.15rem;
		color: var(--wa-color-neutral-on-quiet);
	}

	.player-info-box {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		margin-bottom: 1.5rem;
		justify-content: center;
	}
	.player-name-and-team-wrapper {
		display: flex;
		align-items: center;
	}
	.player-name-and-team-wrapper .wa-heading-xl {
		margin-right: 0.5rem;
	}
	wa-badge {
		min-height: 22.6px;
		white-space: nowrap;
		min-width: min-content;
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

	.overview-boxes-wrapper-standard, .overview-boxes-wrapper {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 312px));
		gap: 1rem;
	}

	.dropdown-and-switch-wrapper {
		display: flex;
		align-items: center;
		gap: 1.5rem;
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

	.team-logo-name-wrapper:active {
		cursor: pointer;
		background-color: var(--wa-color-neutral-fill-normal);
		transform: scale(0.95);
		transition: all 100ms ease;
		text-decoration: underline;
	}

	#debut-wrapper {
		cursor: default;
		display: flex;
		align-items: center;
		gap: 4px;
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
	.horizontal-wrapper {
		display: flex;
		align-items: center;
		margin: 1rem 0 1rem 0;
		height: 40px;
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

	.details-filters-wrapper {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-bottom: 1.5rem;
		height: 4rem;
	}
	.small-details-wrapper {
		display: flex;
		align-items: center;
		gap: 0;
	}

	.filter-controls-group {
		display: flex;
		width: min-content;
		justify-content: flex-end;
		gap: 1rem;
		align-items: center;
	}

	.date-range-inputs {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.filter-controls-group wa-select,
	.filter-controls-group wa-switch {
		white-space: nowrap;
	}

	.small-details-wrapper p {
		margin: 0px;
		white-space: nowrap;
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
	.debut-arrow {
		font-size: 12px;
	}
	.help-trigger {
		cursor: help;
	}

	.section-divider {
		margin: 3rem 0 3rem 0;
	}

	.accolades-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin-top: 1rem;
	}
	.honor-card {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem;
		border: 1px solid var(--wa-color-border-quiet);
		border-radius: var(--wa-border-radius-m);
	}
	.honor-label {
		font-size: 1.1rem;
	}
	.honor-count {
		color: var(--wa-color-gray-40);
		margin-left: 0.5rem;
	}
	.honor-badges-wrapper {
		display: flex;
		gap: 0.25rem;
		flex-wrap: wrap;
	}

	.statcast-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
	}

	@media (max-width: 1600px) {
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

	@media (max-width: 1300px) {
		.overview-boxes-wrapper-standard, .overview-boxes-wrapper {
			grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
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

	@media (max-width: 930px) {
		.statcast-grid {
			flex-direction: column;
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
	}

	@media (max-width: 768px) {
		.player-info-box {
			align-items: center;
		}

		.player-name-and-team-wrapper {
			flex-direction: column;
			align-items: center;
			gap: 1rem;
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
