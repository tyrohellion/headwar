<script>
	import { getTeamLogo } from '../../api/getTeamLogo';

	let { upcomingSchedule = [], currentTeamId = null } = $props();

	let logosMap = $state({});
	let sliderEl = $state(null);
	let scrollX = $state(0);
	let maxScroll = $state(0);

	$effect(() => {
		if (!upcomingSchedule || upcomingSchedule.length === 0) return;

		async function loadScheduleLogos() {
			try {
				const uniqueTeamIds = new Set();
				upcomingSchedule.forEach((game) => {
					if (game.teams?.away?.team?.id) uniqueTeamIds.add(game.teams.away.team.id);
					if (game.teams?.home?.team?.id) uniqueTeamIds.add(game.teams.home.team.id);
				});

				const logoPromises = Array.from(uniqueTeamIds).map(async (id) => {
					try {
						const logoUrl = await getTeamLogo(id);
						return { id, logoUrl };
					} catch (err) {
						console.error(`Failed to load logo for team ${id}`, err);
						return { id, logoUrl: `https://midas.mlbstatic.com/v1/team/${id}/assets/1/120.svg` };
					}
				});

				const resolvedLogos = await Promise.all(logoPromises);
				const newLogos = {};
				resolvedLogos.forEach((item) => {
					if (item) newLogos[item.id] = item.logoUrl;
				});

				logosMap = newLogos;
			} catch (error) {
				console.error('Error batch resolving schedule logos:', error);
			}
		}

		loadScheduleLogos();
	});

	function updateScrollState() {
		if (!sliderEl) return;
		scrollX = sliderEl.scrollLeft;
		maxScroll = sliderEl.scrollWidth - sliderEl.clientWidth;
	}

	$effect(() => {
		if (sliderEl && upcomingSchedule.length > 0) {
			updateScrollState();
			const resizeObserver = new ResizeObserver(updateScrollState);
			resizeObserver.observe(sliderEl);
			return () => resizeObserver.disconnect();
		}
	});

	function scroll(direction) {
		if (!sliderEl) return;
		const cardWidth = sliderEl.clientWidth + 16;
		sliderEl.scrollBy({
			left: direction * cardWidth,
			behavior: 'smooth'
		});
	}

	function formatGameTime(isoString) {
		if (!isoString) return '';
		const date = new Date(isoString);
		return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
	}

	function formatGameDate(isoString) {
		if (!isoString) return '';
		const date = new Date(isoString);
		return date.toLocaleDateString([], { weekday: 'short', month: 'numeric', day: 'numeric' });
	}

	function getStatusVariant(detailedState) {
		const state = detailedState?.toLowerCase() || '';
		if (state.includes('progress') || state.includes('live')) return 'success';
		if (state.includes('postpone') || state.includes('cancel')) return 'danger';
		return 'neutral';
	}
</script>

<div class="schedule-container">
	<div class="carousel-layout-grid">
		<button
			type="button"
			class="control-btn"
			disabled={scrollX <= 5}
			onclick={() => scroll(-1)}
			aria-label="Previous game"
		>
			&larr;
		</button>

		<div class="carousel-viewport">
			<div bind:this={sliderEl} onscroll={updateScrollState} class="schedule-molecule">
				{#each upcomingSchedule as game}
					{@const away = game.teams?.away}
					{@const home = game.teams?.home}

					<div class="game-schedule-card">
						<div class="game-meta-header">
							<span class="game-date">{formatGameDate(game.gameDate)}</span>
							<wa-badge
								appearance="filled"
								size="s"
								variant={getStatusVariant(game.status?.detailedState)}
							>
								{game.status?.detailedState === 'Scheduled'
									? formatGameTime(game.gameDate)
									: game.status?.detailedState}
							</wa-badge>
						</div>

						<div class="matchup-vertical-stack">
							<div
								class="team-row"
								class:is-current={currentTeamId && Number(currentTeamId) === away?.team?.id}
							>
								<a class="team-meta-group" href="/teams/{away?.team?.id}">
									{#if away?.team?.id && logosMap[away.team.id]}
										<img src={logosMap[away.team.id]} alt="" class="team-logo-small" />
									{:else}
										<div class="team-logo-placeholder"></div>
									{/if}
									<div class="team-name-info">
										<span class="team-name-text">{away?.team?.name || 'Away'}</span>
										{#if away?.leagueRecord}
											<span class="team-record-text"
												>({away.leagueRecord.wins}-{away.leagueRecord.losses})</span
											>
										{/if}
									</div>
								</a>
								<span class="loc-indicator-tag">AWAY</span>
							</div>

							<div
								class="team-row"
								class:is-current={currentTeamId && Number(currentTeamId) === home?.team?.id}
							>
								<a class="team-meta-group" href="/teams/{home?.team?.id}">
									{#if home?.team?.id && logosMap[home.team.id]}
										<img src={logosMap[home.team.id]} alt="" class="team-logo-small" />
									{:else}
										<div class="team-logo-placeholder"></div>
									{/if}
									<div class="team-name-info">
										<span class="team-name-text">{home?.team?.name || 'Home'}</span>
										{#if home?.leagueRecord}
											<span class="team-record-text"
												>({home.leagueRecord.wins}-{home.leagueRecord.losses})</span
											>
										{/if}
									</div>
								</a>
								<span class="loc-indicator-tag">HOME</span>
							</div>
						</div>

						<div class="venue-info">
							<span class="venue-name">{game.venue?.name || 'TBD'}</span>
							{#if game.seriesGameNumber}
								<wa-divider orientation="vertical"></wa-divider>
								<span class="venue-name"
									>Game {game.seriesGameNumber} of {game.gamesInSeries || 4}</span
								>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		</div>

		<button
			type="button"
			class="control-btn"
			disabled={scrollX >= maxScroll - 5}
			onclick={() => scroll(1)}
			aria-label="Next game"
		>
			&rarr;
		</button>
	</div>
</div>

<style>
	.schedule-container {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		width: 100%;
		height: 100%;
	}

	.carousel-layout-grid {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 0.75rem;
		width: 100%;
		flex-grow: 1;
	}

	.carousel-viewport {
		flex-grow: 1;
		min-width: 0;
		height: 100%;
		display: flex;
		overflow: hidden;
	}

	.control-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		border-radius: var(--wa-border-radius-circle, 50%);
		border: 1px solid var(--wa-color-border-quiet);
		background-color: var(--wa-color-fill-normal);
		color: var(--wa-color-filled-on-normal);
		cursor: pointer;
		font-size: var(--wa-font-size-m);
		transition: all 100ms ease;
		flex-shrink: 0;
	}

	.control-btn:hover:not(:disabled) {
		background-color: var(--wa-color-fill-brand);
		transform: scale(1.03);
		transition: all 100ms ease;
	}

	.control-btn:active:not(:disabled) {
		background-color: var(--wa-color-fill-brand);
		transform: scale(0.9);
		transition: all 100ms ease;
	}

	.control-btn:disabled {
		opacity: 0.25;
		cursor: not-allowed;
	}

	.schedule-molecule {
		display: grid;
		grid-auto-flow: column;
		grid-auto-columns: 100%;
		gap: 1rem;
		background-color: transparent;
		overflow-x: auto;
		scroll-snap-type: x mandatory;
		scrollbar-width: none;
		width: 100%;
		height: 100%;
	}

	.schedule-molecule::-webkit-scrollbar {
		display: none;
	}

	.game-schedule-card {
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		scroll-snap-align: start;
		box-sizing: border-box;
		padding: 1rem;
		width: 100%;
		height: 100%;
		border-radius: var(--wa-border-radius-s);
		border: 1px solid var(--wa-color-border-quiet, var(--wa-color-brand-border-loud));
		background-color: transparent;
	}

	.game-meta-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding-bottom: 0.5rem;
		width: 100%;
	}

	.game-date {
		font-weight: var(--wa-font-weight-semibold, 600);
		color: var(--wa-color-filled-on-normal);
		font-size: var(--wa-font-size-s);
	}

	.matchup-vertical-stack {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		flex-grow: 1;
		justify-content: center;
		padding: 0.5rem 0;
	}

	.team-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.7rem;
		border-radius: var(--wa-border-radius-m);
		transition: all 100ms ease;
	}

	.team-row.is-current {
		background-color: var(--wa-color-fill-normal);
	}

	.team-row:hover {
		background-color: var(--wa-color-fill-normal);
		transform: scale(1.015);
		transition: all 100ms ease;
		text-decoration: underline;
		cursor: pointer;
	}

	.team-row:active {
		background-color: var(--wa-color-fill-normal);
		transform: scale(0.99);
		transition: all 100ms ease;
		text-decoration: underline;
		cursor: pointer;
	}

	.team-meta-group {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		min-width: 0;
		text-decoration: none;
		color: var(--wa-color-filled-on-normal);
	}

	.team-name-info {
		display: flex;
		align-items: baseline;
		gap: 0.35rem;
		min-width: 0;
	}

	.team-name-text {
		font-weight: var(--wa-font-weight-semibold, 600);
		color: var(--wa-color-filled-on-normal);
		font-size: var(--wa-font-size-m);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.team-record-text {
		font-size: var(--wa-font-size-xs);
		font-family: var(--font-mono);
		color: var(--wa-color-neutral-on-quiet);
		white-space: nowrap;
	}

	.loc-indicator-tag {
		font-size: 10px;
		font-family: var(--font-mono);
		font-weight: var(--wa-font-weight-bold, 700);
		color: var(--wa-color-neutral-on-quiet);
		letter-spacing: 0.05em;
		opacity: 0.6;
	}

	.team-logo-small {
		max-width: 28px;
		width: 28px;
		height: 28px;
		max-height: 28px;
		background-color: var(--wa-color-gray-80);
		padding: 0.3rem;
		box-shadow: var(--wa-shadow-s);
		flex-shrink: 0;
	}

	.team-logo-placeholder {
		width: 28px;
		height: 28px;
		border-radius: var(--wa-border-radius-s);
		background-color: var(--wa-color-gray-80);
		opacity: 0.4;
		flex-shrink: 0;
	}

	.venue-info {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding-top: 0.5rem;
		width: 100%;
	}

	.venue-name {
		font-size: var(--wa-font-size-xs);
		color: var(--wa-color-neutral-on-quiet);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	wa-divider {
		height: 12px;
	}

	wa-badge {
		flex-shrink: 0;
	}
</style>
