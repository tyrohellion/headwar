<script>
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";

  import {
    getBoard,
    headshotUrl,
    availableSeasons,
    resolvePlayerNames,
    cachedPlayerName,
  } from "$lib/leaderboardData.js";
  import {
    defaultStatKey,
    findStat,
    groupedStats,
    statAvailable,
  } from "$lib/leaderboardStats.js";

  import WaSelect from "@awesome.me/webawesome/dist/components/select/select.js";
  import WaOption from "@awesome.me/webawesome/dist/components/option/option.js";
  import WaSpinner from "@awesome.me/webawesome/dist/components/spinner/spinner.js";
  import WaBadge from "@awesome.me/webawesome/dist/components/badge/badge.js";
  import WaDivider from "@awesome.me/webawesome/dist/components/divider/divider.js";
  import WaSwitch from "@awesome.me/webawesome/dist/components/switch/switch.js";

  let board = $state(null);
  let loading = $state(true);
  let boardLoading = $state(false);
  let errorMsg = $state("");

  let namespace = $state("hitting");
  let statKey = $state(defaultStatKey("hitting"));
  let season = $state(""); // "" = current season, "career" = all time
  let league = $state("ALL");
  let position = $state("ALL");
  let qualifiedOnly = $state(true);
  let order = $state("default"); // "default" | "asc" | "desc"
  let limit = $state(50);

  const HEADSHOT_FALLBACK =
    "https://img.mlbstatic.com/mlb-photos/image/upload/w_60,d_people:generic:headshot:67:current.png/v1/people/generic/headshot/67/current";

  const currentSeason = new Date().getFullYear();

  const seasons = availableSeasons();

  let stat = $derived(findStat(namespace, statKey));

  let statOptions = $derived(groupedStats(namespace, effectiveSeason));

  let qualifierKey = $derived(stat?.qualifier || null);

  let effectiveSeason = $derived(season || String(currentSeason));

  function readUrl(url) {
    const params = url.searchParams;
    const group = params.get("group");
    if (group === "hitting" || group === "pitching") namespace = group;

    const stat_ = params.get("stat");
    if (stat_ && findStat(namespace, stat_)) statKey = stat_;
    else statKey = defaultStatKey(namespace);

    const s = params.get("season");
    season = s ? s : "";

    league = params.get("league") || "ALL";
    // "X" is the API's marker for no fielding position and is never offered, so
    // ignore it if an old link carries it.
    const p = params.get("position") || "ALL";
    position = p === "X" ? "ALL" : p;

    const q = params.get("qualified");
    qualifiedOnly = q === null ? true : q !== "0";

    const o = params.get("order");
    order = o === "asc" || o === "desc" ? o : "default";

    const l = Number(params.get("limit"));
    limit = Number.isFinite(l) && l > 0 ? l : 50;
  }

  function writeUrl() {
    const params = new URLSearchParams();
    params.set("group", namespace);
    params.set("stat", statKey);
    if (season) params.set("season", season);
    if (league !== "ALL") params.set("league", league);
    if (position !== "ALL") params.set("position", position);
    if (!qualifiedOnly) params.set("qualified", "0");
    if (order !== "default") params.set("order", order);
    if (limit !== 50) params.set("limit", String(limit));
    goto(`/leaderboard?${params.toString()}`, { replaceState: true, noScroll: true, keepFocus: true });
  }

  let hydrated = false;
  $effect(() => {
    const snapshot = [namespace, statKey, season, league, position, qualifiedOnly, order, limit];
    if (!hydrated) return;
    void snapshot;
    writeUrl();
  });

  onMount(() => {
    readUrl($page.url);
    hydrated = true;
  });

  $effect(() => {
    const key = [namespace, effectiveSeason, statKey];
    if (!hydrated) return;
    void key;
    loadBoard();
  });

  let requestSeq = 0;

  async function loadBoard() {
    const target = effectiveSeason;
    if (!target) return;
    if (!stat) return;
    // A career link that points at a season-only stat is corrected by the
    // guard effect; skip the doomed fetch until it is.
    if (!statAvailable(stat, target)) return;
    const seq = ++requestSeq;
    boardLoading = true;
    errorMsg = "";
    try {
      const result = await getBoard({
        namespace,
        season: target,
        stat,
      });
      if (seq !== requestSeq) return;
      board = result;
    } catch (err) {
      if (seq !== requestSeq) return;
      console.error(err);
      board = null;
      errorMsg = `Could not load the ${target === "career" ? "all-time" : target} leaderboard.`;
    } finally {
      if (seq === requestSeq) {
        boardLoading = false;
        loading = false;
      }
    }
  }

  $effect(() => {
    const current = findStat(namespace, statKey);
    if (!current || !statAvailable(current, effectiveSeason)) {
      statKey = defaultStatKey(namespace);
    }
  });

  let rowsRaw = $derived(board?.rows ?? []);

  // The fielding positions actually present, minus "P" (the pitchers group
  // switch), the pitcher roles (their own options), and "X" (the API's marker
  // for a player with no fielding position).
  let positions = $derived.by(() => {
    const set = new Set();
    for (const row of rowsRaw) set.add(row.position);
    return [...set]
      .filter((p) => p && p !== "P" && p !== "SP" && p !== "RP" && p !== "X")
      .sort();
  });

  let leagues = $derived.by(() => {
    const set = new Set();
    for (const row of rowsRaw) set.add(row.league);
    return [...set].filter(Boolean).sort();
  });

  let lowerIsBetter = $derived(!!stat?.lower);

  let sortDirection = $derived.by(() => {
    if (order === "asc") return 1;
    if (order === "desc") return -1;
    return lowerIsBetter ? 1 : -1;
  });

  let rows = $derived.by(() => {
    if (!stat) return [];

    let out = rowsRaw.filter((row) => row.value !== null && row.value !== undefined);

    // "Qualified only" means two things: the numeric sample threshold for the
    // stats that have one, and the rank-based gate B-Ref already applied to
    // OPS+/ERA+ (unranked rows are the 2-at-bat cameos).
    if (qualifiedOnly) {
      out = out.filter((row) => row.qualified !== false);
      if (qualifierKey) {
        out = out.filter((row) => {
          const threshold = qualificationThreshold(qualifierKey, effectiveSeason, row.position);
          if (threshold <= 0) return true;
          return row.qualifierValue !== null && row.qualifierValue >= threshold;
        });
      }
    }

    out = out.filter((row) => {
      if (league !== "ALL" && row.league !== league) return false;
      if (position !== "ALL" && row.position !== position) return false;
      return true;
    });

    out = [...out].sort((a, b) => {
      const diff = (a.value - b.value) * sortDirection;
      if (diff !== 0) return diff;
      return (a.name || "").localeCompare(b.name || "");
    });

    return out.slice(0, limit);
  });

  let resolvedNames = $state({});

  $effect(() => {
    const ids = rows.map((row) => row.id);
    if (!ids.length) return;
    const pending = ids.filter((id) => !resolvedNames[id] && !cachedPlayerName(id));
    if (!pending.length) return;
    resolvePlayerNames(pending).then(() => {
      const next = {};
      for (const row of rows) {
        const name = cachedPlayerName(row.id);
        if (name) next[row.id] = name;
      }
      resolvedNames = { ...resolvedNames, ...next };
    });
  });

  function displayName(entry) {
    return entry.name || resolvedNames[entry.id] || cachedPlayerName(entry.id) || String(entry.id);
  }

  const HITTING_PA_PER_GAME = 3.1;
  const SEASON_GAMES = 162;

  // The sample a player needs before their rate stat counts, scaled to their
  // role so a relief pitcher is not held to a starter's innings (which would
  // empty the relief-pitcher view entirely).
  function qualificationThreshold(key, forSeason, pos) {
    const relief = pos === "RP";
    if (forSeason === "career") {
      // Career boards are not qualified upstream: a one-inning mop-up outing
      // shows up as a 0.00 career ERA, so a real career sample is required.
      if (key === "inningsPitched") return relief ? 150 : 500;
      if (key === "battersFaced") return relief ? 600 : 2000;
      if (key === "plateAppearances") return 1500;
      if (key === "atBats") return 1300;
      return 0;
    }
    if (key === "plateAppearances") return Math.round(SEASON_GAMES * HITTING_PA_PER_GAME);
    if (key === "inningsPitched") return relief ? 50 : 162;
    if (key === "battersFaced") return relief ? 200 : 500;
    if (key === "atBats") return 400;
    return 0;
  }

  let maxValue = $derived.by(() => {
    if (!rows.length) return 1;
    return Math.max(...rows.map((entry) => Math.abs(entry.value))) || 1;
  });


  function formatValue(value) {
    if (value === null || value === undefined) return "—";
    const decimals = stat?.decimals;
    if (decimals === null || decimals === undefined) return String(value);
    const num = Number(value);
    if (!Number.isFinite(num)) return String(value);
    const text = num.toFixed(decimals);
    if (decimals >= 3 && text.startsWith("0.")) return text.slice(1);
    return text;
  }

  let sentence = $derived.by(() => {
    const statLabel = stat?.label ?? "the leaders";
    const pos =
      position === "ALL"
        ? namespace === "pitching"
          ? "pitchers"
          : "hitters"
        : positionLabel(position);
    const scope = effectiveSeason === "career" ? "all time" : `in ${effectiveSeason}`;
    const lg = league === "ALL" ? "MLB" : leagueName(league);
    const dir = lowerIsBetter ? "lowest first" : "highest first";
    return `Top ${pos} by ${statLabel} ${scope} in the ${lg}, ${dir}`;
  });

  function positionLabel(code) {
    const map = { SP: "starting pitchers", RP: "relief pitchers" };
    return map[code] || code;
  }

  function leagueName(code) {
    if (code === "AL") return "American League";
    if (code === "NL") return "National League";
    return code;
  }

  function ordinal(n) {
    const mod100 = n % 100;
    if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
    switch (n % 10) {
      case 1: return `${n}st`;
      case 2: return `${n}nd`;
      case 3: return `${n}rd`;
      default: return `${n}th`;
    }
  }

  function onNamespaceChange(value) {
    namespace = value;
    statKey = defaultStatKey(value);
    position = "ALL";
  }

  function toggleOrder() {
    order = order === "asc" ? "desc" : "asc";
  }

  let rowBarWidth = (entry) => {
    if (!maxValue) return 0;
    const pct = (Math.abs(entry.value) / maxValue) * 100;
    return Math.min(Math.max(pct, 2), 100);
  };

  let trendClass = (entry) => {
    if (stat?.pct) {
      const v = entry.value;
      if (v >= 90) return "great";
      if (v >= 70) return "good";
      if (v >= 40) return "avg";
      return "bad";
    }
    return lowerIsBetter ? "avg" : "avg";
  };
</script>

<svelte:head>
  <title>Leaderboard — headwar</title>
</svelte:head>

<div class="leaderboard-page">
  <div class="leaderboard-head">
    <h2>Leaderboard</h2>
              <wa-switch
        size="s"
        checked={qualifiedOnly}
        onchange={(e) => (qualifiedOnly = e.target.checked)}
      >
        Qualified only
      </wa-switch>
  </div>

  <div class="controls" aria-label="Leaderboard filters">
    <div class="control">
      <label>Show me top</label>
      <wa-select
        size="s"
        value={position}
        onchange={(e) => {
          const v = e.target.value;
          if (v === "pitchers") onNamespaceChange("pitching");
          else if (v === "hitters") onNamespaceChange("hitting");
          else position = v;
        }}
      >
        <wa-option value="ALL">everyone</wa-option>
        {#if namespace === "pitching"}
          <wa-option value="SP">starting pitchers</wa-option>
          <wa-option value="RP">relief pitchers</wa-option>
        {:else}
          {#each positions as pos}
            <wa-option value={pos}>{pos}</wa-option>
          {/each}
        {/if}
        {#if namespace === "pitching"}
          <wa-option value="hitters">hitters</wa-option>
        {:else}
          <wa-option value="pitchers">P</wa-option>
        {/if}
      </wa-select>
    </div>

    <div class="control">
      <label>by</label>
      <wa-select size="s" value={statKey} onchange={(e) => (statKey = e.target.value)}>
        {#each statOptions as group}
          {#each group.stats as option}
            <wa-option value={option.key}>{option.label}</wa-option>
          {/each}
        {/each}
      </wa-select>
    </div>

    <div class="control">
      <label>in the</label>
      <wa-select size="s" value={league} onchange={(e) => (league = e.target.value)}>
        <wa-option value="ALL">MLB</wa-option>
        {#each leagues as lg}
          <wa-option value={lg}>{leagueName(lg)}</wa-option>
        {/each}
      </wa-select>
    </div>

    <div class="control">
      <label>in</label>
      <wa-select size="s" value={effectiveSeason} onchange={(e) => (season = e.target.value)}>
        <wa-option value="career">all time</wa-option>
        {#each seasons as option}
          <wa-option value={String(option)}>{option}</wa-option>
        {/each}
      </wa-select>
    </div>

    <div class="control">
      <label>grouped as</label>
      <wa-select
        size="s"
        value={order}
        onchange={(e) => (order = e.target.value)}
      >
        <wa-option value="default">{lowerIsBetter ? "lowest first" : "highest first"}</wa-option>
        <wa-option value="desc">highest first</wa-option>
        <wa-option value="asc">lowest first</wa-option>
      </wa-select>
    </div>

    <div class="control">
      <label>showing</label>
      <wa-select size="s" value={String(limit)} onchange={(e) => (limit = Number(e.target.value))}>
        <wa-option value="10">top 10</wa-option>
        <wa-option value="25">top 25</wa-option>
        <wa-option value="50">top 50</wa-option>
        <wa-option value="100">top 100</wa-option>
      </wa-select>
    </div>
  </div>

  <wa-divider></wa-divider>

  {#if loading && !board}
    <div class="status-message">
      <wa-spinner style="font-size: 3rem;"></wa-spinner>
    </div>
  {:else if errorMsg}
    <div class="status-message error">
      <p>{errorMsg}</p>
    </div>
  {:else if !board}
    <div class="status-message">
      <p>No leaderboard is available for this season.</p>
    </div>
  {:else}
    <div class="table" class:is-loading={boardLoading}>
      <div class="table-head">
        <span class="col-rank">#</span>
        <span class="col-player-header">Player</span>
        <span class="col-team">Team</span>
        <span class="col-pos">Pos</span>
        <span class="col-value">{stat?.abbr ?? "Value"}</span>
      </div>

      {#each rows as entry, i (entry.id)}
        <a class="table-row" href="/players/{entry.id}">
          <span class="col-rank">{ordinal(i + 1)}</span>
          <span class="col-player">
            <img
              class="headshot"
              src={headshotUrl(entry.id)}
              alt=""
              loading="lazy"
              onerror={(e) => (e.target.src = HEADSHOT_FALLBACK)}
            />
            <span class="player-name">{displayName(entry)}</span>
          </span>
          <span class="col-team">
            {#if entry.team}
              <wa-badge appearance="filled" size="s" variant="neutral">
                {entry.team.abbr || entry.team.short}
              </wa-badge>
            {/if}
          </span>
          <span class="col-pos">{entry.position}</span>
          <span class="col-value tabular" class:great={trendClass(entry) === "great"} class:good={trendClass(entry) === "good"}>
            <span class="value-bar" style="width: {rowBarWidth(entry)}%"></span>
            <span class="value-text">{formatValue(entry.value)}</span>
          </span>
        </a>
      {/each}

      {#if rows.length === 0}
        <div class="empty-inline-state">
          <p>No qualified players matched these filters. Try turning off "Qualified only" or picking another stat.</p>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .leaderboard-page {
    max-width: 1080px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .leaderboard-head h2 {
    margin: 0 0 0.5rem;
    font-size: 1.8rem;
    color: var(--wa-color-filled-on-normal);
  }

  .leaderboard-head {
    display: flex;
    gap: 1rem;
    align-items: center;
  }

  .sentence {
    margin: 0;
    font-size: 1.1rem;
    color: var(--wa-color-neutral-on-quiet);
  }

  .controls {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.75rem 1rem;
  }

  .control {
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  .control label {
    font-size: var(--wa-font-size-s);
    color: var(--wa-color-text-quiet);
    white-space: nowrap;
  }

  .control wa-select {
    min-width: 9rem;
  }

  .switch-control {
    margin-left: auto;
  }

  .status-message {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 40vh;
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

  .table {
    display: flex;
    flex-direction: column;
    transition: opacity 120ms ease;
  }

  .table.is-loading {
    opacity: 0.45;
    pointer-events: none;
  }

  .table-head,
  .table-row {
    display: grid;
    /* The API always hands back a short team code ("NYY"), so the team lane
       only needs room for a badge. It stays clipped so an unexpected long value
       can never bleed into the position column. */
    grid-template-columns: 3.5rem minmax(0, 1fr) 4.5rem 3.5rem minmax(6rem, 9rem);
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem 0.75rem;
  }

  .table-head {
    font-size: var(--wa-font-size-xs);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--wa-color-text-quiet);
    border-bottom: 1px solid var(--wa-color-border-quiet);
  }

  .table-row {
    text-decoration: none;
    color: inherit;
    border-bottom: 1px solid
      color-mix(in srgb, var(--wa-color-border-quiet) 50%, transparent);
    border-radius: var(--wa-border-radius-s);
    transition: background-color 100ms ease;
  }

  .table-row:hover {
    background-color: var(--wa-color-fill-normal);
  }

  .col-rank {
    font-variant-numeric: tabular-nums;
    color: var(--wa-color-text-quiet);
    font-size: var(--wa-font-size-s);
  }

  .col-player {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    min-width: 0;
  }

  .col-player-header {
    color: var(--wa-color-text-quiet);
    font-size: var(--wa-font-size-s);
  }

  .headshot {
    width: 32px;
    height: 44px;
    object-fit: cover;
    border-radius: var(--wa-border-radius-s);
    background-color: var(--wa-color-gray-80);
    flex-shrink: 0;
  }

  .player-name {
    font-weight: var(--wa-font-weight-semibold, 600);
    color: var(--wa-color-filled-on-normal);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .col-team,
  .col-pos {
    color: var(--wa-color-text-quiet);
    font-size: var(--wa-font-size-s);
    min-width: 0;
    overflow: hidden;
  }

  .col-team {
    display: flex;
  }

  .col-team wa-badge {
    max-width: 100%;
    min-width: 0;
  }

  .col-value {
    position: relative;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    padding: 0.4rem 0.5rem;
    overflow: hidden;
    font-weight: 550;
    font-size: var(--wa-font-size-s);
  }

  .tabular {
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
  }

  .value-bar {
    position: absolute;
    right: 0;
    top: 0;
    bottom: 0;
    background-color: color-mix(
      in srgb,
      var(--wa-color-brand-fill-loud) 22%,
      transparent
    );
    border-radius: var(--wa-border-radius-s);
    z-index: 0;
  }

  .value-text {
    position: relative;
    z-index: 1;
  }

  .col-value.great .value-text {
    color: var(--wa-color-success-60);
  }

  .col-value.good .value-text {
    color: var(--wa-color-success-80);
  }

  @media (max-width: 768px) {
    .switch-control {
      margin-left: 0;
    }

    .table-head,
    .table-row {
      grid-template-columns: 2.5rem minmax(0, 1fr) minmax(5rem, 7rem);
    }

    .col-team,
    .col-pos {
      display: none;
    }
  }
</style>
