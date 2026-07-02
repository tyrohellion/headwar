<script>
	import { fetchPybaseball } from '$lib/pybaseball.js';
	import { getPlayerPictureLarge } from '../../../api/getPlayerPicture';
	import { getPlayerInfo } from '../../../api/getPlayerInfo';
	import { getTeamLogo } from '../../../api/getTeamLogo';
	import { getPlayerBattingPercentileStats } from '../../../api/getPlayerBattingPercentile';
	import { standardBattingConfig } from '../../../formatters/standardBattingStatsConfig';
	import { battingStatConfig } from '../../../formatters/battingStatsConfig';
	import { processPlayerAwards } from '../../../formatters/playerAwardFormatter';
	import { standardPitchingConfig } from '../../../formatters/standardPitchingStatsConfig';
	import { standardFieldingStatsConfig } from '../../../formatters/fieldingStatsConfig';
	import { page } from '$app/stores';
	import { untrack } from 'svelte';

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

	let playerData = $state(null);
	let loading = $state(true);
	let errorMsg = $state('');
	let bbrefId = $state('');
	let imgLoading = $state(true);

	let battingPercentileStats = $state(null);
	let isBattingPercentileStatsLoading = $state(false);

	let userSelectedYear = $state(new Date().getFullYear().toString());
	let userSelectedYearStandard = $state(new Date().getFullYear().toString());
	let userSelectedYearPitching = $state(new Date().getFullYear().toString());
	let userSelectedYearFielding = $state(new Date().getFullYear().toString());
	let userSelectedFieldingPosition = $state('ALL');

	let isCareerMode = $state(false);

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
					const finalYear = profile.lastPlayedDate
						? new Date(profile.lastPlayedDate).getFullYear().toString()
						: new Date().getFullYear().toString();

					userSelectedYear = finalYear;
					userSelectedYearStandard = finalYear;
					userSelectedYearPitching = finalYear;
					userSelectedYearFielding = finalYear;
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

	let processedAccolades = $derived(processPlayerAwards(playerProfile?.awards || []));

	let hittingStatsBlock = $derived.by(() => {
		if (!playerProfile?.stats) {
			console.log('DEBUG 2 -> No stats array found on player profile object.');
			return null;
		}

		const block = playerProfile.stats.find((s) => {
			const groupName = (s.group?.name || s.group?.displayName || '').toLowerCase();
			const typeName = (s.type?.code || s.type?.displayName || '').toLowerCase();

			return groupName === 'hitting' && typeName === 'yearbyyear';
		});

		console.log('FIXED DEBUG 2 -> Matched hittingStatsBlock:', block);
		return block;
	});

	let careerStatsBlock = $derived.by(() => {
		if (!playerProfile?.stats) return null;
		return playerProfile.stats.find((s) => {
			const groupName = (s.group?.name || s.group?.displayName || '').toLowerCase();
			const typeName = (s.type?.code || s.type?.displayName || '').toLowerCase();
			return groupName === 'hitting' && typeName === 'career';
		});
	});

	let activeSeasonStats = $derived.by(() => {
		if (isCareerMode) {
			const careerSplit = careerStatsBlock?.splits?.[0];
			console.log('DEBUG CAREER -> Loading compiled lifetime stat array:', careerSplit);
			return careerSplit?.stat || null;
		}

		console.log('DEBUG 3 -> Running filter for standard stat year:', userSelectedYearStandard);
		if (!hittingStatsBlock?.splits) {
			console.log('DEBUG 3 -> No splits available inside hittingStatsBlock.');
			return null;
		}

		const matchingSplit = hittingStatsBlock.splits.find(
			(split) => split.season === userSelectedYearStandard
		);
		console.log('DEBUG 3 -> matchingSplit result for current loop:', matchingSplit);
		return matchingSplit?.stat || null;
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

	let activePitchingStats = $derived.by(() => {
		if (isCareerMode) {
			return careerPitchingStatsBlock?.splits?.[0]?.stat || null;
		}
		if (!pitchingStatsBlock?.splits) return null;
		const matchingSplit = pitchingStatsBlock.splits.find(
			(split) => split.season === userSelectedYearPitching
		);
		return matchingSplit?.stat || null;
	});

	let availableSeasonsPitching = $derived.by(() => {
		if (!pitchingStatsBlock?.splits) return [];
		const years = pitchingStatsBlock.splits.map((split) => split.season);
		return [...new Set(years)].sort((a, b) => parseInt(b) - parseInt(a));
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
		if (!hittingStatsBlock?.splits) {
			console.log('DEBUG 4 -> No splits found to compile availableSeasonsStandard dropdown.');
			return [];
		}
		const years = hittingStatsBlock.splits.map((split) => split.season);
		const uniqueYears = [...new Set(years)].sort((a, b) => parseInt(b) - parseInt(a));
		console.log('DEBUG 4 -> Extracted unique years for standard dropdown:', uniqueYears);
		return uniqueYears;
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

	let fieldingStatsBlock = $derived.by(() => {
		if (!playerProfile?.stats) return null;
		return playerProfile.stats.find((s) => {
			const groupName = (s.group?.name || s.group?.displayName || '').toLowerCase();
			const typeName = (s.type?.code || s.type?.displayName || '').toLowerCase();
			return groupName === 'fielding' && typeName === 'yearbyyear';
		});
	});

	let availableSeasonsFielding = $derived.by(() => {
		if (!fieldingStatsBlock?.splits) return [];
		const years = fieldingStatsBlock.splits.map((split) => split.season);
		return [...new Set(years)].sort((a, b) => parseInt(b) - parseInt(a));
	});

	let availableFieldingPositions = $derived.by(() => {
		if (!fieldingStatsBlock?.splits) return [];

		const targetSplits = isCareerMode
			? fieldingStatsBlock.splits
			: fieldingStatsBlock.splits.filter((s) => s.season === userSelectedYearFielding);

		const positionMap = {
			LF: 'Left Field',
			CF: 'Center Field',
			RF: 'Right Field',
			OF: 'Outfielder'
		};

		const positions = targetSplits
			.map((s) => {
				const abbrev = s.position?.abbreviation;
				if (positionMap[abbrev]) {
					return positionMap[abbrev];
				}

				return s.position?.name || s.position?.displayName;
			})
			.filter((posName) => posName && posName !== 'Designated Hitter');

		return [...new Set(positions)];
	});

	$effect(() => {
		const positions = availableFieldingPositions;

		untrack(() => {
			if (positions.length === 1) {
				userSelectedFieldingPosition = positions[0];
			} else if (
				userSelectedFieldingPosition !== 'ALL' &&
				!positions.includes(userSelectedFieldingPosition)
			) {
				userSelectedFieldingPosition = 'ALL';
			}
		});
	});

	let activeFieldingStats = $derived.by(() => {
		if (!fieldingStatsBlock?.splits) return null;

		let targetSplits = isCareerMode
			? fieldingStatsBlock.splits
			: fieldingStatsBlock.splits.filter((s) => s.season === userSelectedYearFielding);

		targetSplits = targetSplits.filter(
			(s) =>
				(s.position?.name || s.position?.displayName) !== 'Designated Hitter' &&
				s.position?.abbreviation !== 'DH'
		);

		if (userSelectedFieldingPosition !== 'ALL') {
			const positionAbbrevMap = {
				'Left Field': 'LF',
				'Center Field': 'CF',
				'Right Field': 'RF',
				Outfielder: 'OF'
			};
			const targetAbbrev = positionAbbrevMap[userSelectedFieldingPosition];

			targetSplits = targetSplits.filter((s) => {
				const name = s.position?.name || s.position?.displayName;
				const abbrev = s.position?.abbreviation;

				return name === userSelectedFieldingPosition || (targetAbbrev && abbrev === targetAbbrev);
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
				<p>{playerProfile.weight} lbs</p>
				<wa-divider orientation="vertical"></wa-divider>
				<p>{playerProfile.height}</p>
			</div>
		</div>
	</div>

	<wa-divider></wa-divider>

	<wa-tab-group placement="start">
		<wa-tab panel="overview">Overview</wa-tab>
		<wa-tab panel="batting">Batting</wa-tab>
		<wa-tab panel="pitching">Pitching</wa-tab>
		<wa-tab panel="fielding">Fielding</wa-tab>
		<wa-tab panel="awards">Awards</wa-tab>
		<wa-tab panel="schedule">Schedule</wa-tab>

		<wa-tab-panel name="overview">
			<div class="horizontal-wrapper">
				<h3>Overview</h3>
			</div>
			<p>Bats: {playerProfile.batSide?.description || 'N/A'}</p>
			<p>Throws: {playerProfile.pitchHand?.description || 'N/A'}</p>
		</wa-tab-panel>

		<wa-tab-panel name="batting">
			<div class="horizontal-wrapper">
				<h3 id="battingExplanationStandard">Batting Stats</h3>
				<wa-divider orientation="vertical"></wa-divider>

				<div class="dropdown-and-switch-wrapper">
					<wa-select
						id="battingYearSelector"
						value={userSelectedYearStandard}
						disabled={isCareerMode || availableSeasonsStandard.length <= 1 || null}
						class="year-dropdown"
						size="s"
						onchange={(e) => {
							userSelectedYearStandard = e.target.value;
						}}
					>
						{#if availableSeasonsStandard.length === 0}
							<wa-option value={userSelectedYearStandard} selected={true}
								>{userSelectedYearStandard}</wa-option
							>
						{:else}
							{#each availableSeasonsStandard as season}
								<wa-option value={season} selected={season === userSelectedYearStandard || null}>
									{season}
								</wa-option>
							{/each}
						{/if}
					</wa-select>

					<wa-switch
						class="no-wrap-switch"
						checked={isCareerMode || null}
						onchange={(e) => {
							isCareerMode = e.target.checked;
						}}
					>
						Career Stats
					</wa-switch>
				</div>
			</div>

			{#if isCareerMode || availableSeasonsStandard.length > 0}
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
				93 would mean a player is in the top 7 percent of MLB players in that category. 50 is always
				going to be the league average.
			</wa-tooltip>
			<div class="horizontal-wrapper">
				<h3 id="battingExplanation" class="help-trigger">Batting Percentiles</h3>
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
					class="year-dropdown"
					onchange={(e) => {
						userSelectedYear = e.target.value;
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
						<div class="category-heading-wrapper">
							<wa-tooltip for="expectedHeading"
								>Calculates what a player's numbers should look like based entirely on exit velocity
								and launch angle, completely removing defense. If a player's real stats are much
								lower than the expected, they have arguably been getting unlucky.</wa-tooltip
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
				<wa-divider orientation="vertical"></wa-divider>

				<div class="dropdown-and-switch-wrapper">
					<wa-select
						id="pitchingYearSelector"
						value={userSelectedYearPitching}
						disabled={isCareerMode || availableSeasonsPitching.length <= 1 || null}
						class="year-dropdown"
						size="s"
						onchange={(e) => {
							userSelectedYearPitching = e.target.value;
						}}
					>
						{#if availableSeasonsPitching.length === 0}
							<wa-option value={userSelectedYearPitching} selected={true}>
								{userSelectedYearPitching}
							</wa-option>
						{:else}
							{#each availableSeasonsPitching as season}
								<wa-option value={season} selected={season === userSelectedYearPitching || null}>
									{season}
								</wa-option>
							{/each}
						{/if}
					</wa-select>

					<wa-switch
						class="no-wrap-switch"
						checked={isCareerMode || null}
						onchange={(e) => {
							isCareerMode = e.target.checked;
						}}
					>
						Career Stats
					</wa-switch>
				</div>
			</div>

			{#if isCareerMode || availableSeasonsPitching.length > 0}
				<div class="stats-grid-container">
					<div class="stats-column">
						<div class="category-heading-wrapper"><h4 class="category-heading">Standard</h4></div>
						<div class="wa-stack" style="gap: 0px">
							{#each standardPitchingConfig.filter((s) => s.category === 'standard') as stat}
								{@const rawValue = activePitchingStats?.[stat.key]}
								{#if rawValue !== undefined && rawValue !== null}
									{@const formattedValue = ['era', 'whip', 'ops', 'obp'].includes(stat.key)
										? (typeof rawValue === 'number' ? rawValue : parseFloat(rawValue))
												.toFixed(3)
												.replace(/^0/, '')
										: ['strikeoutsPer9Inn', 'walksPer9Inn'].includes(stat.key)
											? (typeof rawValue === 'number' ? rawValue : parseFloat(rawValue)).toFixed(2)
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
				<wa-divider orientation="vertical"></wa-divider>

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

					<wa-select
						id="fieldingYearSelector"
						value={userSelectedYearFielding}
						disabled={isCareerMode || availableSeasonsFielding.length <= 1 || null}
						class="year-dropdown"
						size="s"
						onchange={(e) => {
							userSelectedYearFielding = e.target.value;
						}}
					>
						{#if availableSeasonsFielding.length === 0}
							<wa-option value={userSelectedYearFielding} selected={true}>
								{userSelectedYearFielding}
							</wa-option>
						{:else}
							{#each availableSeasonsFielding as season}
								<wa-option value={season} selected={season === userSelectedYearFielding || null}>
									{season}
								</wa-option>
							{/each}
						{/if}
					</wa-select>

					<wa-switch
						class="no-wrap-switch"
						checked={isCareerMode || null}
						onchange={(e) => {
							isCareerMode = e.target.checked;
						}}
					>
						Career Stats
					</wa-switch>
				</div>
			</div>

			{#if isCareerMode || availableSeasonsFielding.length > 0}
				<div class="stats-grid-container">
					<div class="stats-column">
						<div class="category-heading-wrapper"><h4 class="category-heading">Standard</h4></div>
						<div class="wa-stack" style="gap: 0px">
							{#each standardFieldingStatsConfig.filter((s) => s.category === 'standard') as stat}
								{@const rawValue = activeFieldingStats?.[stat.key]}
								{#if rawValue !== undefined && rawValue !== null}
									{@const formattedValue =
										stat.key === 'fielding'
											? (typeof rawValue === 'number' ? rawValue : parseFloat(rawValue)).toFixed(3)
											: (typeof rawValue === 'number' ? rawValue : parseFloat(rawValue)).toFixed(2)}
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
		<wa-tab-panel name="schedule">Schedule panels content.</wa-tab-panel>
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
	.debut-arrow {
		font-size: 12px;
	}
	.help-trigger {
		cursor: help;
	}
	.year-dropdown {
		width: 6rem;
	}
	.section-divider {
		margin: 3rem 0 3rem 0;
	}
	.no-wrap-switch {
		white-space: nowrap;
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
</style>
