<script>
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
	{#each uniquePositions as position}
		<section class="position-group">
			<h3 class="position-title">
				{position}s
				<span class="position-count">{getPlayersByPosition(position).length}</span>
			</h3>
			<div class="roster-molecule">
				{#each getPlayersByPosition(position) as player}
					<PlayerCard {player} {position} />
				{/each}
			</div>
		</section>
	{/each}
</div>

<style>
	.roster-container {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		width: 100%;
	}

	.position-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.position-title {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin: 0;
		color: var(--wa-color-filled-on-normal);
		font-size: var(--wa-font-size-s);
		font-weight: var(--wa-font-weight-semibold, 600);
	}

	.position-count {
		font-family: var(--font-mono, monospace);
		font-size: var(--wa-font-size-xs);
		color: var(--wa-color-neutral-on-quiet);
	}

	.roster-molecule {
		display: flex;
		flex-wrap: wrap;
		width: 100%;
		gap: 1rem;
		border-radius: var(--wa-border-radius-s);
	}

	@media (max-width: 768px) {
		.roster-molecule {
			flex-direction: column;
			padding: 0.75rem;
		}
	}
</style>
