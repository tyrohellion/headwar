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

	.hamburger-btn {
		display: none !important;
	}

	.desktop-only {
		display: flex !important;
	}

	.nav-buttons {
		display: flex;
		gap: 0.5rem;
	}

	wa-button-group {
		flex-shrink: 0;
	}

	.search-wrapper {
		display: flex;
		gap: 0.5rem;
		position: relative;
		max-width: none;
		flex-grow: 1;
	}

	wa-input {
		width: 100%;
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
		box-sizing: border-box;
	}

	.search-dropdown-skeleton {
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
		padding-top: 1rem;
		display: flex;
		gap: 2rem;
		flex-direction: column;
		box-sizing: border-box;
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

	.float-right-wrapper {
		display: flex;
		gap: 0.5rem;
		flex-grow: 1;
		max-width: 26rem;
		justify-content: flex-end;
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
		color: var(--wa-color-neutral-text-weak);
		margin-left: 0.25rem;
	}

	.nav-buttons :global(a) {
		text-decoration: none;
	}

	.hamburger-btn {
		display: none;
	}

	.mobile-nav-links {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 0.5rem;
	}

	.mobile-nav-links a {
		color: var(--wa-color-on-blue);
		text-decoration: none;
		font-weight: 700;
		font-family: var(--font-mono);
		font-size: var(--wa-font-size-m);
		padding: 0.5rem;
	}

	.drawer-section-title {
		font-size: 0.75rem;
		font-weight: bold;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		color: var(--wa-color-neutral-text-weak);
		margin-top: 0.5rem;
		border-bottom: 1px;
	}

	.mobile-drawer {
		--size: min(300px, 80vw);
	}

	@media (max-width: 816px) {
		.nav {
			padding: 1rem 1rem;
			gap: 0.5rem;
		}

		.desktop-only {
			display: none !important;
		}

		.hamburger-btn {
			display: inline-block !important;
			flex-shrink: 0;
		}

		#color-scheme-button {
			flex-shrink: 0;
		}
	}

	@media (max-width: 450px) {
		.float-right-wrapper {
			flex-grow: 1;
		}

		.search-wrapper {
			max-width: none;
			flex-grow: 1;
		}
	}
</style>
