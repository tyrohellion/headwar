<script>
	import { getPlayerHeadshot, teams, searchPlayers } from '../../api/universalSearch';
	import { fetchPybaseball } from '$lib/pybaseball.js';

	import WaDropdown from '@awesome.me/webawesome/dist/components/dropdown/dropdown.js';
	import WaButton from '@awesome.me/webawesome/dist/components/button/button.js';
	import WaButtonGroup from '@awesome.me/webawesome/dist/components/button-group/button-group.js';
	import WaInput from '@awesome.me/webawesome/dist/components/input/input.js';
	import WaOption from '@awesome.me/webawesome/dist/components/option/option.js';

	let query = $state('');
	let matchedPlayers = $state([]);
	let isSearching = $state(false);

	let matchedTeams = $derived.by(() => {
		const cleanQuery = query.trim().toLowerCase();
		if (cleanQuery.length < 2) return [];
		return teams.filter(
			(t) =>
				t.name.toLowerCase().includes(cleanQuery) ||
				t.abbreviation.toLowerCase().includes(cleanQuery)
		);
	});

	async function handleInput(e) {
		query = e.target.value;
		const cleanQuery = query.trim();

		if (cleanQuery.length < 3) {
			matchedPlayers = [];
			return;
		}

		isSearching = true;
		try {
			const people = await searchPlayers(cleanQuery);

			matchedPlayers = people.slice(0, 8);
		} catch (err) {
			console.error('Universal lookup failed:', err);
		} finally {
			isSearching = false;
		}
	}

	function selectPlayer(player) {
		alert(`Selected player: ${player.fullName} (ID: ${player.id})`);

		query = '';
		matchedPlayers = [];
	}

	function selectTeam(team) {
		alert(`Selected team: ${team.name}`);
		query = '';
		matchedPlayers = [];
	}
</script>

<div class="nav">
	<div class="nav-buttons">
		<wa-button size="s" variant="brand" appearance="filled">
			<wa-icon name="house" label="Home"></wa-icon>
		</wa-button>

		<wa-button-group size="s" label="Players">
			<wa-button size="s" appearance="filled">Players</wa-button>
			<wa-dropdown size="s" placement="bottom">
				<wa-button size="s" appearance="filled" slot="trigger">
					<wa-icon name="chevron-down" label="More options"></wa-icon>
				</wa-button>
				<wa-dropdown-item>WAR Leaders</wa-dropdown-item>
				<wa-dropdown-item>OPS Leaders</wa-dropdown-item>
				<wa-dropdown-item>ERA Leaders</wa-dropdown-item>
			</wa-dropdown>
		</wa-button-group>

		<wa-button-group size="s" label="Teams">
			<wa-button size="s" appearance="filled">Teams</wa-button>
			<wa-dropdown size="s" placement="bottom">
				<wa-button size="s" appearance="filled" slot="trigger">
					<wa-icon name="chevron-down" label="More options"></wa-icon>
				</wa-button>
				<wa-dropdown-item>Record Leaders</wa-dropdown-item>
				<wa-dropdown-item>National League</wa-dropdown-item>
				<wa-dropdown-item>American League</wa-dropdown-item>
			</wa-dropdown>
		</wa-button-group>

		<wa-button-group size="s" label="Games">
			<wa-button size="s" appearance="filled">Games</wa-button>
			<wa-dropdown size="s" placement="bottom">
				<wa-button size="s" appearance="filled" slot="trigger">
					<wa-icon name="chevron-down" label="More options"></wa-icon>
				</wa-button>
				<wa-dropdown-item>Live Games</wa-dropdown-item>
				<wa-dropdown-item>Finished Games</wa-dropdown-item>
			</wa-dropdown>
		</wa-button-group>
	</div>

	<div class="search-wrapper">
		<wa-input
			value={query}
			oninput={handleInput}
			placeholder="Search players or teams"
			size="s"
			clearable
		>
			<wa-icon name="magnifying-glass" slot="start"></wa-icon>
		</wa-input>

		{#if matchedPlayers.length > 0 || matchedTeams.length > 0 || isSearching}
			<div class="search-dropdown">
				{#if isSearching}
					<div class="dropdown-status">Searching baseball database...</div>
				{/if}

				<!-- Teams Category -->
				{#if matchedTeams.length > 0}
					<div class="category-header">Teams</div>
					{#each matchedTeams as team}
						<button class="dropdown-item" onclick={() => selectTeam(team)}>
							<span class="team-abbr">{team.abbreviation}</span>
							<span class="item-name">{team.name}</span>
						</button>
					{/each}
				{/if}

				{#if matchedPlayers.length > 0}
					<div class="category-header">Players</div>
					{#each matchedPlayers as player}
						<button class="dropdown-item" onclick={() => selectPlayer(player)}>
							<img
								src={getPlayerHeadshot(player.id)}
								alt="playerHeadshot"
								class="player-thumb"
								loading="lazy"
								onerror={(e) =>
									(e.target.src =
										'https://img.mlbstatic.com/mlb-photos/image/upload/w_50,d_people:generic:headshot:67:current.png/v1/people/generic/headshot/67/current')}
							/>
							<span class="item-name">{player.fullName}</span>
						</button>
					{/each}
				{/if}
			</div>
		{/if}
	</div>
</div>

<style>
	.nav {
		display: flex;
		position: fixed;
		top: 0;
		left: 0;
		padding: 1rem 3rem;
		width: 100%;
		justify-content: space-between;
		backdrop-filter: blur(6px);
		box-sizing: border-box;
		z-index: 100;
	}

	.nav-buttons {
		display: flex;
		gap: 0.5rem;
	}

	.search-wrapper {
		position: relative;
		width: 280px;
	}

	.search-dropdown {
		position: absolute;
		top: calc(100% + 0.5rem);
		left: 0;
		width: 100%;
		background: var(--wa-color-surface-raised);
		border: 1px solid var(--wa-color-border-quiet);
		border-radius: var(--wa-border-radius-m);
		box-shadow: var(--wa-shadow-m);
		max-height: 400px;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		padding: 0px;
	}

	.category-header {
		font-size: 0.7rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		color: #757575;
		padding: 0.5rem 1rem 0.5rem 1rem;
		background: var(--wa-color-surface-raised);
		cursor: default;
	}

	.dropdown-status {
		padding: 0.5rem;
		font-size: 0.85rem;
		color: #757575;
		font-style: italic;
	}

	.dropdown-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
		height: min-content;
		padding: 0.5rem 1rem 0.5rem 1rem;
		border: none;
		background: transparent;
		text-align: left;
		font-family: var(--wa-font-family-body);
		font-size: 1rem;
		cursor: pointer;
		color: inherit;
	}

	.dropdown-item:hover {
		background-color: var(--wa-color-neutral-fill-normal);
		color: var(--wa-color-blue-on);
		border-radius: 0px;
	}

	.player-thumb {
		width: 32px;
		height: 32px;
		object-fit: cover;
		border-radius: 50%;
	}

	.team-abbr {
		font-size: 0.75rem;
		font-weight: bold;
		background: #333;
		color: #fff;
		padding: 2px 5px;
		border-radius: 3px;
		min-width: 32px;
		text-align: center;
	}

	.item-name {
		flex-grow: 1;
	}
</style>
