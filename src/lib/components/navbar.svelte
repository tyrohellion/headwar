<script>
  import { createDebouncedSearch, PAGE_SIZE } from "../../api/universalSearch";
  import { theme } from "$lib/theme.svelte.js";
  import { afterNavigate } from "$app/navigation";
  import { tick } from "svelte";
  import { fly, fade } from "svelte/transition";

  import WaButton from "@awesome.me/webawesome/dist/components/button/button.js";
  import WaInput from "@awesome.me/webawesome/dist/components/input/input.js";
  import WaDivider from "@awesome.me/webawesome/dist/components/divider/divider.js";
  import WaBadge from "@awesome.me/webawesome/dist/components/badge/badge.js";
  import WaSpinner from "@awesome.me/webawesome/dist/components/spinner/spinner.js";
  import PlayerCard from "$lib/components/playerCard.svelte";
  import TeamCard from "$lib/components/teamCard.svelte";

  let query = $state("");
  let matchedPlayers = $state([]);
  let matchedTeams = $state([]);
  let totalPlayers = $state(0);
  let totalTeams = $state(0);
  let hasMorePlayers = $state(false);
  let minorsExpanded = $state(false);
  let nonDebutExpanded = $state(false);
  let isSearching = $state(false);
  let isSearchOpen = $state(false);
  let searchTriggerEl = $state(null);
  let resultsContainerEl = $state(null);

  const searchInput = createDebouncedSearch(
    (results) => {
      matchedPlayers = results.players || [];
      matchedTeams = results.teams || [];
      totalPlayers = results.totalPlayers || 0;
      totalTeams = results.totalTeams || 0;
      hasMorePlayers = !!results.hasMore;
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
    totalPlayers = 0;
    totalTeams = 0;
    hasMorePlayers = false;
    minorsExpanded = false;
    nonDebutExpanded = false;
    isSearchOpen = false;
    searchInput.reset();
  });

  function handleInput(e) {
    query = e.target.value;
    isSearchOpen = true;
    minorsExpanded = false;
    nonDebutExpanded = false;
    searchInput(e.target.value);
  }

  function openSearch() {
    isSearchOpen = true;
    tick().then(() => searchTriggerEl?.focus?.());
  }

  function closeSearch() {
    isSearchOpen = false;
  }

  // Preload the next page a little before the user actually hits the bottom
  // (YouTube-style) so the reveal feels seamless. `loadMore()` is idempotent,
  // so firing this on every scroll event is harmless.
  const RESULTS_PRELOAD = 300;

  function handleResultsScroll() {
    if (!hasMorePlayers || !resultsContainerEl) return;
    const { scrollTop, scrollHeight, clientHeight } = resultsContainerEl;
    if (scrollHeight - scrollTop - clientHeight < RESULTS_PRELOAD) {
      searchInput.loadMore();
    }
  }

  function handleKeydown(e) {
    if (e.key === "Escape" && isSearchOpen) {
      e.preventDefault();
      closeSearch();
      return;
    }
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
  const mlbTeams = $derived(matchedTeams.filter((t) => t.sportId === 1));
  const minorTeams = $derived(matchedTeams.filter((t) => t.sportId !== 1));
  const mlbPlayers = $derived(matchedPlayers.filter((p) => p.hasMLBDebut));
  const noDebutPlayers = $derived(matchedPlayers.filter((p) => !p.hasMLBDebut));

  const toggleMinors = () => {
    minorsExpanded = !minorsExpanded;
  };
  const toggleNonDebut = () => {
    nonDebutExpanded = !nonDebutExpanded;
  };
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

  <wa-input
    pill
    bind:this={searchTriggerEl}
    class="search-trigger"
    placeholder="Search players or teams..."
    value={query}
    oninput={handleInput}
    onfocusin={openSearch}
    autocomplete="off"
    enterkeyhint="search"
    aria-label="Search players or teams"
  >
    <wa-icon name="magnifying-glass" label="Search" slot="start"></wa-icon>
    <kbd class="search-trigger-kbd" slot="end">/</kbd>
  </wa-input>

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

{#if isSearchOpen}
  <div
    class="search-backdrop"
    role="presentation"
    onclick={closeSearch}
    transition:fade={{ duration: 150 }}
  ></div>
  <div
    class="search-modal"
    role="dialog"
    aria-label="Search results"
    transition:fly={{ y: 12, duration: 180 }}
  >
    <div class="search-modal-top">
      <div class="search-close-group">
        <kbd class="esc-kbd" title="Press esc to close">esc</kbd>
        <wa-button
          size="m"
          appearance="plain"
          onclick={closeSearch}
          aria-label="Close search"
        >
          <wa-icon name="xmark" label="Close"></wa-icon>
        </wa-button>
      </div>
    </div>

    <div
      class="search-results"
      bind:this={resultsContainerEl}
      onscroll={handleResultsScroll}
    >
      {#if isSearching}
        <wa-spinner></wa-spinner>
      {:else if hasResults}
        {#if matchedTeams.length > 0}
          <div class="category-header">
            Teams
            <span class="category-header-count">{totalTeams}</span>
          </div>
          <div class="card-result-list">
            {#each mlbTeams as team}
              <TeamCard {team} />
            {/each}

            {#if minorTeams.length > 0 && !minorsExpanded}
              {@render moreToggleCard({
                expanded: minorsExpanded,
                count: minorTeams.length,
                label: "AAA or lower",
                onToggle: toggleMinors,
              })}
            {/if}
          </div>

          {#if minorTeams.length > 0 && minorsExpanded}
            <div class="card-result-list minors-list">
              {#each minorTeams as team}
                <TeamCard {team} />
              {/each}
              {@render moreToggleCard({
                expanded: minorsExpanded,
                count: minorTeams.length,
                label: "AAA or lower",
                onToggle: toggleMinors,
              })}
            </div>
          {/if}
        {/if}

        {#if matchedPlayers.length > 0}
          <div class="category-header">
            Players
            <span class="category-header-count">
              {totalPlayers >= PAGE_SIZE ? `${PAGE_SIZE}+` : totalPlayers}
            </span>
          </div>
          <div class="card-result-list">
            {#each mlbPlayers as player}
              {@render playerCardFor(player)}
            {/each}

            {#if noDebutPlayers.length > 0 && !nonDebutExpanded}
              {@render moreToggleCard({
                expanded: nonDebutExpanded,
                count: noDebutPlayers.length,
                label: "no MLB debut",
                onToggle: toggleNonDebut,
                wide: true,
              })}
            {/if}
          </div>

          {#if noDebutPlayers.length > 0 && nonDebutExpanded}
            <div class="card-result-list minors-list">
              {#each noDebutPlayers as player}
                {@render playerCardFor(player)}
              {/each}
              {@render moreToggleCard({
                expanded: nonDebutExpanded,
                count: noDebutPlayers.length,
                label: "no MLB debut",
                onToggle: toggleNonDebut,
                wide: true,
              })}
            </div>
          {/if}
        {/if}
      {:else if showEmpty}
        <div class="empty-state">
          <p>No players or teams found for "{query.trim()}".</p>
        </div>
      {:else}
        <div class="empty-state hint">
          <p>Type at least 2 characters to search across MLB + minors.</p>
        </div>
      {/if}
    </div>
  </div>
{/if}

{#snippet moreToggleCard({ expanded, count, label, onToggle, wide = false })}
  <button
    type="button"
    class="minors-toggle-card"
    class:player-toggle-card={wide}
    aria-expanded={expanded}
    onclick={onToggle}
  >
    <div class="minors-toggle-tile">
      <wa-icon
        class="minors-chevron"
        name={expanded ? "chevron-up" : "chevron-down"}
      ></wa-icon>
    </div>
    <span class="minors-toggle-title">
      {expanded ? "Collapse" : `${count} more ${label}`}
    </span>
  </button>
{/snippet}

{#snippet playerCardFor(player)}
  <PlayerCard
    player={{
      person: { id: player.id, fullName: player.name },
      position: { name: player.position },
    }}
    extraBadges={player.currentTeam ? [player.currentTeam] : []}
  />
{/snippet}

<style>
  .bottom-nav:has(wa-button:not(:defined)),
  .bottom-nav:has(wa-input:not(:defined)),
  .bottom-nav:has(wa-icon:not(:defined)) {
    visibility: hidden !important;
    opacity: 0 !important;
  }

  a {
    text-decoration: none;
  }

  .bottom-blur {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 6rem;
    pointer-events: none;
    z-index: 99;
    mask-image: linear-gradient(to top, black 0%, transparent 100%);
    -webkit-mask-image: linear-gradient(to top, black 0%, transparent 100%);
    background: linear-gradient(
      to top,
      rgb(0 0 0 / 0.9),
      rgb(0 0 0 / 0.55) 55%,
      transparent
    );
  }

  .bottom-nav {
    --nav-control-height: 2.75rem;
    position: fixed;
    bottom: max(1.5rem, env(safe-area-inset-bottom));
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: stretch;
    gap: 0.75rem;
    background: transparent;
    border: none;
    box-shadow: none;
    padding: 0;
    z-index: 102;
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
    flex: 1 1 auto;
    min-width: min(38vw, 12rem);
    width: min(44vw, 26rem);
    max-width: 26rem;
    margin: 0;
    cursor: text;
  }

  .search-trigger::part(base) {
    height: var(--nav-control-height);
    min-height: var(--nav-control-height);
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
    font-size: 0.95rem;
    cursor: text;
    transition: all 120ms ease;
  }

  .search-trigger:hover::part(base) {
    background: var(--wa-color-neutral-fill-normal);
    color: var(--wa-color-text-normal);
  }

  .search-trigger:active::part(base) {
    transform: scale(0.99);
  }

  .search-trigger:focus-within::part(base) {
    outline-color: var(--wa-color-focus);
    outline-offset: var(--wa-focus-ring-offset);
  }

  .search-trigger-kbd {
    font-family: var(--font-mono, monospace);
    font-size: 0.72rem;
    border: 1px solid var(--wa-color-border-quiet);
    border-radius: 6px;
    padding: 0.05rem 0.4rem;
    flex-shrink: 0;
    opacity: 0.7;
    margin-right: 0.25rem;
  }

  .search-backdrop {
    position: fixed;
    inset: 0;
    background: var(--wa-color-overlay-modal);
    z-index: 101;
  }

  .search-modal {
    position: fixed;
    left: 0;
    right: 0;
    margin: 0 auto;
    bottom: calc(max(1.5rem, env(safe-area-inset-bottom)) + 2.75rem + 0.75rem);
    height: min(80dvh, 42rem);
    max-height: calc(
      100dvh - max(1.5rem, env(safe-area-inset-bottom)) - 4.5rem
    );
    width: min(80dvw);
    z-index: 103;
    display: flex;
    flex-direction: column;
    background-color: var(--wa-color-surface-default);
    border: 1px solid var(--wa-color-border-quiet);
    border-radius: var(--wa-border-radius-l);
    padding: 0 2rem 2rem;
    box-shadow:
      0 0.75rem 2rem -0.5rem var(--wa-color-shadow),
      var(--wa-shadow-l);
    overflow: hidden;
  }

  .search-modal-top {
    display: flex;
    justify-content: flex-end;
    flex-shrink: 0;
    padding: 0.75rem 0 0.25rem;
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

  .search-close-group {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-shrink: 0;
  }

  .search-results {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    overflow-y: auto;
  }

  .category-header {
    position: sticky;
    top: 0;
    z-index: 1;
    background-color: var(--wa-color-surface-default);
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.6rem 0 0.45rem;
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--wa-color-text-quiet);
    cursor: default;
  }

  .category-header::after {
    content: "";
    flex: 1;
    height: 1px;
    background: var(--wa-color-border-quiet);
  }

  .category-header-count {
    font-variant-numeric: tabular-nums;
    background-color: var(--wa-color-surface-lowered);
    color: var(--wa-color-text-quiet);
    border: 1px solid var(--wa-color-border-quiet);
    border-radius: 999px;
    padding: 0.06rem 0.5rem;
    font-size: 0.65rem;
    font-weight: 600;
    letter-spacing: 0;
    text-transform: none;
    flex-shrink: 0;
  }

  .card-result-list {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    padding: 1rem 0;
  }

  .minors-list {
    padding-top: 0.5rem;
  }

  .minors-toggle-card {
    display: flex;
    align-items: center;
    justify-content: left;
    gap: 1rem;
    width: 296px;
    height: 85.8px;
    padding: 1rem;
    box-sizing: border-box;
    border-radius: var(--wa-border-radius-s);
    border: 1px solid
      var(--wa-color-border-quiet, var(--wa-color-brand-border-loud));
    background: transparent;
    font-family: inherit;
    color: inherit;
    text-align: left;
    cursor: pointer;
    transition: all 100ms ease;
  }

  .minors-toggle-card:hover {
    transform: scale(1.03);
    background-color: var(--wa-color-fill-normal);
    border-color: var(--wa-color-border-quiet);
  }

  .minors-toggle-card:active {
    transform: scale(0.95);
    background-color: var(--wa-color-fill-normal);
    border-color: var(--wa-color-border-quiet);
  }

  .minors-toggle-tile {
    width: 48px;
    height: 48px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--wa-color-text-quiet);
  }

  .minors-chevron {
    font-size: 1rem;
  }

  .minors-toggle-title {
    font-weight: var(--wa-font-weight-semibold, 600);
    color: var(--wa-color-text-quiet);
    font-size: var(--wa-font-size-m);
    white-space: nowrap;
    overflow: hidden;
    display: block;
  }

  .player-toggle-card {
    width: 360px;
    height: 104.8px;
  }

  .empty-state {
    padding: 2rem 1rem;
    text-align: center;
    border: 1px dashed var(--wa-color-border-quiet);
    border-radius: var(--wa-border-radius-m);
    color: var(--wa-color-neutral-on-quiet);
    margin: 1rem 0;
  }

  .empty-state p {
    margin: 0;
  }

  @media (max-width: 768px) {
    .esc-kbd {
      display: none;
    }
  }

  @media (max-width: 480px) {
    .bottom-nav {
      gap: 0.6rem;
      bottom: max(2rem, env(safe-area-inset-bottom));
    }

    .search-modal {
      top: 4px;
      left: 4px;
      right: 4px;
      width: auto;
      bottom: calc(max(2rem, env(safe-area-inset-bottom)) + 2.75rem + 0.6rem);
      height: auto;
      max-height: none;
      border-radius: var(--wa-border-radius-l);
      padding: 0 1rem 2rem;
    }

    .search-trigger {
      min-width: 0;
      width: 100%;
    }

    .search-trigger::part(base) {
      font-size: 0.9rem;
    }

    .search-trigger-kbd {
      display: none;
    }

    .minors-toggle-card {
      width: 100%;
    }
  }
</style>
