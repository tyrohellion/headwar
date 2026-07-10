<script>
	import { searchEverything } from '../../api/universalSearch';
	import { theme } from '$lib/theme.svelte.js';
	import { afterNavigate } from '$app/navigation';

	import WaDropdown from '@awesome.me/webawesome/dist/components/dropdown/dropdown.js';
	import WaButton from '@awesome.me/webawesome/dist/components/button/button.js';
	import WaButtonGroup from '@awesome.me/webawesome/dist/components/button-group/button-group.js';
	import WaInput from '@awesome.me/webawesome/dist/components/input/input.js';
	import WaDivider from '@awesome.me/webawesome/dist/components/divider/divider.js';
	import WaTooltip from '@awesome.me/webawesome/dist/components/tooltip/tooltip.js';
	import WaSkeleton from '@awesome.me/webawesome/dist/components/skeleton/skeleton.js';
	import WaDrawer from '@awesome.me/webawesome/dist/components/drawer/drawer.js';

	let query = $state('');
	let matchedPlayers = $state([]);
	let matchedTeams = $state([]);
	let isSearching = $state(false);
	let searchWrapperEl = $state(null);
	let isMenuOpen = $state(false);
	let debounceTimer;

	afterNavigate(() => {
		query = '';
		matchedPlayers = [];
		matchedTeams = [];
		isMenuOpen = false;
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
				matchedPlayers = results.players || [];
				matchedTeams = results.teams || [];
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
	<wa-button class="hamburger-btn" size="s" appearance="filled" onclick={() => (isMenuOpen = true)}>
		<wa-icon name="bars" label="Open Menu"></wa-icon>
	</wa-button>

	<div class="nav-buttons desktop-only">
		<a href="/" aria-label="Home">
			<wa-button size="s" variant="brand" appearance="filled">
				<wa-icon name="house" label="Home"></wa-icon>
			</wa-button>
		</a>

		<wa-button-group size="s" label="Players">
			<a href="/players" class="group-lead-anchor">
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
			<a href="/teams" class="group-lead-anchor">
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
	</div>

	<div class="float-right-wrapper">
		<div class="search-wrapper" bind:this={searchWrapperEl}>
			<wa-input
				appearance="filled"
				value={query}
				oninput={handleInput}
				placeholder="Search players or teams..."
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
				</div>
			{:else if matchedPlayers.length > 0 || matchedTeams.length > 0}
				<div class="search-dropdown">
					{#if matchedTeams.length > 0}
						<div class="category-header">Teams</div>
						<wa-divider></wa-divider>
						{#each matchedTeams as team}
							<a href="/teams/{team.id}" class="dropdown-item-link">
								<button class="dropdown-item">
									<img src={team.logo} alt="" class="team-logo-thumb" loading="lazy" />
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
							<a href="/players/{player.id}" class="dropdown-item-link">
								<button class="dropdown-item">
									<img
										src={player.headshot}
										alt=""
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
		</div>

		<wa-tooltip for="color-scheme-button">toggle theme</wa-tooltip>
		<wa-button id="color-scheme-button" size="s" onclick={() => theme.toggle()}>
			<wa-icon name={theme.isDark ? 'sun' : 'moon'} label="Toggle Theme"></wa-icon>
		</wa-button>
	</div>
</div>

<wa-drawer
	label="Navigation"
	open={isMenuOpen}
	onwa-hide={() => (isMenuOpen = false)}
	placement="start"
	class="mobile-drawer"
>
	<div class="mobile-nav-links">
		<a href="/">Home</a>
		<wa-divider></wa-divider>
		<div class="drawer-section-title">Players</div>
		<a href="/players">All Players</a>
		<a href="/players?tab=war">WAR Leaders</a>
		<a href="/players?tab=ops">OPS Leaders</a>
		<a href="/players?tab=era">ERA Leaders</a>
		<wa-divider></wa-divider>
		<div class="drawer-section-title">Teams</div>
		<a href="/teams">All Teams</a>
		<a href="/teams?tab=records">Record Leaders</a>
		<a href="/teams?tab=nl">National League</a>
		<a href="/teams?tab=al">American League</a>
	</div>
</wa-drawer>

<style>
	.nav:has(wa-button:not(:defined)),
	.nav:has(wa-input:not(:defined)),
	.nav:has(wa-icon:not(:defined)) {
		visibility: hidden !important;
		opacity: 0 !important;
	}

	wa-drawer:not(:defined) {
		display: none !important;
	}

	.nav {
		display: flex;
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		padding: 1rem 3rem;
		justify-content: space-between;
		backdrop-filter: blur(6px);
		background-color: color-mix(in srgb, var(--wa-color-surface-default) 85%, transparent);
		box-sizing: border-box;
		z-index: 100;
		align-items: center;
		gap: 1rem;
		transition:
			visibility 0s,
			opacity 150ms ease-out;
	}

	.nav-buttons {
		display: flex;
		gap: 0.5rem;
	}

	/* Absolute rules to hide hamburger and prevent desktop layout pops */
	.hamburger-btn {
		display: none !important;
	}

	.desktop-only {
		display: flex !important;
	}

	.group-lead-anchor {
		text-decoration: none;
	}

	wa-button-group {
		flex-shrink: 0;
	}

	.search-wrapper {
		display: flex;
		gap: 0.5rem;
		position: relative;
		flex-grow: 1;
	}

	wa-input {
		width: 100%;
	}

	.search-dropdown,
	.search-dropdown-skeleton {
		position: absolute;
		top: calc(100% + 0.5rem);
		left: 0;
		width: 100%;
		background: var(--wa-color-surface-raised, #fff);
		border: 1px solid var(--wa-color-border-quiet, #eee);
		border-radius: var(--wa-border-radius-m);
		box-shadow: var(--wa-shadow-m);
		max-height: 400px;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		box-sizing: border-box;
		z-index: 200;
	}

	.search-dropdown {
		padding: 0 0.5rem 0.5rem 0.5rem;
	}

	.search-dropdown-skeleton {
		padding: 1rem;
		gap: 1rem;
	}

	.category-header {
		font-size: 0.7rem;
		font-weight: 800;
		letter-spacing: 0.5px;
		text-transform: uppercase;
		color: var(--wa-color-neutral-text-weak);
		padding: 0.75rem 0.5rem 0.25rem 0.5rem;
		cursor: default;
	}

	.float-right-wrapper {
		display: flex;
		gap: 0.5rem;
		flex-grow: 1;
		max-width: 26rem;
		justify-content: flex-end;
	}

	.dropdown-item-link {
		text-decoration: none;
		color: inherit;
		width: 100%;
	}

	.dropdown-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		width: 100%;
		padding: 0.5rem;
		border: none;
		border-radius: var(--wa-border-radius-s);
		background: transparent;
		text-align: left;
		font-size: 0.95rem;
		cursor: pointer;
		color: var(--wa-color-filled-on-normal);
		transition: background-color 100ms ease;
	}

	.dropdown-item:hover {
		background-color: var(--wa-color-fill-normal, #f5f5f5);
	}

	.player-thumb {
		width: 32px;
		height: 32px;
		object-fit: cover;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.team-logo-thumb {
		width: 32px;
		height: 32px;
		background-color: var(--wa-color-gray-80);
		padding: 4px;
		object-fit: contain;
		flex-shrink: 0;
	}

	.item-name {
		flex-grow: 1;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.sub-text {
		font-size: 0.8rem;
		color: var(--wa-color-neutral-text-weak);
		margin-left: 0.25rem;
	}

	.mobile-nav-links {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.mobile-nav-links a {
		color: var(--wa-color-filled-on-normal);
		text-decoration: none;
		font-weight: 600;
		font-size: var(--wa-font-size-m);
		padding: 0.5rem;
		border-radius: var(--wa-border-radius-s);
	}

	.mobile-nav-links a:hover {
		background-color: var(--wa-color-fill-normal);
	}

	.drawer-section-title {
		font-size: 0.7rem;
		font-weight: bold;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		color: var(--wa-color-neutral-text-weak);
		margin: 0.75rem 0.5rem 0.25rem 0.5rem;
	}

	.mobile-drawer {
		--size: min(300px, 80vw);
	}

	/* Screen Queries */
	@media (max-width: 816px) {
		.nav {
			padding: 1rem;
			gap: 0.5rem;
		}

		.desktop-only {
			display: none !important;
		}

		.hamburger-btn {
			display: inline-block !important;
		}
	}

	@media (max-width: 450px) {
		.float-right-wrapper {
			flex-grow: 1;
		}
		.search-wrapper {
			flex-grow: 1;
		}
	}
</style>
