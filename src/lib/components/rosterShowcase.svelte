<script>
	import AnimatedCounter from './animatedCounter.svelte';
	import PlayerCard from './playerCard.svelte';

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
						<PlayerCard {player} {position} />
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

	@media (max-width: 768px) {
		.roster-molecule {
			grid-template-columns: 1fr;
			padding: 0.75rem;
		}
	}
</style>
