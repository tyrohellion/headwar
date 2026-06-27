<script>
	import { getPlayerHeadshot, teams, searchPlayers } from '../../api/universalSearch';
	import { theme } from '$lib/theme.svelte.js';
	import { afterNavigate } from '$app/navigation';

	import WaDropdown from '@awesome.me/webawesome/dist/components/dropdown/dropdown.js';
	import WaButton from '@awesome.me/webawesome/dist/components/button/button.js';
	import WaButtonGroup from '@awesome.me/webawesome/dist/components/button-group/button-group.js';
	import WaInput from '@awesome.me/webawesome/dist/components/input/input.js';
	import WaOption from '@awesome.me/webawesome/dist/components/option/option.js';
	import WaDivider from '@awesome.me/webawesome/dist/components/divider/divider.js';
	import WaTooltip from '@awesome.me/webawesome/dist/components/tooltip/tooltip.js';

	let query = $state('');
	let matchedPlayers = $state([]);
	let isSearching = $state(false);
	let searchWrapperEl = $state(null);

	let matchedTeams = $derived.by(() => {
		const cleanQuery = query.trim().toLowerCase();
		if (cleanQuery.length < 2) return [];
		return teams.filter(
			(t) =>
				t.name.toLowerCase().includes(cleanQuery) ||
				t.abbreviation.toLowerCase().includes(cleanQuery)
		);
	});

	afterNavigate(() => {
		query = '';
		matchedPlayers = [];
	});

	async function handleInput(e) {
		query = e.target.value;
		const cleanQuery = query.trim();

		if (cleanQuery.length < 2) {
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
</script>

<svelte:window
	onclick={(e) => {
		if (searchWrapperEl && !searchWrapperEl.contains(e.target)) {
			matchedTeams = [];
			matchedPlayers = [];
		}
	}}
/>

<div class="nav">
	<div class="nav-buttons">
		<a href="/" aria-label="Home">
			<wa-button size="s" variant="brand" appearance="filled">
				<wa-icon name="house" label="Home"></wa-icon>
			</wa-button>
		</a>

		<wa-button-group size="s" label="Players">
			<a href="/players">
				<wa-button size="s" appearance="filled">Players</wa-button>
			</a>
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
			<a href="/teams">
				<wa-button size="s" appearance="filled">Teams</wa-button>
			</a>
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
			<a href="/games">
				<wa-button size="s" appearance="filled">Games</wa-button>
			</a>
			<wa-dropdown size="s" placement="bottom">
				<wa-button size="s" appearance="filled" slot="trigger">
					<wa-icon name="chevron-down" label="More options"></wa-icon>
				</wa-button>
				<wa-dropdown-item>Live Games</wa-dropdown-item>
				<wa-dropdown-item>Finished Games</wa-dropdown-item>
			</wa-dropdown>
		</wa-button-group>
	</div>

	<div class="search-wrapper" bind:this={searchWrapperEl}>
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
				{#if matchedTeams.length > 0}
					<div class="category-header">Teams</div>
					<wa-divider></wa-divider>
					{#each matchedTeams as team}
						<a href="/teams/{team.id}">
							<button class="dropdown-item">
								<span class="team-abbr">{team.abbreviation}</span>
								<span class="item-name">{team.name}</span>
							</button>
						</a>
					{/each}
				{/if}

				{#if matchedPlayers.length > 0}
					<div class="category-header">Players</div>
					<wa-divider></wa-divider>
					{#each matchedPlayers as player}
						<a href="/players/{player.id}">
							<button class="dropdown-item">
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
						</a>
					{/each}
				{/if}
			</div>
		{/if}
		<wa-tooltip for="color-scheme-button">toggle theme</wa-tooltip>
		<wa-button id="color-scheme-button" size="s" onclick={() => theme.toggle()}>
			<wa-icon name={theme.isDark ? 'sun' : 'moon'} label="Toggle Theme"></wa-icon>
		</wa-button>
	</div>
</div>

<style>
	a {
		text-decoration: none;
		color: var(--wa-color-on-blue);
	}

	a:hover {
		text-decoration: underline;
	}

	.nav {
		display: flex;
		position: fixed;
		top: 0;
		left: 0;
		padding: 1rem 3rem;
		width: 100%;
		justify-content: space-between;
		backdrop-filter: blur(6px);
		background-color: color-mix(in srgb, var(--wa-color-surface-default) 85%, transparent);
		box-sizing: border-box;
		z-index: 100;
	}

	.nav-buttons {
		display: flex;
		gap: 0.5rem;
	}

	.search-wrapper {
		display: flex;
		gap: 0.5rem;
		position: relative;
		width: 280px;
	}

	.search-dropdown {
		position: absolute;
		top: calc(100% + 0.5rem);
		left: 0;
		width: 100%;
		padding: 0 1rem 1rem 1rem;
		background: var(--wa-color-surface-raised);
		border: 1px solid var(--wa-color-border-quiet);
		border-radius: var(--wa-border-radius-m);
		box-shadow: var(--wa-shadow-m);
		max-height: 400px;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
	}

	.category-header {
		font-size: 0.7rem;
		font-weight: 800;
		letter-spacing: 0.5px;
		text-transform: uppercase;
		color: var(--wa-color-brand-on-quiet);
		font-family: var(--wa-font-family-body);
		padding: 1rem 1rem 0 1rem;
		background: var(--wa-color-surface-raised);
		cursor: default;
	}

	.dropdown-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
		height: min-content;
		padding: 0.5rem 1rem 0.5rem 1rem;
		border: none;
		border-radius: var(--wa-border-radius-m);
		background: transparent;
		text-align: left;
		font-family: var(--wa-font-family-body);
		font-size: 1rem;
		cursor: pointer;
		color: var(--wa-color-primary-on-quiet);
		transition: all 100ms ease;
	}

	.dropdown-item:hover {
		background-color: var(--wa-color-neutral-fill-normal);
		transform: scale(1.03);
		transition: all 100ms ease;
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
		padding: 0.2rem 0.3rem 0.2rem 0.3rem;
		border-radius: 3px;
		min-width: 32px;
		text-align: center;
	}

	.item-name {
		flex-grow: 1;
	}
</style>
