<script>
	import { fetchPybaseball } from '$lib/pybaseball.js';
	import { advancedStats, loadAdvancedMetrics } from '$lib/warStore.svelte.js';
	import { getPlayerPictureLarge } from '../../../api/getPlayerPicture';
	import { getPlayerInfo } from '../../../api/getPlayerInfo';
	import { getTeamLogo } from '../../../api/getTeamLogo';
	import { getPlayerBattingPercentileStats } from '../../../api/getPlayerBattingPercentile';
	import { standardBattingConfig } from '../../../formatters/standardBattingStatsConfig';
	import { battingStatConfig } from '../../../formatters/battingStatsConfig';
	import { processPlayerAwards } from '../../../formatters/playerAwardFormatter';
	import { standardPitchingConfig } from '../../../formatters/standardPitchingStatsConfig';
	import { sumInningsPitched } from '../../../formatters/addInningsPitched';
	import { standardFieldingStatsConfig } from '../../../formatters/fieldingStatsConfig';
	import { getSeasonProgressPercentage } from '../../../formatters/getSeasonProgressPercentage';
	import { page } from '$app/stores';
	import { onMount, untrack } from 'svelte';

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
	import StatBox from '$lib/components/statBox.svelte';
	import StatBoxStandard from '$lib/components/statBoxStandard.svelte';
	import StatBoxStandardPitching from '$lib/components/statBoxStandardPitching.svelte';

	const seasonProgress = $derived.by(() => getSeasonProgressPercentage());

	let playerData = $state(null);
	let loading = $state(true);
	let errorMsg = $state('');
	let bbrefId = $state('');
	let imgLoading = $state(true);

	let battingPercentileStats = $state(null);
	let isBattingPercentileStatsLoading = $state(false);

	let userSelectedYear = $state(new Date().getFullYear().toString());
	let isCareerMode = $state(false);

	let userSelectedFieldingPosition = $state('ALL');
	let hasDefaultedViewMode = $state(false);
	let advancedDisplayMode = $state('season');
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

		async function loadProfile() {
			loading = true;
			errorMsg = '';
			try {
				const info = await getPlayerInfo(id);
				playerData = info;

				console.log('DEBUG 1 -> Full API payload response:', info);

				const lookupRes = await fetchPybaseball('playerid_reverse_lookup', {
					player_ids: [id],
					key_type: 'mlbam'
				});
				bbrefId = lookupRes?.[0]?.key_bbref || '';

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
		const id = $page.params.id;
		const targetYear = userSelectedYear || new Date().getFullYear().toString();

		if (id) {
			loadAdvancedMetrics(id, targetYear);
		}
	});

	let playerProfile = $derived(playerData?.people?.[0] || null);

	let teamLogoUrl = $derived.by(() => {
		const teamId = playerProfile?.currentTeam?.id;
		return teamId ? getTeamLogo(teamId) : '';
	});

	let processedAccolades = $derived(processPlayerAwards(playerProfile?.awards || []));

	let hittingStatsBlock = $derived.by(() => {
		if (!playerProfile?.stats) return null;
		return playerProfile.stats.find((s) => {
			const groupName = (s.group?.name || s.group?.displayName || '').toLowerCase();
			const typeName = (s.type?.code || s.type?.displayName || '').toLowerCase();
			return groupName === 'hitting' && typeName === 'yearbyyear';
		});
	});

	let careerStatsBlock = $derived.by(() => {
		if (!playerProfile?.stats) return null;
		return playerProfile.stats.find((s) => {
			const groupName = (s.group?.name || s.group?.displayName || '').toLowerCase();
			const typeName = (s.type?.code || s.type?.displayName || '').toLowerCase();
			return groupName === 'hitting' && typeName === 'career';
		});
	});

	let pitchingStatsBlock = $derived.by(() => {
		if (!playerProfile?.stats) return null;
		return playerProfile.stats.find((s) => {
			const groupName = (s.group?.name || s.group?.displayName || '').toLowerCase();
			const typeName = (s.type?.code || s.type?.displayName || '').toLowerCase();
			return groupName === 'pitching' && typeName === 'yearbyyear';
		});
	});

	let careerPitchingStatsBlock = $derived.by(() => {
		if (!playerProfile?.stats) return null;
		return playerProfile.stats.find((s) => {
			const groupName = (s.group?.name || s.group?.displayName || '').toLowerCase();
			const typeName = (s.type?.code || s.type?.displayName || '').toLowerCase();
			return groupName === 'pitching' && typeName === 'career';
		});
	});

	let fieldingStatsBlock = $derived.by(() => {
		if (!playerProfile?.stats) return null;
		return playerProfile.stats.find((s) => {
			const groupName = (s.group?.name || s.group?.displayName || '').toLowerCase();
			const typeName = (s.type?.code || s.type?.displayName || '').toLowerCase();
			return groupName === 'fielding' && typeName === 'yearbyyear';
		});
	});

	let availableOverviewSeasons = $derived.by(() => {
		const hittingYears = hittingStatsBlock?.splits?.map((split) => split.season) || [];
		const pitchingYears = pitchingStatsBlock?.splits?.map((split) => split.season) || [];
		const fieldingYears = fieldingStatsBlock?.splits?.map((split) => split.season) || [];
		return [...new Set([...hittingYears, ...pitchingYears, ...fieldingYears])].sort(
			(a, b) => parseInt(b) - parseInt(a)
		);
	});

	let activeSeasonStats = $derived.by(() => {
		const currentYear = userSelectedYear;
		const careerModeActive = isCareerMode;

		if (careerModeActive) {
			return careerStatsBlock?.splits?.[0]?.stat || null;
		}
		if (!hittingStatsBlock?.splits) return null;

		const yearSplits = hittingStatsBlock.splits.filter((split) => split.season === currentYear);
		if (yearSplits.length === 0) return null;

		if (yearSplits.length === 1) return yearSplits[0].stat;

		const totalSplit = yearSplits.find(
			(split) =>
				!split.team || split.team?.id === undefined || String(split.team?.name).includes('teams')
		);

		return totalSplit ? totalSplit.stat : yearSplits[0].stat;
	});

	let activePitchingStats = $derived.by(() => {
		const currentYear = userSelectedYear;
		const careerModeActive = isCareerMode;

		if (careerModeActive) {
			return careerPitchingStatsBlock?.splits?.[0]?.stat || null;
		}
		if (!pitchingStatsBlock?.splits) return null;

		const yearSplits = pitchingStatsBlock.splits.filter((split) => split.season === currentYear);
		if (yearSplits.length === 0) return null;

		if (yearSplits.length === 1) return yearSplits[0].stat;

		const individualTeamStints = yearSplits.filter(
			(split) =>
				split.team &&
				split.team.id !== undefined &&
				!String(split.team.name).toLowerCase().includes('teams')
		);

		if (individualTeamStints.length === 0) return yearSplits[0].stat;
		if (individualTeamStints.length === 1) return individualTeamStints[0].stat;

		const aggregatedStat = { ...individualTeamStints[0].stat };

		const allIPs = individualTeamStints.map((split) => split.stat.inningsPitched);
		aggregatedStat.inningsPitched = sumInningsPitched(allIPs);

		const countingStats = [
			'gamesPlayed',
			'gamesStarted',
			'wins',
			'losses',
			'strikeOuts',
			'baseOnBalls',
			'hits',
			'runs',
			'earnedRuns'
		];

		countingStats.forEach((key) => {
			if (key in aggregatedStat) {
				aggregatedStat[key] = individualTeamStints.reduce(
					(sum, split) => sum + (split.stat[key] || 0),
					0
				);
			}
		});

		if (aggregatedStat.earnedRuns !== undefined && aggregatedStat.inningsPitched) {
			const [fullInnings, outs] = String(aggregatedStat.inningsPitched).split('.').map(Number);
			const totalInningsFloat = fullInnings + (outs || 0) / 3;

			if (totalInningsFloat > 0) {
				aggregatedStat.era = ((aggregatedStat.earnedRuns * 9) / totalInningsFloat).toFixed(2);
			}
		}

		return aggregatedStat;
	});

	let activeFieldingStats = $derived.by(() => {
		const currentYear = userSelectedYear;
		const careerModeActive = isCareerMode;
		const selectedPosition = userSelectedFieldingPosition;

		if (!fieldingStatsBlock?.splits) return null;

		let targetSplits = careerModeActive
			? fieldingStatsBlock.splits
			: fieldingStatsBlock.splits.filter((s) => s.season === currentYear);

		targetSplits = targetSplits.filter(
			(s) =>
				(s.position?.name || s.position?.displayName) !== 'Designated Hitter' &&
				s.position?.abbreviation !== 'DH'
		);

		if (selectedPosition !== 'ALL') {
			const positionAbbrevMap = {
				'Left Field': 'LF',
				'Center Field': 'CF',
				'Right Field': 'RF',
				Outfielder: 'OF'
			};
			const targetAbbrev = positionAbbrevMap[selectedPosition];

			targetSplits = targetSplits.filter((s) => {
				const name = s.position?.name || s.position?.displayName;
				const abbrev = s.position?.abbreviation;
				return name === selectedPosition || (targetAbbrev && abbrev === targetAbbrev);
			});
		}

		if (targetSplits.length === 0) return null;
		if (targetSplits.length === 1) return targetSplits[0].stat;

		const aggregated = {
			games: 0,
			gamesPlayed: 0,
			gamesStarted: 0,
			chances: 0,
			putOuts: 0,
			assists: 0,
			errors: 0,
			doublePlays: 0,
			triplePlays: 0,
			caughtStealing: 0,
			stolenBases: 0,
			passedBall: 0,
			throwingErrors: 0,
			innings: 0,
			catcherERA: 0,
			rangeFactorPerGame: 0,
			rangeFactorPer9Inn: 0,
			fielding: 0
		};

		let totalCatcherInnings = 0;

		targetSplits.forEach(({ stat }) => {
			if (!stat) return;
			aggregated.games += stat.games || 0;
			aggregated.gamesPlayed += stat.gamesPlayed || 0;
			aggregated.gamesStarted += stat.gamesStarted || 0;
			aggregated.chances += stat.chances || 0;
			aggregated.putOuts += stat.putOuts || 0;
			aggregated.assists += stat.assists || 0;
			aggregated.errors += stat.errors || 0;
			aggregated.doublePlays += stat.doublePlays || 0;
			aggregated.triplePlays += stat.triplePlays || 0;
			aggregated.caughtStealing += stat.caughtStealing || 0;
			aggregated.stolenBases += stat.stolenBases || 0;
			aggregated.passedBall += stat.passedBall || 0;
			aggregated.throwingErrors += stat.throwingErrors || 0;

			const innStr = String(stat.innings || '0');
			const [whole, partial] = innStr.split('.');
			let decimalInnings = parseInt(whole || 0);
			if (partial === '1') decimalInnings += 0.333;
			if (partial === '2') decimalInnings += 0.666;
			aggregated.innings += decimalInnings;

			if (stat.catcherERA && parseFloat(stat.catcherERA) > 0) {
				const cInn = parseFloat(stat.innings || 0);
				aggregated.catcherERA += parseFloat(stat.catcherERA) * cInn;
				totalCatcherInnings += cInn;
			}
		});

		if (aggregated.chances > 0) {
			aggregated.fielding = (
				(aggregated.putOuts + aggregated.assists) /
				aggregated.chances
			).toFixed(3);
		} else {
			aggregated.fielding = '.000';
		}

		if (aggregated.games > 0) {
			aggregated.rangeFactorPerGame = (
				(aggregated.putOuts + aggregated.assists) /
				aggregated.games
			).toFixed(2);
		}

		if (aggregated.innings > 0) {
			aggregated.rangeFactorPer9Inn = (
				((aggregated.putOuts + aggregated.assists) * 9) /
				aggregated.innings
			).toFixed(2);
		}

		if (totalCatcherInnings > 0 && !isNaN(aggregated.catcherERA)) {
			aggregated.catcherERA = (aggregated.catcherERA / totalCatcherInnings).toFixed(2);
		} else {
			aggregated.catcherERA = 'N/A';
		}

		if (totalCatcherInnings === 0) {
			aggregated.catcherERA = 'N/A';
			aggregated.passedBall = 'N/A';
			aggregated.caughtStealing = 'N/A';
			aggregated.stolenBases = 'N/A';
		}

		const wholeInnings = Math.floor(aggregated.innings);
		const remainder = aggregated.innings - wholeInnings;
		let partialStr = '0';
		if (remainder > 0.2 && remainder < 0.5) partialStr = '1';
		if (remainder > 0.5) partialStr = '2';
		aggregated.innings = `${wholeInnings}.${partialStr}`;

		return aggregated;
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

	let availableFieldingPositions = $derived.by(() => {
		const currentYear = userSelectedYear;
		const careerModeActive = isCareerMode;

		if (!fieldingStatsBlock?.splits) return [];
		const targetSplits = careerModeActive
			? fieldingStatsBlock.splits
			: fieldingStatsBlock.splits.filter((s) => s.season === currentYear);
		const positionMap = {
			LF: 'Left Field',
			CF: 'Center Field',
			RF: 'Right Field',
			OF: 'Outfielder'
		};

		const positions = targetSplits
			.map((s) => {
				const abbrev = s.position?.abbreviation;
				return positionMap[abbrev] || s.position?.name || s.position?.displayName;
			})
			.filter((posName) => posName && posName !== 'Designated Hitter');

		return [...new Set(positions)];
	});

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
		if (userSelectedYear) {
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
			!hasDefaultedViewMode
		) {
			untrack(() => {
				advancedDisplayMode = 'career';
				isCareerMode = true;
				hasDefaultedViewMode = true;
			});
		}
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

			<wa-switch
				size="s"
				checked={isCareerMode}
				onchange={(e) => (isCareerMode = e.target.checked)}
			>
				Career Stats
			</wa-switch>
		</div>
	</div>

	<wa-divider style="margin-top: 0px;"></wa-divider>

	{#key isDesktop}
		<wa-tab-group placement={isDesktop ? 'start' : 'top'}>
			<wa-tab panel="overview">Overview</wa-tab>
			<wa-tab panel="batting">Batting</wa-tab>
			<wa-tab panel="pitching">Pitching</wa-tab>
			<wa-tab panel="fielding">Fielding</wa-tab>
			<wa-tab panel="awards">Awards</wa-tab>

			<wa-tab-panel name="overview">
				<div class="advanced-tab-panel">
					<div class="horizontal-wrapper">
						<h3>Overview</h3>
					</div>

					<div class="overview-boxes-wrapper">
						{#if isCareerMode}
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

							{const currentYear = new Date().getFullYear()}
							<StatBox
								label="{userSelectedYear} bWAR"
								abbr="WAR"
								progressContext={String(userSelectedYear) === '2026' ? seasonProgress : undefined}
								percentile={advancedStats.currentSeasonWar}
								rank={advancedStats.currentSeasonWarRank
									? `#${advancedStats.currentSeasonWarRank}`
									: null}
								isRetired={advancedStats.isRetired}
								tooltipText="The total estimated wins a player added to their teams over a baseline replacement-level player throughout the selected season. 2.0+ is a solid starter, 5.0+ is an All-Star, and 8.0+ is an MVP-caliber performance. This stat is additive over the year. The percentage value is how far into the MLB season we are."
							/>
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
							tooltipText={isCareerMode
								? 'Park and league-adjusted pitching efficiency for their career. 100 is perfectly average; higher numbers are better (e.g., 125 means 25% better at preventing runs).'
								: 'Park and league-adjusted pitching efficiency for this season. 100 is perfectly average; higher numbers are better (e.g., 125 means 25% better at preventing runs).'}
						/>
					</div>
					<wa-divider></wa-divider>

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
				<div class="horizontal-wrapper">
					<h3 id="battingExplanationStandard">Batting Stats</h3>
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

				<wa-divider class="section-divider"></wa-divider>

				<wa-tooltip for="battingExplanation">
					93 would mean a player is in the top 7 percent of MLB players in that category. 50 is
					always going to be the league average.
				</wa-tooltip>
				<div class="horizontal-wrapper">
					<h3 id="battingExplanation" class="help-trigger">Batting Percentiles</h3>
					<wa-divider orientation="vertical" id="verticalDividers"></wa-divider>
					<wa-badge variant="brand" appearance="filled">Higher number is better</wa-badge>
				</div>

				{#if activeSeasonStats && activeSeasonStats.atBats > 0}
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
							<div class="category-heading-wrapper">
								<wa-tooltip for="expectedHeading"
									>Calculates what a player's numbers should look like based entirely on exit
									velocity and launch angle, completely removing defense. If a player's real stats
									are much lower than the expected, they have arguably been getting unlucky.</wa-tooltip
								>
								<h4 class="category-heading help-trigger" id="expectedHeading">Expected Metrics</h4>
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
					<p>Statcast advanced percentile metrics are unavailable for this player.</p>
				{/if}
			</wa-tab-panel>

			<wa-tab-panel name="pitching">
				<div class="horizontal-wrapper">
					<h3 id="pitchingExplanationStandard">Pitching Stats</h3>
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
				<div class="horizontal-wrapper">
					<h3 id="fieldingExplanationStandard">Fielding Stats</h3>
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

	.overview-boxes-wrapper {
		display: flex;
		justify-content: flex-start;
		flex-wrap: wrap;
		gap: 1rem;
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

	.overview-boxes-wrapper-standard {
		display: flex;
		justify-content: flex-start;
		align-items: center;
		width: 100%;
		flex-wrap: wrap;
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

		.player-name-and-team-wrapper {
			flex-direction: column;
			align-items: center;
			gap: 1rem;
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
