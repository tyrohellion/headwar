<script>
	import { dynamicDateCountdown } from '../../formatters/dynamicRelativeDateCountdown';

	let { game, logosMap = {}, now, currentTeamId = null } = $props();

	let away = $derived(game.teams?.away);
	let home = $derived(game.teams?.home);

	let linescore = $derived(game.linescore);
	let isLive = $derived(
		game.status?.detailedState?.toLowerCase().includes('in progress') ||
			game.status?.detailedState?.toLowerCase().includes('live')
	);

	function formatGameTime(isoString) {
		if (!isoString) return '';
		const date = new Date(isoString);
		return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
	}

	function getStatusVariant(detailedState) {
		const state = detailedState?.toLowerCase() || '';
		if (state.includes('progress') || state.includes('live')) return 'success';
		if (state.includes('postpone') || state.includes('cancel')) return 'danger';
		return 'neutral';
	}

	function formatInningState(ls) {
		if (!ls) return 'Live';
		const arrow = ls.isTopInning ? '▲' : '▼';
		return `${arrow} ${ls.inningState} ${ls.currentInningOrdinal}`;
	}
</script>

<div class="game-schedule-card">
	<div class="game-meta-header">
		<wa-badge appearance="filled">
			{isLive ? 'Live' : dynamicDateCountdown(game.gameDate, now)}
		</wa-badge>
		<wa-badge appearance="filled" size="s" variant={getStatusVariant(game.status?.detailedState)}>
			{isLive
				? formatInningState(linescore)
				: game.status?.detailedState === 'Scheduled'
					? formatGameTime(game.gameDate)
					: game.status?.detailedState}
		</wa-badge>
	</div>

	<div class="matchup-vertical-stack">
		<a class="team-meta-group" href="/teams/{away?.team?.id}">
			<div
				class="team-row"
				class:is-current={currentTeamId && Number(currentTeamId) === away?.team?.id}
			>
				<div class="team-logo-name-wrapper">
					{#if away?.team?.id && logosMap[away.team.id]}
						<img src={logosMap[away.team.id]} alt="" class="team-logo-small" />
					{:else}
						<div class="team-logo-placeholder"></div>
					{/if}
					<div class="team-name-info">
						<span class="team-name-text">{away?.team?.clubName || 'Away'}</span>
						{#if !isLive && away?.leagueRecord}
							<span class="team-record-text"
								>({away.leagueRecord.wins}-{away.leagueRecord.losses})</span
							>
						{/if}
					</div>
				</div>
				{#if isLive}
					<span class="live-score-text">{linescore?.teams?.away?.runs ?? 0}</span>
				{:else}
					<span class="loc-indicator-tag">AWAY</span>
				{/if}
			</div>
		</a>

		<a class="team-meta-group" href="/teams/{home?.team?.id}">
			<div
				class="team-row"
				class:is-current={currentTeamId && Number(currentTeamId) === home?.team?.id}
			>
				<div class="team-logo-name-wrapper">
					{#if home?.team?.id && logosMap[home.team.id]}
						<img src={logosMap[home.team.id]} alt="" class="team-logo-small" />
					{:else}
						<div class="team-logo-placeholder"></div>
					{/if}
					<div class="team-name-info">
						<span class="team-name-text">{home?.team?.clubName || 'Home'}</span>
						{#if !isLive && home?.leagueRecord}
							<span class="team-record-text"
								>({home.leagueRecord.wins}-{home.leagueRecord.losses})</span
							>
						{/if}
					</div>
				</div>
				{#if isLive}
					<span class="live-score-text">{linescore?.teams?.home?.runs ?? 0}</span>
				{:else}
					<span class="loc-indicator-tag">HOME</span>
				{/if}
			</div>
		</a>
	</div>

	<div class="venue-info">
		<span class="venue-name">{game.venue?.name || 'TBD'}</span>
		{#if game.seriesGameNumber}
			<wa-divider orientation="vertical"></wa-divider>
			<span class="venue-name">Game {game.seriesGameNumber} of {game.gamesInSeries || 4}</span>
		{/if}
	</div>
</div>

<style>
	.live-score-text {
		font-family: var(--font-mono, monospace);
		font-size: var(--wa-font-size-l, 1.25rem);
		font-weight: var(--wa-font-weight-bold, 700);
		color: var(--wa-color-filled-on-normal);
		padding-right: 0.25rem;
	}

	.game-schedule-card {
		display: flex;
		flex-direction: column;
		justify-content: space-between;
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

	.matchup-vertical-stack {
		display: flex;
		flex-direction: column;
		flex-grow: 1;
		gap: 0.25rem;
		justify-content: center;
		padding: 0.5rem 0;
	}

	.team-row {
		display: flex;
		align-items: center;
		width: 100%;
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
		text-decoration: none;
		color: var(--wa-color-filled-on-normal);
	}

	.team-logo-name-wrapper {
		display: flex;
		gap: 1rem;
		align-items: center;
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
		max-width: 40px;
		width: 40px;
		height: 40px;
		max-height: 40px;
		background-color: var(--wa-color-gray-70);
		padding: 0.4rem;
		box-shadow: var(--wa-shadow-l);
		flex-shrink: 0;
	}

	.team-logo-placeholder {
		width: 40px;
		height: 40px;
		border-radius: var(--wa-border-radius-s);
		background-color: var(--wa-color-gray-70);
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
