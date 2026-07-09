<script>
	import AnimatedCounter from './animatedCounter.svelte';

	let { roster = [] } = $props();

	const uniquePositions = $derived(
		[...new Set(roster.map((p) => p.position?.type).filter(Boolean))].sort()
	);

	function getPlayersByPosition(posType) {
		return roster
			.filter((p) => p.position?.type === posType)
			.sort((a, b) => {
				const aIsActive = !a.status?.code || a.status.code === 'A';
				const bIsActive = !b.status?.code || b.status.code === 'A';

				if (aIsActive && !bIsActive) return -1;
				if (!aIsActive && bIsActive) return 1;
				return 0;
			});
	}
</script>

<div class="roster-container">
	<span class="roster-title">Team Roster ({roster.length})</span>

	<wa-tab-group>
		{#each uniquePositions as position}
			<wa-tab slot="nav" panel={position.toLowerCase().replace(/\s+/g, '-')}>
				{position}s ({getPlayersByPosition(position).length})
			</wa-tab>
		{/each}

		{#each uniquePositions as position}
			<wa-tab-panel name={position.toLowerCase().replace(/\s+/g, '-')}>
				<div class="roster-molecule">
					{#each getPlayersByPosition(position) as player}
						{@const isInjured = player.status?.code && player.status.code !== 'A'}

						<a
							href="/players/{player.person?.id}"
							class="player-roster-card"
							class:il-card={isInjured}
						>
							<div class="player-info-header">
								{#if player.person?.id}
									<img
										src="https://img.mlbstatic.com/mlb-photos/image/upload/d_default_profile.png/w_120,q_auto:best/v1/people/{player
											.person.id}/headshot/67/current"
										alt={player.person.fullName}
										class="player-headshot"
										class:dimmed={isInjured}
										onerror={(e) => {
											e.target.src =
												'https://img.mlbstatic.com/mlb-photos/image/upload/w_50,d_people:generic:headshot:67:current.png/v1/people/generic/headshot/67/current';
										}}
									/>
								{/if}
								<div class="player-meta">
									<span class="player-name">{player.person?.fullName || 'Unknown'}</span>
									<div class="status-tags">
										<wa-badge appearance="filled" size="s" variant="neutral"
											>{player.position?.name || position}</wa-badge
										>
										{#if isInjured}
											<wa-badge appearance="filled" size="s" variant="danger">
												{player.status?.description || 'IL'}
											</wa-badge>
										{/if}
									</div>
								</div>
							</div>
						</a>
					{/each}
				</div>
			</wa-tab-panel>
		{/each}
	</wa-tab-group>
</div>

<style>
	.roster-container {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		width: 100%;
	}

	.roster-title {
		font-weight: var(--wa-font-weight-semibold, 700);
		color: var(--wa-color-filled-on-normal);
		font-size: var(--wa-font-size-s);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		padding-left: 0.25rem;
	}

	wa-tab-group {
		width: 100%;
	}

	.roster-molecule {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
		width: 100%;
		gap: 1rem;
		border-radius: var(--wa-border-radius-s);
	}

	.player-roster-card {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1rem;
		border-radius: var(--wa-border-radius-s);
		border: 1px solid var(--wa-color-border-quiet, var(--wa-color-brand-border-loud));
		transition: all 100ms ease;
		text-decoration: none;
		color: inherit;
	}

	.player-roster-card:hover {
		transform: scale(1.03);
		background-color: var(--wa-color-fill-normal);
		border-color: var(--wa-color-border-quiet);
		cursor: pointer;

		.player-name {
			text-decoration: underline;
			text-decoration-color: var(--wa-color-fill-accent-quiet);
		}

		wa-badge {
			border-color: var(--wa-color-border-loud, var(--wa-color-brand-border-loud));
		}
	}

	.player-roster-card:active {
		transform: scale(0.95);
		background-color: var(--wa-color-fill-normal);
		border-color: var(--wa-color-border-quiet);
		cursor: pointer;

		.player-name {
			text-decoration: underline;
			text-decoration-color: var(--wa-color-fill-accent-quiet);
		}

		wa-badge {
			border-color: var(--wa-color-border-loud, var(--wa-color-brand-border-loud));
		}
	}

	.player-roster-card.il-card {
		opacity: 0.85;
		background-color: rgba(var(--wa-color-neutral-rgb), 0.02);
	}

	.player-info-header {
		display: flex;
		align-items: center;
		gap: 1rem;
		width: 100%;
	}

	.player-headshot {
		width: 48px;
		height: auto;
		border-radius: var(--wa-border-radius-m);
		background-color: var(--wa-color-gray-80);
		object-fit: cover;
		box-shadow: var(--wa-shadow-m);
		border: 1px solid var(--wa-color-border-quiet);
	}

	.player-headshot.dimmed {
		filter: grayscale(40%);
		opacity: 0.7;
	}

	.player-meta {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.status-tags {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.player-name {
		font-weight: var(--wa-font-weight-semibold, 600);
		color: var(--wa-color-filled-on-normal);
		font-size: var(--wa-font-size-m);
	}

	@media (max-width: 768px) {
		.roster-molecule {
			grid-template-columns: 1fr;
			padding: 0.75rem;
		}
	}
</style>
