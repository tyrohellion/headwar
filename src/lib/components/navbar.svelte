<script>
  import { createDebouncedSearch } from "../../api/universalSearch";
  import { theme } from "$lib/theme.svelte.js";
  import { afterNavigate } from "$app/navigation";
  import { tick } from "svelte";

  import WaButton from "@awesome.me/webawesome/dist/components/button/button.js";
  import WaInput from "@awesome.me/webawesome/dist/components/input/input.js";
  import WaDivider from "@awesome.me/webawesome/dist/components/divider/divider.js";
  import WaBadge from "@awesome.me/webawesome/dist/components/badge/badge.js";
  import WaDrawer from "@awesome.me/webawesome/dist/components/drawer/drawer.js";
  import WaSpinner from "@awesome.me/webawesome/dist/components/spinner/spinner.js";
  import PlayerCard from "$lib/components/playerCard.svelte";
  import TeamCard from "$lib/components/teamCard.svelte";

  let query = $state("");
  let matchedPlayers = $state([]);
  let matchedTeams = $state([]);
  let isSearching = $state(false);
  let isSearchOpen = $state(false);
  let searchFieldEl = $state(null);

  const searchInput = createDebouncedSearch(
    (results) => {
      matchedPlayers = results.players || [];
      matchedTeams = results.teams || [];
    },
    {
      onStateChange: (searching) => {
        isSearching = searching;
      },
    },
  );

  afterNavigate(() => {
    query = "";
    matchedPlayers = [];
    matchedTeams = [];
    isSearchOpen = false;
    searchInput.reset();
  });

  function handleInput(e) {
    query = e.target.value;
    searchInput(e.target.value);
  }

  function openSearch() {
    isSearchOpen = true;
  }

  async function focusSearchField() {
    await tick();
    // wa-input exposes focus() once defined; fall back to inner input
    try {
      searchFieldEl?.focus?.();
    } catch {
      document.getElementById("global-search-input")?.focus();
    }
  }

  function handleKeydown(e) {
    // Press "/" anywhere (outside an input) to jump to search
    if (
      e.key === "/" &&
      !isSearchOpen &&
      !/INPUT|TEXTAREA/.test(document.activeElement?.tagName ?? "")
    ) {
      e.preventDefault();
      openSearch();
    }
  }

  const hasResults = $derived(
    matchedPlayers.length > 0 || matchedTeams.length > 0,
  );
  const showEmpty = $derived(
    !isSearching && query.trim().length >= 2 && !hasResults,
  );
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="bottom-blur" aria-hidden="true"></div>
<nav class="bottom-nav" aria-label="Primary">
  <a href="/" aria-label="Home" class="nav-icon-link">
    <wa-button
      size="m"
      variant="brand"
      appearance="filled"
      class="nav-round-btn"
    >
      <wa-icon name="house" label="Home"></wa-icon>
    </wa-button>
  </a>

  <button class="search-trigger" onclick={openSearch} aria-label="Open search">
    <wa-icon name="magnifying-glass" label="Search"></wa-icon>
    <span class="search-trigger-text">
      {query ? query : "Search players or teams..."}
    </span>
    <kbd class="search-trigger-kbd">/</kbd>
  </button>

  <wa-button
    size="m"
    appearance="filled"
    onclick={() => theme.toggle()}
    class="nav-round-btn"
    aria-label="Toggle theme"
  >
    <wa-icon name={theme.isDark ? "sun" : "moon"} label="Toggle Theme"
    ></wa-icon>
  </wa-button>
</nav>

<wa-drawer
  open={isSearchOpen}
  onwa-hide={() => (isSearchOpen = false)}
  onwa-after-show={focusSearchField}
  placement="bottom"
  class="search-drawer"
  light-dismiss
  without-header
>
  <div class="search-results">
    {#if isSearching}
      <wa-spinner></wa-spinner>
    {:else if hasResults}
      {#if matchedTeams.length > 0}
        <div class="category-header">Teams</div>
        <wa-divider></wa-divider>
        <div class="card-result-list">
          {#each matchedTeams as team}
            <TeamCard {team} />
          {/each}
        </div>
      {/if}

      {#if matchedPlayers.length > 0}
        <div class="category-header">Players</div>
        <wa-divider></wa-divider>
        <div class="card-result-list">
          {#each matchedPlayers as player}
            <PlayerCard
              player={{
                person: { id: player.id, fullName: player.name },
                position: { name: player.position },
              }}
              extraBadges={player.currentTeam ? [player.currentTeam] : []}
            />
          {/each}
        </div>
      {/if}
    {:else if showEmpty}
      <div class="empty-state">
        <p>No players or teams found for “{query.trim()}”.</p>
      </div>
    {:else}
      <div class="empty-state hint">
        <p>Type at least 2 characters to search across MLB + minors.</p>
      </div>
    {/if}
  </div>

  <div class="search-bottom-row">
    <wa-input
      pill
      with-clear
      id="global-search-input"
      bind:this={searchFieldEl}
      appearance="filled"
      size="m"
      value={query}
      oninput={handleInput}
      placeholder="Search players or teams..."
      autocomplete="off"
      enterkeyhint="search"
      class="search-field"
    >
      <wa-icon name="magnifying-glass" slot="start"></wa-icon>
    </wa-input>
    <div class="search-close-group">
      <kbd class="esc-kbd" title="Press esc to close">esc</kbd>
      <wa-button
        size="m"
        appearance="plain"
        onclick={() => (isSearchOpen = false)}
        aria-label="Close search"
      >
        <wa-icon name="xmark" label="Close"></wa-icon>
      </wa-button>
    </div>
  </div>
</wa-drawer>

<style>
  .bottom-nav:has(wa-button:not(:defined)),
  .bottom-nav:has(wa-icon:not(:defined)) {
    visibility: hidden !important;
    opacity: 0 !important;
  }

  wa-drawer:not(:defined) {
    display: none !important;
  }

  a {
    text-decoration: none;
  }

  .bottom-blur {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 7rem;
    pointer-events: none;
    z-index: 99;
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    mask-image: linear-gradient(to top, black 0%, transparent 100%);
    -webkit-mask-image: linear-gradient(to top, black 0%, transparent 100%);
    background: linear-gradient(
      to top,
      rgb(0 0 0 / 0.6),
      rgb(0 0 0 / 0.3) 55%,
      transparent
    );
  }

  .bottom-nav {
    --nav-control-height: 2.75rem;
    position: fixed;
    bottom: max(1rem, env(safe-area-inset-bottom));
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: stretch;
    gap: 0.75rem;
    background: transparent;
    border: none;
    box-shadow: none;
    padding: 0;
    z-index: 100;
    width: max-content;
    max-width: calc(100vw - 2rem);
    box-sizing: border-box;
    transition:
      visibility 0s,
      opacity 150ms ease-out;
  }

  .nav-icon-link {
    display: flex;
    flex-shrink: 0;
  }

  .bottom-nav :global(.nav-round-btn),
  .bottom-nav :global(.nav-round-btn::part(base)) {
    height: var(--nav-control-height);
    min-height: var(--nav-control-height);
  }

  .bottom-nav :global(.nav-round-btn::part(base)) {
    border-radius: 999px;
    box-shadow: var(--wa-shadow-l);
    border: 1px solid var(--wa-color-border-quiet);
  }

  .search-trigger {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    flex: 1 1 auto;
    min-width: min(38vw, 12rem);
    width: min(44vw, 26rem);
    max-width: 26rem;
    height: var(--nav-control-height);
    min-height: var(--nav-control-height);
    box-sizing: border-box;
    padding: 0 1rem;
    border-radius: 999px;
    border: 1px solid var(--wa-color-border-quiet);
    box-shadow: var(--wa-shadow-l);
    background-color: color-mix(
      in srgb,
      var(--wa-color-surface-default) 85%,
      transparent
    );
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    color: var(--wa-color-neutral-text-weak);
    font-family: var(--wa-font-family-body);
    font-size: 0.95rem;
    cursor: text;
    transition: all 120ms ease;
    white-space: nowrap;
    overflow: hidden;
  }

  .search-trigger:hover {
    background: var(--wa-color-neutral-fill-normal);
    color: var(--wa-color-text-normal);
    transform: scale(1.01);
  }

  .search-trigger:active {
    transform: scale(0.99);
  }

  .search-trigger-text {
    flex: 1;
    text-align: left;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .search-trigger-kbd {
    font-family: var(--font-mono, monospace);
    font-size: 0.75rem;
    border: 1px solid var(--wa-color-border-quiet);
    border-radius: 6px;
    padding: 0.05rem 0.4rem;
    flex-shrink: 0;
    opacity: 0.7;
  }

  .search-drawer {
    --size: 65dvh;
  }

  .search-drawer::part(dialog) {
    border-radius: var(--wa-border-radius-l) var(--wa-border-radius-l) 0 0;
    border: 1px solid var(--wa-color-border-quiet);
    border-bottom: none;
    box-shadow: var(--wa-shadow-xl);
    background-color: var(--wa-color-surface-default);
  }

  .esc-kbd {
    font-family: var(--font-mono, monospace);
    font-size: 0.75rem;
    border: 1px solid var(--wa-color-border-quiet);
    border-radius: 6px;
    padding: 0.05rem 0.4rem;
    opacity: 0.7;
    cursor: default;
    height: min-content;
    align-self: center;
    flex-shrink: 0;
  }

  .search-bottom-row {
    display: flex;
    align-items: center;
    gap: 2rem;
    flex-shrink: 0;
    padding-top: 0.75rem;
  }

  .search-close-group {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-left: auto;
    flex-shrink: 0;
  }

  .search-field {
    flex: 1;
    min-width: 0;
  }

  .search-field::part(input) {
    font-size: inherit;
  }

  .search-drawer::part(body) {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
    margin: 0 auto;
    box-sizing: border-box;
    padding-bottom: 1rem;
  }

  .search-results {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    overflow-y: auto;
  }

  .category-header {
    font-size: 0.8rem;
    font-weight: 600;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    padding: 1rem 0.5rem 0 0.5rem;
    cursor: default;
  }

  .card-result-list {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .empty-state {
    padding: 2rem 1rem;
    text-align: center;
    border: 1px dashed var(--wa-color-border-quiet);
    border-radius: var(--wa-border-radius-m);
    color: var(--wa-color-neutral-on-quiet);
    margin-top: 0.5rem;
  }

  .empty-state p {
    margin: 0;
  }

  @media (max-width: 768px) {
    .esc-kbd {
      display: none;
    }

    .search-drawer {
      --size: 100dvh;
    }

    .search-drawer::part(dialog) {
      border-radius: 0;
      border: none;
    }
  }

  @media (max-width: 480px) {
    .bottom-nav {
      gap: 0.6rem;
      bottom: max(0.75rem, env(safe-area-inset-bottom));
    }

    .search-trigger {
      min-width: 0;
      width: 52vw;
      font-size: 0.9rem;
    }

    .search-trigger-kbd {
      display: none;
    }
  }
</style>
