<script>
  import { onDestroy, onMount, tick } from "svelte";
  import { getMlbSchedule } from "../api/getMlbSchedule";
  import { getTeamLogo } from "../api/getTeamLogo";
  import { getMlbStandings } from "../api/getMlbDivisionStandings";
  import { getLeagueLeaders } from "../api/getHomePageSpotlight";
  import { getFeaturedPlayers } from "../api/getFeaturedPlayers";
  import { getTeamBubbleLeaders } from "../api/getTeamBubbleLeaders";
  import GameCard from "$lib/components/gameCard.svelte";
  import HorizontalDatePicker from "$lib/components/horizontalDatePicker.svelte";
  import DivisionStandingsGrid from "$lib/components/divisionStandingsGrid.svelte";
  import ArrowButton from "$lib/components/arrowButton.svelte";
  import HomeHero from "$lib/components/homeHero.svelte";

  import WaSpinner from "@awesome.me/webawesome/dist/components/spinner/spinner.js";
  import WaButton from "@awesome.me/webawesome/dist/components/button/button.js";
  import WaButtonGroup from "@awesome.me/webawesome/dist/components/button-group/button-group.js";
  import WaIcon from "@awesome.me/webawesome/dist/components/icon/icon.js";
  import WaDivider from "@awesome.me/webawesome/dist/components/divider/divider.js";
  import WaBadge from "@awesome.me/webawesome/dist/components/badge/badge.js";
  import WaSkeleton from "@awesome.me/webawesome/dist/components/skeleton/skeleton.js";

  function getTodayString() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  let selectedDate = $state(getTodayString());
  let homepageSchedule = $state([]);
  let divisionRecords = $state([]);
  let playerLeaders = $state({ bwar: [], ops: [], era: [] });
  let hasMoreLeaders = $state({ bwar: false, ops: false, era: false });
  let teamNodes = $state([]);
  let isTeamDataLoading = $state(true);
  let leagueFilter = $state("both");
  let leaderLeagueFilter = $state("both");
  let logosMap = $state({});
  let isLoading = $state(true);
  let isLeaderLoading = $state({ bwar: true, ops: true, era: true });
  let isScheduleLoading = $state(false);
  let errorMessage = $state("");
  let now = $state(new Date());

  let isExpanded = $state(false);
  let isDivisionExpanded = $state(false);

  let hoverEnabled = $state(false);
  let hoveredTeamId = $state(null);

  const HOVER_OPEN_DELAY_MS = 400;
  let hoverOpenTimer = null;

  function clearTeamHoverTimer() {
    if (hoverOpenTimer === null) return;
    clearTimeout(hoverOpenTimer);
    hoverOpenTimer = null;
  }

  function openTeamHover(teamId) {
    clearTeamHoverTimer();
    hoverOpenTimer = setTimeout(() => {
      hoverOpenTimer = null;
      hoveredTeamId = teamId;
    }, HOVER_OPEN_DELAY_MS);
  }

  function showTeamHover(teamId) {
    clearTeamHoverTimer();
    hoveredTeamId = teamId;
  }

  function closeTeamHover(teamId) {
    clearTeamHoverTimer();
    if (hoveredTeamId === teamId) hoveredTeamId = null;
  }

  onDestroy(() => clearTeamHoverTimer());

  let initialLoaded = false;
  let previousLoadedDate = $state("");

  const skeletonRows = Array.from({ length: 5 });

  const genericHeadshot =
    "https://img.mlbstatic.com/mlb-photos/image/upload/w_96,d_people:generic:headshot:67:current.png/v1/people/generic/headshot/67/current";

  const filterOptions = [
    { value: "both", label: "Both" },
    { value: "al", label: "AL" },
    { value: "nl", label: "NL" },
  ];

  let visibleTeamNodes = $derived(
    leagueFilter === "both"
      ? teamNodes
      : teamNodes.filter((t) => t.league === leagueFilter.toUpperCase()),
  );

  const LEADER_PAGE_SIZE = 10;
  const LEADER_BOARDS = ["bwar", "ops", "era"];
  const LEADER_CONFIG = {
    bwar: null,
    ops: { key: "ops", group: "hitting" },
    era: { key: "earnedRunAverage", group: "pitching" },
  };
  const leadersRequests = { bwar: 0, ops: 0, era: 0 };
  const leaderPages = { bwar: 2, ops: 2, era: 2 };
  const isLeaderAdding = { bwar: false, ops: false, era: false };
  const leaderLayout = {
    bwar: { step: 0, perView: 1 },
    ops: { step: 0, perView: 1 },
    era: { step: 0, perView: 1 },
  };
  const carouselEls = { bwar: null, ops: null, era: null };
  let leaderView = $state({
    bwar: { atStart: true, atEnd: true },
    ops: { atStart: true, atEnd: true },
    era: { atStart: true, atEnd: true },
  });

  function boardValue(board, player) {
    return board === "bwar" ? player.war.toFixed(1) : player.value;
  }

  async function fetchLeaderPage(board, league, page) {
    if (board === "bwar") {
      return getFeaturedPlayers(LEADER_PAGE_SIZE, league, page);
    }
    const { key, group } = LEADER_CONFIG[board];
    return getLeagueLeaders(key, group, league, (page - 1) * LEADER_PAGE_SIZE);
  }

  async function loadBoard(board, league) {
    const id = ++leadersRequests[board];
    isLeaderAdding[board] = false;
    isLeaderLoading[board] = true;
    leaderPages[board] = 2;
    try {
      const { list, hasMore } = await fetchLeaderPage(board, league, 1);
      if (id !== leadersRequests[board]) return;
      playerLeaders[board] = list;
      hasMoreLeaders[board] = hasMore;
      const el = carouselEls[board];
      if (el) el.scrollLeft = 0;
    } catch (err) {
      console.error(err);
      if (id !== leadersRequests[board]) return;
      playerLeaders[board] = [];
      hasMoreLeaders[board] = false;
    } finally {
      if (id === leadersRequests[board]) {
        isLeaderLoading[board] = false;
        await tick();
        layoutLeaderBoard(board);
      }
    }
  }

  async function loadMoreBoard(board, league) {
    if (
      !hasMoreLeaders[board] ||
      isLeaderLoading[board] ||
      isLeaderAdding[board]
    ) {
      return false;
    }
    const id = ++leadersRequests[board];
    isLeaderAdding[board] = true;
    const page = leaderPages[board];
    try {
      const { list, hasMore } = await fetchLeaderPage(board, league, page);
      if (id !== leadersRequests[board]) return false;
      playerLeaders[board] = [...playerLeaders[board], ...list];
      hasMoreLeaders[board] = hasMore;
      leaderPages[board] = page + 1;
      return true;
    } catch (err) {
      console.error(err);
      return false;
    } finally {
      if (id === leadersRequests[board]) {
        isLeaderAdding[board] = false;
        await tick();
        layoutLeaderBoard(board);
      }
    }
  }

  function leaderGap(el) {
    const cs = getComputedStyle(el);
    return parseFloat(cs.columnGap) || parseFloat(cs.gap) || 0;
  }

  function layoutLeaderBoard(board) {
    const el = carouselEls[board];
    if (!el) return;
    const gap = leaderGap(el);
    const width = el.clientWidth;
    if (width <= 0) return;
    const cols = Math.max(1, Math.floor((width + gap) / (240 + gap)));
    const cardWidth = Math.min(320, (width - (cols - 1) * gap) / cols);
    el.style.setProperty("--leader-card-w", `${cardWidth}px`);
    leaderLayout[board] = { step: cardWidth + gap, perView: cols };
    updateLeaderView(board);
  }

  function layoutLeaderBoards() {
    for (const board of LEADER_BOARDS) layoutLeaderBoard(board);
  }

  function updateLeaderView(board) {
    const el = carouselEls[board];
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    leaderView[board] = {
      atStart: el.scrollLeft <= 2,
      atEnd: maxScroll <= 2 || el.scrollLeft >= maxScroll - 2,
    };
  }

  async function scrollLeaderBoard(board, direction) {
    const el = carouselEls[board];
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;

    if (
      direction === 1 &&
      el.scrollLeft >= maxScroll - 2 &&
      hasMoreLeaders[board]
    ) {
      await loadMoreBoard(board, leaderLeagueFilter);
    }

    const { step, perView } = leaderLayout[board];
    if (step <= 0) return;
    const index = Math.round(el.scrollLeft / step);
    const targetIndex =
      direction === 1 ? index + perView : Math.max(0, index - perView);
    const max = el.scrollWidth - el.clientWidth;
    const left = Math.min(Math.max(0, targetIndex * step), max);
    el.scrollTo({ left, behavior: "smooth" });
  }

  $effect(() => {
    const league = leaderLeagueFilter;
    for (const board of LEADER_BOARDS) loadBoard(board, league);
  });

  $effect(() => {
    void isLoading;
    void playerLeaders.bwar;
    void playerLeaders.ops;
    void playerLeaders.era;
    tick().then(layoutLeaderBoards);
  });

  onMount(() => {
    const handleResize = () => layoutLeaderBoards();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  });

  $effect(() => {
    const interval = setInterval(() => {
      now = new Date();
    }, 60000);

    return () => clearInterval(interval);
  });

  $effect(() => {
    if (
      selectedDate &&
      !isLoading &&
      initialLoaded &&
      selectedDate !== previousLoadedDate
    ) {
      previousLoadedDate = selectedDate;
      loadScheduleForDate(selectedDate);
    }
  });

  function collectScheduleTeamIds(schedule) {
    const ids = new Set();
    schedule.forEach((game) => {
      if (game.teams?.away?.team?.id) ids.add(game.teams.away.team.id);
      if (game.teams?.home?.team?.id) ids.add(game.teams.home.team.id);
    });
    return ids;
  }

  async function loadScheduleForDate(dateStr) {
    isScheduleLoading = true;
    try {
      const scheduleData = await getMlbSchedule(dateStr);
      homepageSchedule = scheduleData;

      if (homepageSchedule.length > 0) {
        const additions = {};
        collectScheduleTeamIds(homepageSchedule).forEach((id) => {
          if (!logosMap[id] && !additions[id]) additions[id] = getTeamLogo(id);
        });
        if (Object.keys(additions).length > 0) {
          logosMap = { ...logosMap, ...additions };
        }
      }
    } catch (err) {
      console.error("Failed to cycle targeted daily schedule matches:", err);
    } finally {
      isScheduleLoading = false;
    }
  }

  onMount(async () => {
    try {
      isLoading = true;
      hoverEnabled = window.matchMedia(
        "(hover: hover) and (pointer: fine) and (min-width: 481px)",
      ).matches;

      const [scheduleData, standingsData] = await Promise.all([
        getMlbSchedule(selectedDate),
        getMlbStandings(),
      ]);

      homepageSchedule = scheduleData;
      divisionRecords = standingsData;
      logosMap = Object.fromEntries(
        Array.from(collectScheduleTeamIds(homepageSchedule)).map((id) => [
          id,
          getTeamLogo(id),
        ]),
      );
      previousLoadedDate = selectedDate;
      initialLoaded = true;

      isLoading = false;

      const teamData = await getTeamBubbleLeaders(new Date().getFullYear());
      teamNodes = teamData;
    } catch (error) {
      errorMessage =
        "Failed to load today's MLB metrics. Please check back shortly.";
      console.error(error);
    } finally {
      isLoading = false;
      isTeamDataLoading = false;
    }
  });
</script>

<svelte:head>
  <title>headwar — advanced player stats, decoded</title>
</svelte:head>

<main class="home-page">
  <HomeHero />

  <div class="home-layout">
    {#snippet leaderCard(player, value, index)}
      <a class="leader-card" href="/players/{player.id}">
        <img
          src={player.headshot}
          alt=""
          width="36"
          height="58"
          class="leader-card-photo"
          loading={index < 3 ? "eager" : "lazy"}
          fetchpriority={index < 3 ? "high" : "auto"}
          onerror={(e) => {
            if (!e.target.dataset.fallback) {
              e.target.dataset.fallback = "1";
              e.target.src = player.genericHeadshot || genericHeadshot;
            }
          }}
        />
        <div class="leader-card-info">
          <span class="leader-card-name">{player.name}</span>
          <div class="leader-card-meta">
            <wa-badge appearance="filled" variant="neutral" size="s">
              #{player.rank}
            </wa-badge>
            <wa-badge appearance="accent" variant="brand" size="s">
              {value}
            </wa-badge>
          </div>
        </div>
      </a>
    {/snippet}

    {#snippet leaderSkeleton()}
      {#each skeletonRows as _}
        <div class="leader-card leader-card-skeleton" aria-hidden="true">
          <wa-skeleton class="leader-card-photo-skeleton"></wa-skeleton>
          <div class="leader-card-info">
            <wa-skeleton class="leader-card-name-skeleton"></wa-skeleton>
            <wa-skeleton class="leader-card-value-skeleton"></wa-skeleton>
          </div>
        </div>
      {/each}
    {/snippet}

    {#if isLoading}
      <div class="status-message">
        <wa-spinner style="font-size: 3rem;"></wa-spinner>
      </div>
    {:else if errorMessage}
      <div class="status-message error">
        <p>{errorMessage}</p>
      </div>
    {:else}
      <section class="home-section" id="player-leaders">
        <div class="section-head section-head-row">
          <div class="section-head-left">
            <div class="section-head-title">
              <h2 class="section-head-text">Player Leaders</h2>
              <wa-icon name="ranking-star" style="color: var(--wa-color-brand-fill-loud); font-size: 1.5rem;"></wa-icon>
            </div>
          </div>

          <wa-button-group label="Filter by league">
            {#each filterOptions as option}
              <wa-button
                size="small"
                variant={leaderLeagueFilter === option.value
                  ? "brand"
                  : "neutral"}
                appearance={leaderLeagueFilter === option.value
                  ? "accent"
                  : "filled"}
                aria-pressed={leaderLeagueFilter === option.value}
                onclick={() => {
                  leaderLeagueFilter = option.value;
                }}
              >
                {option.label}
              </wa-button>
            {/each}
          </wa-button-group>
        </div>

        <div class="section-body">
          <section class="page-section">
            <div class="spotlight-three-column-grid">
              <div class="spotlight-leaderboard-card">
                <div class="leaderboard-card-header">
                  <div class="column-header-title">Season bWAR</div>
                  <div class="leaderboard-pager">
                    <ArrowButton
                      direction="prev"
                      disabled={leaderView.bwar.atStart}
                      onclick={() => scrollLeaderBoard("bwar", -1)}
                    />
                    <ArrowButton
                      direction="next"
                      disabled={leaderView.bwar.atEnd && !hasMoreLeaders.bwar}
                      onclick={() => scrollLeaderBoard("bwar", 1)}
                    />
                  </div>
                </div>
                <div
                  class="leaderboard-carousel"
                  bind:this={carouselEls.bwar}
                  onscroll={() => updateLeaderView("bwar")}
                >
                  {#if isLeaderLoading.bwar}
                    {@render leaderSkeleton()}
                  {:else}
                    {#each playerLeaders.bwar as player, i}
                      {@render leaderCard(
                        player,
                        boardValue("bwar", player),
                        i,
                      )}
                    {/each}
                  {/if}
                </div>
              </div>

              <div class="spotlight-leaderboard-card">
                <div class="leaderboard-card-header">
                  <div class="column-header-title">OPS Leaders</div>
                  <div class="leaderboard-pager">
                    <ArrowButton
                      direction="prev"
                      disabled={leaderView.ops.atStart}
                      onclick={() => scrollLeaderBoard("ops", -1)}
                    />
                    <ArrowButton
                      direction="next"
                      disabled={leaderView.ops.atEnd && !hasMoreLeaders.ops}
                      onclick={() => scrollLeaderBoard("ops", 1)}
                    />
                  </div>
                </div>
                <div
                  class="leaderboard-carousel"
                  bind:this={carouselEls.ops}
                  onscroll={() => updateLeaderView("ops")}
                >
                  {#if isLeaderLoading.ops}
                    {@render leaderSkeleton()}
                  {:else}
                    {#each playerLeaders.ops as player, i}
                      {@render leaderCard(player, boardValue("ops", player), i)}
                    {/each}
                  {/if}
                </div>
              </div>

              <div class="spotlight-leaderboard-card">
                <div class="leaderboard-card-header">
                  <div class="column-header-title">ERA Leaders</div>
                  <div class="leaderboard-pager">
                    <ArrowButton
                      direction="prev"
                      disabled={leaderView.era.atStart}
                      onclick={() => scrollLeaderBoard("era", -1)}
                    />
                    <ArrowButton
                      direction="next"
                      disabled={leaderView.era.atEnd && !hasMoreLeaders.era}
                      onclick={() => scrollLeaderBoard("era", 1)}
                    />
                  </div>
                </div>
                <div
                  class="leaderboard-carousel"
                  bind:this={carouselEls.era}
                  onscroll={() => updateLeaderView("era")}
                >
                  {#if isLeaderLoading.era}
                    {@render leaderSkeleton()}
                  {:else}
                    {#each playerLeaders.era as player, i}
                      {@render leaderCard(player, boardValue("era", player), i)}
                    {/each}
                  {/if}
                </div>
              </div>
            </div>
          </section>
        </div>
      </section>

      <section class="home-section" id="teams">
        <div class="section-head section-head-row">
          <div class="section-head-left">
            <div class="section-head-title">
              <h2 class="section-head-text">MLB Teams</h2>
              <wa-icon name="users-rectangle" style="color: var(--wa-color-brand-fill-loud); font-size: 1.5rem;"></wa-icon>
            </div>
          </div>

          <wa-button-group label="Filter by league">
            {#each filterOptions as option}
              <wa-button
                size="small"
                variant={leagueFilter === option.value ? "brand" : "neutral"}
                appearance={leagueFilter === option.value ? "accent" : "filled"}
                aria-pressed={leagueFilter === option.value}
                onclick={() => (leagueFilter = option.value)}
              >
                {option.label}
              </wa-button>
            {/each}
          </wa-button-group>
        </div>

        <div class="section-body">
          {#if isTeamDataLoading}
            <div class="empty-inline-state">
              <wa-spinner style="font-size: 1.5rem;"></wa-spinner>
              <p>Loading team bWAR...</p>
            </div>
          {:else if visibleTeamNodes.length === 0}
            <div class="empty-inline-state">
              <p>Team bWAR data is temporarily unavailable.</p>
            </div>
          {:else}
            <div class="team-grid">
              {#each visibleTeamNodes as team (team.teamId)}
                <div
                  class="team-tile"
                  onmouseenter={() => openTeamHover(team.teamId)}
                  onmouseleave={() => closeTeamHover(team.teamId)}
                  onfocusin={() => showTeamHover(team.teamId)}
                  onfocusout={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget)) {
                      closeTeamHover(team.teamId);
                    }
                  }}
                >
                  {#if team.players.length && hoverEnabled && hoveredTeamId === team.teamId}
                    <div class="team-hover" aria-hidden="true">
                      <div class="hover-head">
                        <img
                          src={team.logo}
                          alt=""
                          class="hover-logo"
                          onerror={(e) => {
                            if (!e.target.dataset.fallback) {
                              e.target.dataset.fallback = "1";
                              e.target.src =
                                "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";
                            }
                          }}
                        />
                        <span class="hover-abbr">{team.abbreviation}</span>
                        <span class="hover-label">
                          <wa-icon name="arrow-trend-up" class="hover-trend"
                          ></wa-icon>
                          top bWAR
                        </span>
                      </div>
                      <wa-divider></wa-divider>
                      <div class="hover-grid">
                        {#each team.players as player}
                          <a
                            class="hover-player"
                            href="/players/{player.id}"
                            title="{player.name} — {player.war.toFixed(1)} bWAR"
                          >
                            <span class="hover-photo">
                              <img
                                src={player.headshot}
                                alt=""
                                width="46"
                                height="68"
                                onerror={(e) => {
                                  if (!e.target.dataset.fallback) {
                                    e.target.dataset.fallback = "1";
                                    e.target.src = genericHeadshot;
                                  }
                                }}
                              />
                              <span class="hover-war">
                                <wa-badge
                                  variant="brand"
                                  appearance="accent"
                                  pill
                                >
                                  {player.war.toFixed(1)}
                                </wa-badge>
                              </span>
                            </span>
                            <span class="hover-name">{player.name}</span>
                          </a>
                        {/each}
                      </div>
                    </div>
                  {/if}

                  <a
                    class="team-logo-name-wrapper"
                    href="/teams/{team.teamId}"
                    title={team.name}
                  >
                    <img
                      src={team.logo}
                      alt="Team Logo"
                      width="32"
                      height="32"
                      class="team-logo"
                      onerror={(e) => {
                        if (!e.target.dataset.fallback) {
                          e.target.dataset.fallback = "1";
                          e.target.src =
                            "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";
                        }
                      }}
                    />
                    <p>{team.name}</p>
                  </a>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      </section>

      <section class="home-section" id="today-games">
        <div class="section-head">
          <div class="section-head-title">
            <h2 class="section-head-text">Today's Games</h2>
            <wa-icon name="calendar-day" style="color: var(--wa-color-brand-fill-loud); font-size: 1.5rem;"></wa-icon>
          </div>
        </div>

        <div class="section-body">
          <HorizontalDatePicker bind:selectedDate daysRange={10} />

          <section
            class="page-section"
            class:is-loading-opaque={isScheduleLoading}
          >
            {#if homepageSchedule.length === 0}
              <div class="empty-inline-state">
                <p>No games scheduled for this date.</p>
              </div>
            {:else if homepageSchedule.length <= 3}
              <div
                class="collapsible-schedule-wrapper"
                class:is-collapsed={!isExpanded}
              >
                <div class="homepage-schedule-flex-grid">
                  {#each homepageSchedule as game (game.gamePk)}
                    <div class="homepage-card-item">
                      <GameCard {game} {logosMap} {now} />
                    </div>
                  {/each}
                </div>
              </div>
            {:else}
              <div
                class="collapsible-schedule-wrapper"
                class:is-collapsed={!isExpanded}
              >
                <div class="homepage-schedule-flex-grid">
                  {#each homepageSchedule as game (game.gamePk)}
                    <div class="homepage-card-item">
                      <GameCard {game} {logosMap} {now} />
                    </div>
                  {/each}
                </div>

                {#if !isExpanded}
                  <div class="fade-overlay"></div>
                {/if}
              </div>

              <div class="expansion-controls-row">
                <wa-button
                  variant="neutral"
                  size="s"
                  onclick={() => (isExpanded = !isExpanded)}
                >
                  {isExpanded ? "Show less" : "Show all"}
                </wa-button>
              </div>
            {/if}
          </section>
        </div>
      </section>

      <section class="home-section" id="standings">
        <div class="section-head">
          <div class="section-head-title">
            <h2 class="section-head-text">Standings</h2>
            <wa-icon name="medal" style="color: var(--wa-color-brand-fill-loud); font-size: 1.5rem;"></wa-icon>
          </div>
        </div>

        <div class="section-body">
          <section class="page-section">
            {#if divisionRecords.length === 0}
              <div class="empty-inline-state">
                <p>Standings data temporarily unavailable.</p>
              </div>
            {:else}
              <div
                class="collapsible-standings-wrapper"
                class:is-collapsed={!isDivisionExpanded}
              >
                <div class="standings-dashboard-grid">
                  {#each divisionRecords as division}
                    <DivisionStandingsGrid
                      divisionName={division.displayName}
                      divisionStandings={division.teamRecords || []}
                    />
                  {/each}
                </div>

                {#if !isDivisionExpanded}
                  <div class="fade-overlay"></div>
                {/if}
              </div>

              <div class="expansion-controls-row">
                <wa-button
                  variant="neutral"
                  size="s"
                  onclick={() => (isDivisionExpanded = !isDivisionExpanded)}
                >
                  {isDivisionExpanded ? "Show less" : "Show all"}
                </wa-button>
              </div>
            {/if}
          </section>
        </div>
      </section>
    {/if}
  </div>
</main>

<style>
  :global(html) {
    scroll-behavior: smooth;
  }

  .home-page {
    position: relative;
    display: block;
    width: 100%;
  }

  .home-layout {
    margin: 3.5rem auto 0;
    padding: 0;
    max-width: 1280px;
    display: flex;
    flex-direction: column;
    gap: 3.5rem;
  }

  .home-section {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .section-body {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .section-head {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .section-head-row {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 1.25rem 1rem;
  }

  .section-head-left {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .section-head-title {
    display: flex;
    align-items: center;
    gap: 0.85rem;
  }

  .section-head-text {
    margin: 0;
    font-size: 1.6rem;
    font-weight: var(--wa-font-weight-bold, 700);
    letter-spacing: -0.01em;
    color: var(--wa-color-filled-on-normal);
  }

  .team-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 0.5rem;
    width: 100%;
  }

  .team-tile {
    position: relative;
    display: flex;
    align-items: center;
  }

  .team-logo-name-wrapper {
    display: flex;
    width: 100%;
    align-items: center;
    gap: 0.5rem;
    white-space: nowrap;
    padding: 0.75rem 1rem 0.75rem 1rem;
    border-radius: var(--wa-border-radius-m);
    transition: all 100ms ease;
    text-decoration: none;
    color: inherit;
    background: var(
      --wa-color-canvas-background,
      var(--wa-color-surface-default)
    );
  }

  .team-logo-name-wrapper p {
    white-space: nowrap;
  }

  .team-logo {
    max-width: 32px;
    width: 32px;
    height: auto;
    max-height: 32px;
    background-color: var(--wa-color-gray-70);
    padding: 6px;
    box-shadow: var(--wa-shadow-l);
    border-radius: var(--wa-border-radius-m);
    transition: all 100ms ease;
  }

  .team-logo-name-wrapper:hover {
    cursor: pointer;
    background-color: var(--wa-color-neutral-fill-normal);
    transform: scale(1.03);
    transition: all 100ms ease;
  }

  .team-logo-name-wrapper:active {
    cursor: pointer;
    background-color: var(--wa-color-neutral-fill-normal);
    transform: scale(0.95);
    transition: all 100ms ease;
  }

  .team-hover {
    position: absolute;
    bottom: calc(100% + 0.85rem);
    left: 50%;
    transform: translate(-50%, 8px);
    width: 250px;
    box-sizing: border-box;
    padding: 0.75rem;
    background: var(--wa-color-surface-raised);
    border: 1px solid var(--wa-color-border-quiet);
    border-radius: var(--wa-border-radius-l);
    box-shadow: var(--wa-shadow-l);
    z-index: 10;
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
    transition:
      opacity 120ms ease,
      transform 120ms ease,
      visibility 120ms ease;
  }

  .hover-head {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.1rem 0.25rem 0.5rem;
  }

  .hover-logo {
    width: 20px;
    height: 20px;
    object-fit: contain;
    background-color: var(--wa-color-gray-70);
    padding: 2px;
    border-radius: var(--wa-border-radius-s);
  }

  .hover-abbr {
    font-size: var(--wa-font-size-s);
    font-weight: var(--wa-font-weight-semibold, 600);
    color: var(--wa-color-filled-on-normal);
    letter-spacing: 0.04em;
  }

  .hover-label {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 0.3rem;
    font-size: var(--wa-font-size-xs);
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .hover-trend {
    --wa-icon-size: 0.8em;
  }

  .hover-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.4rem;
    padding-top: 0.6rem;
  }

  .hover-player {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.3rem;
    padding: 0.35rem;
    border-radius: var(--wa-border-radius-m);
    text-decoration: none;
    color: inherit;
    transition: all 100ms ease;
  }

  .hover-photo img {
    width: 45.6px;
    height: 67.64px;
    border-radius: var(--wa-border-radius-m);
    background-color: var(--wa-color-gray-80);
    object-fit: cover;
    box-shadow: var(--wa-shadow-m);
    border: 1px solid var(--wa-color-border-quiet);
    display: block;
  }

  .hover-photo {
    position: relative;
    display: block;
  }

  .hover-war {
    position: absolute;
    right: -8px;
    bottom: -8px;
    display: block;
  }

  .hover-war::part(base) {
    border: 2px solid var(--wa-color-surface-raised);
  }

  .hover-name {
    max-width: 96px;
    font-size: var(--wa-font-size-s);
    line-height: 1.2;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    text-align: center;
  }

  .hover-player:hover {
    cursor: pointer;
    background-color: var(--wa-color-neutral-fill-normal);
    transform: scale(1.02);
  }

  .hover-player:active {
    cursor: pointer;
    background-color: var(--wa-color-neutral-fill-normal);
    transform: scale(0.96);
    text-decoration: underline;
  }

  .team-hover::before {
    content: "";
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    width: 80%;
    bottom: calc(-0.85rem - 6px);
    height: calc(0.85rem + 6px);
  }

  .team-hover::after {
    content: "";
    position: absolute;
    bottom: -7px;
    left: 50%;
    transform: translateX(-50%) rotate(45deg);
    width: 12px;
    height: 12px;
    background: var(--wa-color-surface-raised);
    border-right: 1px solid var(--wa-color-border-quiet);
    border-bottom: 1px solid var(--wa-color-border-quiet);
    border-bottom-right-radius: 3px;
  }

  @media (hover: hover) and (pointer: fine) and (min-width: 481px) {
    .team-tile:hover .team-hover,
    .team-tile:focus-within .team-hover {
      opacity: 1;
      visibility: visible;
      transform: translate(-50%, 0);
      pointer-events: auto;
    }
  }

  .page-section {
    transition: opacity 200ms ease;
  }

  .page-section.is-loading-opaque {
    opacity: 0.4;
    pointer-events: none;
  }

  .spotlight-three-column-grid {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    width: 100%;
  }

  .spotlight-leaderboard-card {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    background-color: transparent;
    border-radius: var(--wa-border-radius-m);
    box-sizing: border-box;
  }

  .leaderboard-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }

  .column-header-title {
    font-size: var(--wa-font-size-s);
    font-weight: var(--wa-font-weight-semibold, 600);
    color: var(--wa-color-filled-on-normal);
    padding: 0.3rem 0.75rem 0.3rem 0.75rem;
    background-color: var(--wa-color-fill-normal);
    border-radius: var(--wa-border-radius-m);
  }

  .leaderboard-carousel {
    display: flex;
    gap: 0.75rem;
    overflow-x: auto;
    padding: 0.5rem;
    scroll-behavior: smooth;
    scroll-snap-type: x proximity;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  .leaderboard-carousel::-webkit-scrollbar {
    display: none;
  }

  .leaderboard-pager {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .leader-card {
    flex: 0 0 var(--leader-card-w, 320px);
    width: var(--leader-card-w, 320px);
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 1rem;
    padding: 0.75rem;
    border: 1px solid var(--wa-color-border-quiet);
    border-radius: var(--wa-border-radius-m);
    text-decoration: none;
    color: var(--wa-color-filled-on-normal);
    transition: all 100ms ease;
    scroll-snap-align: start;
  }

  .leader-card:hover {
    background-color: var(--wa-color-fill-normal);

    wa-badge {
      border-color: var(
        --wa-color-border-loud,
        var(--wa-color-brand-border-loud)
      );
    }
  }

  .leader-card-photo {
    height: 50px;
    flex-shrink: 0;
    border-radius: var(--wa-border-radius-m);
    object-fit: cover;
    background: var(--wa-color-neutral-fill-strong);
    box-shadow: var(--wa-shadow-s);
  }

  .leader-card-info {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 0.5rem;
    flex: 1;
    min-width: 0;
    text-align: center;
  }

  .leader-card-name {
    font-size: var(--wa-font-size-m);
    font-weight: var(--wa-font-weight-semibold, 600);
    line-height: 1.15;
    text-align: left;
    max-width: 100%;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .leader-card-meta {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .leader-card-skeleton {
    pointer-events: none;
  }

  .leader-card-skeleton wa-skeleton {
    display: block;
    overflow: hidden;
    border-radius: var(--wa-border-radius-s);
  }

  .leader-card-photo-skeleton {
    width: 36px;
    height: 50px;
    flex-shrink: 0;
    border-radius: var(--wa-border-radius-m);
  }

  .leader-card-name-skeleton {
    width: 80%;
    height: 0.9rem;
  }

  .leader-card-value-skeleton {
    width: 50%;
    height: 0.9rem;
  }

  .collapsible-schedule-wrapper,
  .collapsible-standings-wrapper {
    position: relative;
    width: 100%;
    overflow: hidden;
    transition: max-height 350ms cubic-bezier(0.4, 0, 0.2, 1);
    max-height: 8000px;
  }

  .collapsible-schedule-wrapper.is-collapsed {
    max-height: 400px;
  }

  .collapsible-standings-wrapper.is-collapsed {
    max-height: 370px;
  }

  .fade-overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 120px;
    background: linear-gradient(
      to bottom,
      transparent 0%,
      var(--wa-color-canvas-background, var(--wa-color-surface-default)) 100%
    );
    pointer-events: none;
    z-index: 2;
  }

  .expansion-controls-row {
    display: flex;
    justify-content: center;
    align-items: center;
    padding-top: 1.25rem;
    width: 100%;
  }

  .homepage-schedule-flex-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 1.25rem;
    width: 100%;
  }

  .homepage-card-item {
    flex: 1 1 calc(33.333% - 1rem);
    min-width: 300px;
    max-width: calc(33.333% - 1rem);
  }

  .standings-dashboard-grid {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    width: 100%;
  }

  .status-message {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 60vh;
    font-size: 1.15rem;
    color: var(--wa-color-neutral-on-quiet);
  }

  .status-message.error {
    color: #d9534f;
  }

  .empty-inline-state {
    padding: 2rem;
    text-align: center;
    border: 1px dashed var(--wa-color-border-quiet);
    border-radius: var(--wa-border-radius-m);
    color: var(--wa-color-neutral-on-quiet);
  }

  @media (max-width: 1125px) {
    .spotlight-three-column-grid {
      gap: 1rem;
    }
  }

  @media (max-width: 900px) {
    .homepage-card-item {
      max-width: 100%;
    }

    .collapsible-schedule-wrapper.is-collapsed {
      max-height: 440px;
    }

    .collapsible-standings-wrapper.is-collapsed {
      max-height: 470px;
    }
  }
</style>
