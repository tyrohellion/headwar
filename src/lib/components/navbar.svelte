<script>
	import { searchEverything } from '../../api/universalSearch';
	import { theme } from '$lib/theme.svelte.js';
	import { afterNavigate } from '$app/navigation';

	import WaDropdown from '@awesome.me/webawesome/dist/components/dropdown/dropdown.js';
	import WaButton from '@awesome.me/webawesome/dist/components/button/button.js';
	import WaButtonGroup from '@awesome.me/webawesome/dist/components/button-group/button-group.js';
	import WaInput from '@awesome.me/webawesome/dist/components/input/input.js';
	import WaOption from '@awesome.me/webawesome/dist/components/option/option.js';
	import WaDivider from '@awesome.me/webawesome/dist/components/divider/divider.js';
	import WaTooltip from '@awesome.me/webawesome/dist/components/tooltip/tooltip.js';
	import WaSkeleton from '@awesome.me/webawesome/dist/components/skeleton/skeleton.js';

	let query = $state('');
	let matchedPlayers = $state([]);
	let matchedTeams = $state([]);
	let isSearching = $state(false);
	let searchWrapperEl = $state(null);
	let debounceTimer;

	afterNavigate(() => {
		query = '';
		matchedPlayers = [];
		matchedTeams = [];
	});

	async function handleInput(e) {
		query = e.target.value;
		const cleanQuery = query.trim();

		clearTimeout(debounceTimer);

		if (cleanQuery.length < 2) {
			matchedPlayers = [];
			matchedTeams = [];
			isSearching = false;
			return;
		}

		debounceTimer = setTimeout(async () => {
			isSearching = true;
			try {
				const results = await searchEverything(cleanQuery);
				matchedPlayers = results.players;
				matchedTeams = results.teams;
			} catch (err) {
				console.error('Universal lookup failed:', err);
			} finally {
				isSearching = false;
			}
		}, 300);
	}
</script>

<svelte:window
	onclick={(e) => {
		if (searchWrapperEl && !searchWrapperEl.contains(e.target)) {
			matchedPlayers = [];
			matchedTeams = [];
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

		{#if isSearching}
			<div class="search-dropdown-skeleton">
				<wa-skeleton effect="pulse"></wa-skeleton>
				<wa-skeleton effect="pulse"></wa-skeleton>
				<wa-skeleton effect="pulse"></wa-skeleton>
				<wa-skeleton effect="pulse"></wa-skeleton>
				<wa-skeleton effect="pulse"></wa-skeleton>
			</div>
		{:else if matchedPlayers.length > 0 || matchedTeams.length > 0}
			<div class="search-dropdown">
				{#if matchedTeams.length > 0}
					<div class="category-header">Teams</div>
					<wa-divider></wa-divider>
					{#each matchedTeams as team}
						<a href="/teams/{team.id}">
							<button class="dropdown-item">
								<img
									src={team.logo}
									alt="{team.name} logo"
									class="team-logo-thumb"
									loading="lazy"
								/>
								<span class="item-name">
									{team.name}
									{#if team.abbreviation}<span class="sub-text">({team.abbreviation})</span>{/if}
								</span>
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
									src={player.headshot}
									alt="playerHeadshot"
									class="player-thumb"
									loading="lazy"
									onerror={(e) =>
										(e.target.src =
											'https://img.mlbstatic.com/mlb-photos/image/upload/w_50,d_people:generic:headshot:67:current.png/v1/people/generic/headshot/67/current')}
								/>
								<span class="item-name">
									{player.name}
									<span class="sub-text"> - {player.position}</span>
								</span>
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
		max-width: 368px;
	}

	wa-input {
		width: 320px;
	}

	.search-dropdown {
		position: absolute;
		top: calc(100% + 0.5rem);
		left: 0;
		width: 320px;
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

	.search-dropdown-skeleton {
		position: absolute;
		top: calc(100% + 0.5rem);
		left: 0;
		width: 320px;
		padding: 0 1rem 1rem 1rem;
		background: var(--wa-color-surface-raised);
		border: 1px solid var(--wa-color-border-quiet);
		border-radius: var(--wa-border-radius-m);
		box-shadow: var(--wa-shadow-m);
		max-height: 400px;
		overflow-y: auto;
		padding-top: 1rem;
		display: flex;
		gap: 2rem;
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
		gap: 0.75rem;
		width: 100%;
		height: min-content;
		padding: 0.5rem 1rem;
		border: none;
		border-radius: var(--wa-border-radius-m);
		background: transparent;
		text-align: left;
		font-family: var(--wa-font-family-body);
		font-size: 1rem;
		cursor: pointer;
		color: var(--wa-color-primary-on-quiet);
		transition: all 100ms ease;
		overflow: hidden;
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
		flex-shrink: 0;
	}

	.team-logo-thumb {
		max-width: 32px;
		width: 32px;
		height: auto;
		max-height: 32px;
		background-color: var(--wa-color-gray-70);
		padding: 6px;
		box-shadow: var(--wa-shadow-l);
		object-fit: contain;
		flex-shrink: 0;
	}

	.item-name {
		flex-grow: 1;
		white-space: nowrap;
		overflow: hidden;
		mask-image: linear-gradient(to right, black calc(100% - 24px), transparent 100%);
		-webkit-mask-image: linear-gradient(to right, black calc(100% - 24px), transparent 100%);
	}

	.sub-text {
		font-size: 0.8rem;
		color: var(--wa-color-neutral-text-weak, #777);
		margin-left: 0.25rem;
	}

	.nav-buttons :global(a) {
		text-decoration: none;
	}
</style>
