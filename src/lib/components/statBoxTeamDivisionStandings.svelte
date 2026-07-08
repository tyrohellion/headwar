<script>
	import AnimatedCounter from './animatedCounter.svelte';
	import { getTeamLogo } from '../../api/getTeamLogo';

	let { divisionName = '', divisionStandings = [], currentTeamId = null } = $props();

	let logosMap = $state({});

	$effect(() => {
		if (!divisionStandings || divisionStandings.length === 0) return;

		async function loadAllLogos() {
			try {
				const logoPromises = divisionStandings.map(async (row) => {
					const id = row.team?.id;
					if (!id) return null;

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
				console.error('Error batch resolving division logos:', error);
			}
		}

		loadAllLogos();
	});

	function getActiveColor(pct) {
		const rate = parseFloat(pct) || 0;
		if (rate > 0.5) return 'var(--wa-color-success-60)';
		if (rate < 0.5) return 'var(--wa-color-danger-70)';
		return 'var(--wa-color-filled-on-normal)';
	}

	function getBadgeVariant(pct) {
		return (parseFloat(pct) || 0) >= 0.5 ? 'brand' : 'neutral';
	}
</script>

<div class="division-container">
	<span class="division-title">{divisionName} Standings</span>

	<div class="standings-molecule">
		{#each divisionStandings as row}
			{@const isCurrentTeam = currentTeamId && row.team?.id === Number(currentTeamId)}
			{@const teamIdKey = row.team?.id}

			<a href="/teams/{teamIdKey}" class="team-standings-card" class:highlighted={isCurrentTeam}>
				<div class="team-info-header">
					{#if teamIdKey && logosMap[teamIdKey]}
						<img src={logosMap[teamIdKey]} alt="{row.team?.name} logo" class="team-logo-small" />
					{:else if teamIdKey}
						<div class="team-logo-placeholder"></div>
					{/if}
					<div class="team-meta">
						<span class="team-abbrev">{row.team?.abbreviation || row.team?.name || 'MLB'}</span>
						<span class="rank-tag">#{row.divisionRank || '-'}</span>
					</div>
				</div>

				<div class="record-data-row">
					<div class="record-numbers">
						<span class="stat-value" style="color: {getActiveColor(row.winningPercentage)};">
							<AnimatedCounter value={row.wins} />
						</span>
						<span class="record-separator">-</span>
						<span class="stat-value">
							<AnimatedCounter value={row.losses} />
						</span>
					</div>
					<wa-badge appearance="filled" size="m" variant={getBadgeVariant(row.winningPercentage)}>
						{row.winningPercentage}
					</wa-badge>
				</div>
			</a>
		{/each}
	</div>
</div>

<style>
	.division-container {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		width: 100%;
	}

	.division-title {
		font-weight: var(--wa-font-weight-semibold, 700);
		color: var(--wa-color-filled-on-normal);
		font-size: var(--wa-font-size-s);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		padding-left: 0.25rem;
	}

	.standings-molecule {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		width: 100%;
		gap: 1rem;
		border-radius: var(--wa-border-radius-s);
		border: 1px solid var(--wa-color-border-quiet, var(--wa-color-brand-border-loud));
		padding: 1.25rem 1.5rem;
		background-color: transparent;
	}

	.team-standings-card {
		display: flex;
		flex-direction: column;
		flex: 1;
		gap: 1rem;
		padding: 1rem;
		border-radius: var(--wa-border-radius-s);
		transition: all 100ms ease;
		text-decoration: none;
		color: inherit;
	}

	.team-standings-card.highlighted {
		background-color: var(--wa-color-fill-accent-quiet, rgba(var(--wa-color-brand-rgb), 0.08));
		outline: 1px dashed var(--wa-color-brand-border-loud);
	}

	.team-standings-card:hover {
		transform: scale(1.03);
		background-color: var(--wa-color-fill-normal);
		cursor: pointer;

		wa-badge {
			border-color: var(--wa-color-border-loud, var(--wa-color-brand-border-loud));
		}

		.team-abbrev {
			text-decoration: underline;
			text-decoration-color: var(--wa-color-fill-accent-quiet);
		}
	}

	.team-info-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
	}

	.team-logo-small {
		max-width: 44px;
		width: 44px;
		height: 44px;
		max-height: 44px;
		background-color: var(--wa-color-gray-80);
		padding: 0.6rem;
		box-shadow: var(--wa-shadow-l);
	}

	.team-logo-placeholder {
		width: 44px;
		height: 44px;
		border-radius: var(--wa-border-radius-s);
		background-color: var(--wa-color-gray-80);
		opacity: 0.4;
	}

	.team-meta {
		display: flex;
		flex-direction: column;
		gap: 4px;
		line-height: 1.1;
	}

	.team-abbrev {
		font-weight: var(--wa-font-weight-semibold, 700);
		color: var(--wa-color-filled-on-normal);
		font-size: var(--wa-font-size-m);
	}

	.rank-tag {
		font-size: var(--wa-font-size-xs);
		color: var(--wa-color-neutral-on-quiet);
	}

	.record-data-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
	}

	.record-numbers {
		display: flex;
		align-items: center;
		gap: 0.2rem;
	}

	.stat-value {
		font-family: var(--font-mono);
		font-variant-numeric: tabular-nums;
		font-weight: var(--wa-font-weight-bold, 600);
		font-size: var(--wa-font-size-m);
		color: var(--wa-color-filled-on-normal);
	}

	.record-separator {
		font-family: var(--font-mono);
		font-size: var(--wa-font-size-m);
		color: var(--wa-color-neutral-on-quiet);
	}

	wa-badge {
		font-family: var(--font-mono);
		height: 22px;
		font-size: var(--wa-font-size-xs);
		padding: 0 0.4rem;
	}

	@media (max-width: 1350px) {
		.standings-molecule {
			flex-direction: column;
		}

		.team-standings-card {
			flex-direction: row;
			align-items: center;
			justify-content: space-between;
			padding: 1rem;
		}

		.record-data-row {
			width: auto;
			gap: 1.5rem;
			justify-content: flex-end;
		}
	}

	@media (max-width: 768px) {
		.record-data-row {
			width: auto;
			gap: 1.5rem;
			justify-content: flex-end;
		}
	}
</style>
