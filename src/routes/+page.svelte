<script>
  import { onMount } from "svelte";
  import { getMlbSchedule } from "../api/getMlbSchedule";
  import { getTeamLogo } from "../api/getTeamLogo";
  import { getMlbStandings } from "../api/getMlbDivisionStandings";
  import { getLeagueLeaders } from "../api/getHomePageSpotlight";
  import { getFeaturedPlayers } from "../api/getFeaturedPlayers";
  import { getTeamBubbleLeaders } from "../api/getTeamBubbleLeaders";
  import GameCard from "$lib/components/gameCard.svelte";
  import HorizontalDatePicker from "$lib/components/horizontalDatePicker.svelte";
  import DivisionStandingsGrid from "$lib/components/divisionStandingsGrid.svelte";

  import WaSpinner from "@awesome.me/webawesome/dist/components/spinner/spinner.js";
  import WaButton from "@awesome.me/webawesome/dist/components/button/button.js";
  import WaButtonGroup from "@awesome.me/webawesome/dist/components/button-group/button-group.js";
  import WaIcon from "@awesome.me/webawesome/dist/components/icon/icon.js";
  import WaDivider from "@awesome.me/webawesome/dist/components/divider/divider.js";
  import WaBadge from "@awesome.me/webawesome/dist/components/badge/badge.js";

  function getTodayString() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  let selectedDate = $state(getTodayString());
  let homepageSchedule = $state([]);
  let divisionRecords = $state([]);
  let playerLeaders = $state({ bwar: [], ops: [], era: [] });
  let hasMoreLeaders = $state({ bwar: false, ops: false, era: false });
  let bwarPage = $state(1);
  let opsPage = $state(1);
  let eraPage = $state(1);
  let teamNodes = $state([]);
  let leagueFilter = $state("both");
  let leaderLeagueFilter = $state("both");
  let logosMap = $state({});
  let isLoading = $state(true);
  let isScheduleLoading = $state(false);
  let errorMessage = $state("");
  let now = $state(new Date());

  let isExpanded = $state(false);
  let isDivisionExpanded = $state(false);

  const genericHeadshot =
    "https://img.mlbstatic.com/mlb-photos/image/upload/w_200,d_people:generic:headshot:67:current.png/v1/people/generic/headshot/67/current";

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

  const leadersRequests = { bwar: 0, ops: 0, era: 0 };

  async function loadBwar(league, page) {
    const id = ++leadersRequests.bwar;
    const { list, hasMore } = await getFeaturedPlayers(10, league, page);
    if (id !== leadersRequests.bwar) return;
    playerLeaders.bwar = list;
    hasMoreLeaders.bwar = hasMore;
  }

  async function loadOps(league, page) {
    const id = ++leadersRequests.ops;
    const { list, hasMore } = await getLeagueLeaders(
      "ops",
      "hitting",
      league,
      (page - 1) * 10,
    );
    if (id !== leadersRequests.ops) return;
    playerLeaders.ops = list;
    hasMoreLeaders.ops = hasMore;
  }

  async function loadEra(league, page) {
    const id = ++leadersRequests.era;
    const { list, hasMore } = await getLeagueLeaders(
      "earnedRunAverage",
      "pitching",
      league,
      (page - 1) * 10,
    );
    if (id !== leadersRequests.era) return;
    playerLeaders.era = list;
    hasMoreLeaders.era = hasMore;
  }

  $effect(() => {
    loadBwar(leaderLeagueFilter, bwarPage);
  });

  $effect(() => {
    loadOps(leaderLeagueFilter, opsPage);
  });

  $effect(() => {
    loadEra(leaderLeagueFilter, eraPage);
  });

  $effect(() => {
    const interval = setInterval(() => {
      now = new Date();
    }, 60000);

    return () => clearInterval(interval);
  });

  $effect(() => {
    if (selectedDate && !isLoading) {
      loadScheduleForDate(selectedDate);
    }
  });

  async function loadScheduleForDate(dateStr) {
    isScheduleLoading = true;
    try {
      const scheduleData = await getMlbSchedule(dateStr);
      homepageSchedule = scheduleData;

      if (homepageSchedule.length > 0) {
        const uniqueTeamIds = new Set();
        homepageSchedule.forEach((game) => {
          if (game.teams?.away?.team?.id && !logosMap[game.teams.away.team.id])
            uniqueTeamIds.add(game.teams.away.team.id);
          if (game.teams?.home?.team?.id && !logosMap[game.teams.home.team.id])
            uniqueTeamIds.add(game.teams.home.team.id);
        });

        if (uniqueTeamIds.size > 0) {
          const logoPromises = Array.from(uniqueTeamIds).map(async (id) => {
            try {
              const logoUrl = await getTeamLogo(id);
              return { id, logoUrl };
            } catch (err) {
              return {
                id,
                logoUrl: `https://midas.mlbstatic.com/v1/team/${id}/assets/1/120.svg`,
              };
            }
          });
          const resolvedLogos = await Promise.all(logoPromises);
          resolvedLogos.forEach((item) => {
            if (item) logosMap[item.id] = item.logoUrl;
          });
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

      const [scheduleData, standingsData, teamData] = await Promise.all([
        getMlbSchedule(selectedDate),
        getMlbStandings(),
        getTeamBubbleLeaders(new Date().getFullYear()),
      ]);

      homepageSchedule = scheduleData;
      divisionRecords = standingsData;
      teamNodes = teamData;

      if (homepageSchedule.length > 0) {
        const uniqueTeamIds = new Set();

        homepageSchedule.forEach((game) => {
          if (game.teams?.away?.team?.id)
            uniqueTeamIds.add(game.teams.away.team.id);
          if (game.teams?.home?.team?.id)
            uniqueTeamIds.add(game.teams.home.team.id);
        });

        const logoPromises = Array.from(uniqueTeamIds).map(async (id) => {
          try {
            const logoUrl = await getTeamLogo(id);
            return { id, logoUrl };
          } catch (err) {
            return {
              id,
              logoUrl: `https://midas.mlbstatic.com/v1/team/${id}/assets/1/120.svg`,
            };
          }
        });

        const resolvedLogos = await Promise.all(logoPromises);
        const newLogos = {};
        resolvedLogos.forEach((item) => {
          if (item) newLogos[item.id] = item.logoUrl;
        });

        logosMap = newLogos;
      }
    } catch (error) {
      errorMessage =
        "Failed to load today's MLB metrics. Please check back shortly.";
      console.error(error);
    } finally {
      isLoading = false;
    }
  });
</script>

<svelte:head>
  <title>headwar — advanced player stats, decoded</title>
</svelte:head>

<main class="home-layout">
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
            <span class="section-head-icon" aria-hidden="true">
              <wa-icon name="trophy"></wa-icon>
            </span>
            <h2 class="section-head-text">Player Leaders</h2>
          </div>
          <p class="section-head-sub">
            The quick links — who's worth a visit right now.
          </p>
        </div>

        <wa-button-group label="Filter by league">
          {#each filterOptions as option}
            <wa-button
              size="small"
              variant={leaderLeagueFilter === option.value
                ? "brand"
                : "neutral"}
              appearance="filled"
              aria-pressed={leaderLeagueFilter === option.value}
              onclick={() => {
                leaderLeagueFilter = option.value;
                bwarPage = 1;
                opsPage = 1;
                eraPage = 1;
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
              <div class="column-header-title">Season bWAR</div>
              <wa-divider></wa-divider>
              <div class="leaderboard-rows-stack">
                {#each playerLeaders.bwar as player}
                  <a class="leader-row" href="/players/{player.id}">
                    <div class="rank-name-group">
                      <span class="row-rank-num">{player.rank}</span>
                      <img
                        src={player.headshot}
                        alt=""
                        class="row-player-thumb"
                        loading="lazy"
                        onerror={(e) => (e.target.src = genericHeadshot)}
                      />
                      <span class="player-profile-name">{player.name}</span>
                    </div>
                    <span class="metric-score-value">
                      {player.war.toFixed(1)}
                    </span>
                  </a>
                {/each}
              </div>
              <div class="leaderboard-pager">
                <wa-button
                  size="small"
                  appearance="filled"
                  variant="neutral"
                  disabled={bwarPage <= 1}
                  onclick={() => bwarPage--}
                  aria-label="Previous page"
                >
                  <wa-icon name="chevron-left" slot="prefix"></wa-icon>
                  Prev
                </wa-button>
                <span class="pager-label">Page {bwarPage}</span>
                <wa-button
                  size="small"
                  appearance="filled"
                  variant="neutral"
                  disabled={!hasMoreLeaders.bwar}
                  onclick={() => bwarPage++}
                  aria-label="Next page"
                >
                  Next
                  <wa-icon name="chevron-right" slot="suffix"></wa-icon>
                </wa-button>
              </div>
            </div>

            <div class="spotlight-leaderboard-card">
              <div class="column-header-title">OPS Leaders</div>
              <wa-divider></wa-divider>
              <div class="leaderboard-rows-stack">
                {#each playerLeaders.ops as player}
                  <a class="leader-row" href="/players/{player.id}">
                    <div class="rank-name-group">
                      <span class="row-rank-num">{player.rank}</span>
                      <img
                        src={player.headshot}
                        alt=""
                        class="row-player-thumb"
                        loading="lazy"
                        onerror={(e) => (e.target.src = player.genericHeadshot)}
                      />
                      <span class="player-profile-name">{player.name}</span>
                    </div>
                    <span class="metric-score-value">{player.value}</span>
                  </a>
                {/each}
              </div>
              <div class="leaderboard-pager">
                <wa-button
                  size="small"
                  appearance="filled"
                  variant="neutral"
                  disabled={opsPage <= 1}
                  onclick={() => opsPage--}
                  aria-label="Previous page"
                >
                  <wa-icon name="chevron-left" slot="prefix"></wa-icon>
                  Prev
                </wa-button>
                <span class="pager-label">Page {opsPage}</span>
                <wa-button
                  size="small"
                  appearance="filled"
                  variant="neutral"
                  disabled={!hasMoreLeaders.ops}
                  onclick={() => opsPage++}
                  aria-label="Next page"
                >
                  Next
                  <wa-icon name="chevron-right" slot="suffix"></wa-icon>
                </wa-button>
              </div>
            </div>

            <div class="spotlight-leaderboard-card">
              <div class="column-header-title">ERA Leaders</div>
              <wa-divider></wa-divider>
              <div class="leaderboard-rows-stack">
                {#each playerLeaders.era as player}
                  <a class="leader-row" href="/players/{player.id}">
                    <div class="rank-name-group">
                      <span class="row-rank-num">{player.rank}</span>
                      <img
                        src={player.headshot}
                        alt=""
                        class="row-player-thumb"
                        loading="lazy"
                        onerror={(e) => (e.target.src = player.genericHeadshot)}
                      />
                      <span class="player-profile-name">{player.name}</span>
                    </div>
                    <span class="metric-score-value">{player.value}</span>
                  </a>
                {/each}
              </div>
              <div class="leaderboard-pager">
                <wa-button
                  size="small"
                  appearance="filled"
                  variant="neutral"
                  disabled={eraPage <= 1}
                  onclick={() => eraPage--}
                  aria-label="Previous page"
                >
                  <wa-icon name="chevron-left" slot="prefix"></wa-icon>
                  Prev
                </wa-button>
                <span class="pager-label">Page {eraPage}</span>
                <wa-button
                  size="small"
                  appearance="filled"
                  variant="neutral"
                  disabled={!hasMoreLeaders.era}
                  onclick={() => eraPage++}
                  aria-label="Next page"
                >
                  Next
                  <wa-icon name="chevron-right" slot="suffix"></wa-icon>
                </wa-button>
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
            <span class="section-head-icon" aria-hidden="true">
              <wa-icon name="diagram-project"></wa-icon>
            </span>
            <h2 class="section-head-text">Every Team</h2>
          </div>
          <p class="section-head-sub">
            Teams and their 4 best players from bWAR
          </p>
        </div>

        <wa-button-group label="Filter by league">
          {#each filterOptions as option}
            <wa-button
              size="small"
              variant={leagueFilter === option.value ? "brand" : "neutral"}
              appearance="filled"
              aria-pressed={leagueFilter === option.value}
              onclick={() => (leagueFilter = option.value)}
            >
              {option.label}
            </wa-button>
          {/each}
        </wa-button-group>
      </div>

      <div class="section-body">
        {#if visibleTeamNodes.length === 0}
          <div class="empty-inline-state">
            <p>Team bWAR data is temporarily unavailable.</p>
          </div>
        {:else}
          <div class="team-grid">
            {#each visibleTeamNodes as team (team.teamId)}
              <div class="team-tile">
                {#if team.players.length}
                  <div class="team-hover" aria-hidden="true">
                    <div class="hover-head">
                      <img
                        src={team.logo}
                        alt=""
                        class="hover-logo"
                        loading="lazy"
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
                              loading="lazy"
                              onerror={(e) => (e.target.src = genericHeadshot)}
                            />
                            <span class="hover-war">
                              <wa-badge variant="brand" pill>
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
                    class="team-logo"
                    loading="lazy"
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
          <span class="section-head-icon" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <rect x="3" y="4" width="18" height="17" rx="4.5" />
              <path d="M3 9h18M8 2.5v3M16 2.5v3" />
            </svg>
          </span>
          <h2 class="section-head-text">Today's Games</h2>
        </div>
        <p class="section-head-sub">
          Scores, box scores and previews for the date you pick.
        </p>
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
          <span class="section-head-icon" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M4 20h16" />
              <rect
                x="6"
                y="12"
                width="3.5"
                height="8"
                rx="1.5"
                fill="currentColor"
                stroke="none"
              />
              <rect
                x="11.5"
                y="8"
                width="3.5"
                height="12"
                rx="1.5"
                fill="currentColor"
                stroke="none"
              />
              <rect
                x="17"
                y="4"
                width="3.5"
                height="16"
                rx="1.5"
                fill="currentColor"
                stroke="none"
              />
            </svg>
          </span>
          <h2 class="section-head-text">Standings</h2>
        </div>
        <p class="section-head-sub">
          Full division picture across both leagues.
        </p>
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
</main>

<style>
  :global(html) {
    scroll-behavior: smooth;
  }

  .home-layout {
    margin: 0 auto;
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

  .section-head-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2.4rem;
    height: 2.4rem;
    flex-shrink: 0;
    color: var(--wa-color-brand-40);
    background: color-mix(
      in srgb,
      var(--wa-color-brand-fill-quiet) 80%,
      transparent
    );
    border: 1px solid var(--wa-color-brand-border-quiet);
    border-radius: 0.5rem;
    padding: 0.45rem;
    box-sizing: border-box;
  }

  .section-head-icon wa-icon {
    --wa-icon-size: 1.35rem;
    width: 100%;
    height: 100%;
  }

  .section-head-text {
    margin: 0;
    font-size: 1.6rem;
    font-weight: var(--wa-font-weight-bold, 700);
    letter-spacing: -0.01em;
    color: var(--wa-color-filled-on-normal);
  }

  .section-head-sub {
    margin: 0;
    font-size: var(--wa-font-size-m);
    color: var(--wa-color-text-quiet);
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
    text-decoration: underline;
  }

  .team-logo-name-wrapper:active {
    cursor: pointer;
    background-color: var(--wa-color-neutral-fill-normal);
    transform: scale(0.95);
    transition: all 100ms ease;
    text-decoration: underline;
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
    gap: 1.5rem;
    width: 100%;
  }

  .spotlight-leaderboard-card {
    flex: 1;
    background-color: transparent;
    border: 1px solid var(--wa-color-border-quiet);
    border-radius: var(--wa-border-radius-m);
    padding: 1.25rem;
    box-sizing: border-box;
    min-width: 320px;
  }

  .column-header-title {
    font-size: 1.1rem;
    font-weight: var(--wa-font-weight-semibold, 600);
    color: var(--wa-color-filled-on-normal);
  }

  .leaderboard-rows-stack {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .leaderboard-pager {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    margin-top: 0.875rem;
  }

  .pager-label {
    font-size: var(--wa-font-size-xs);
    color: var(--wa-color-neutral-on-quiet);
    font-family: var(--font-mono, monospace);
    min-width: 4.5rem;
    text-align: center;
  }

  .leader-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.4rem 0.5rem;
    border-radius: var(--wa-border-radius-s);
    text-decoration: none;
    color: var(--wa-color-filled-on-normal);
    transition: all 100ms ease;
  }

  .leader-row:hover {
    transform: scale(1.015);
    background-color: var(--wa-color-fill-normal);
    cursor: pointer;
    transition: all 100ms ease;

    .player-profile-name {
      text-decoration: underline;
    }
  }

  .leader-row:active {
    transform: scale(0.98);
    transition: all 100ms ease;
  }

  .leader-row:nth-child(even) {
    background-color: color-mix(
      in srgb,
      var(--wa-color-fill-normal) 30%,
      transparent
    );
  }

  .rank-name-group {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    min-width: 0;
  }

  .row-rank-num {
    font-size: var(--wa-font-size-xs);
    font-family: var(--font-mono, monospace);
    color: var(--wa-color-neutral-on-quiet);
    width: 16px;
    text-align: right;
  }

  .row-player-thumb {
    width: 26px;
    height: 26px;
    border-radius: 999px;
    object-fit: cover;
    background: var(--wa-color-neutral-fill-strong);
  }

  .player-profile-name {
    font-size: var(--wa-font-size-m);
    color: var(--wa-color-filled-on-normal);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .metric-score-value {
    font-family: var(--font-mono, monospace);
    font-weight: var(--wa-font-weight-bold, 700);
    color: var(--wa-color-filled-on-normal);
    font-size: var(--wa-font-size-m);
    padding-left: 0.5rem;
  }

  .metric-score-value.subtitle-record {
    font-size: var(--wa-font-size-xs);
    color: var(--wa-color-neutral-on-quiet);
    font-weight: var(--wa-font-weight-normal, 400);
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
      flex-direction: column;
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
