<script>
  import WaBadge from "@awesome.me/webawesome/dist/components/badge/badge.js";

  let { game } = $props();

  function shortDate(dateStr) {
    if (!dateStr) return "";
    const d = new Date(`${dateStr}T00:00:00`);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  function badgeVariant(badge) {
    if (badge.highlight) return "brand";
    return "neutral";
  }

  function badgeAppearance(badge) {
    return badge.key === "strikeOuts" ? "outlined" : "filled";
  }

  function isUnderSingles(badge) {
    return (
      game.kind === "hitting" &&
      (badge.key === "runs" ||
        badge.key === "rbi" ||
        badge.key === "stolenBases" ||
        badge.key === "baseOnBalls")
    );
  }
</script>

<article class="recent-performance" title={game.detail || undefined}>
  <div class="perf-head">
    <span class="perf-date">{shortDate(game.date)}</span>
    <span class="perf-opposite">
      {game.isHome ? "vs" : "@"}
      {game.opponentAbbr}
    </span>
  </div>

  <span class="perf-value perf-{game.performance}"
    >{#if game.headlineParts}{#each game.headlineParts as part, i (part + i)}{#if i > 0}<span
            class="perf-sep">/</span
          >{/if}<span>{part.value}</span><span class="perf-unit"
          >{part.unit}</span
        >{/each}{:else}{game.headline}{/if}</span
  >

  {#if game.badges?.length}
    <div class="perf-badges">
      {#each game.badges as badge}
        <wa-badge
          appearance={badgeAppearance(badge)}
          variant={badgeVariant(badge)}
          class:perf-under={isUnderSingles(badge)}>{badge.text}</wa-badge
        >
      {/each}
    </div>
  {/if}
</article>

<style>
  .recent-performance {
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
    padding: 1rem 1rem 1.1rem;
    border: 1px solid var(--wa-color-border-quiet, rgba(0, 0, 0, 0.12));
    border-radius: var(--wa-border-radius-s);
  }

  .perf-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.5rem;
    font-size: var(--wa-font-size-s);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .perf-date {
    color: var(--wa-color-text-quiet, var(--wa-color-neutral-on-quiet));
    font-variant-numeric: tabular-nums;
  }

  .perf-opposite {
    font-weight: var(--wa-font-weight-semibold, 600);
    color: var(--wa-color-filled-on-normal);
    white-space: nowrap;
  }

  .perf-value {
    font-family: var(--font-mono, monospace);
    font-size: var(--wa-font-size-xl);
    font-weight: var(--wa-font-weight-bold, 700);
    font-variant-numeric: tabular-nums;
    color: var(--wa-color-filled-on-normal);
  }

  .perf-value.perf-elite {
    color: var(--wa-color-success-60);
  }

  .perf-value.perf-good {
    color: var(--wa-color-success-80);
  }

  .perf-value.perf-quiet {
    color: var(--wa-color-text-quiet, var(--wa-color-neutral-on-quiet));
  }

  .perf-unit {
    font-family: var(--wa-font-family-body);
    font-size: var(--wa-font-size-m);
    font-weight: var(--wa-font-weight-semibold, 600);
    letter-spacing: 0.02em;
    margin-left: 0.5em;
  }

  .perf-sep {
    color: var(--wa-color-text-quiet, var(--wa-color-neutral-on-quiet));
    margin: 0 0.35em;
  }

  .perf-badges {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.3rem;
  }

  .perf-badges :global(wa-badge) {
    width: 100%;
    min-width: max-content;
    justify-content: center;
    text-align: center;
    white-space: nowrap;
  }

  .perf-badges :global(wa-badge.perf-under[appearance="filled"]) {
    --wa-color-fill-normal: var(
      --wa-color-fill-quiet,
      var(--wa-color-brand-fill-quiet)
    );
    --wa-color-on-normal: var(--wa-color-neutral-on-normal);
  }

  @media (max-width: 768px) {
    .perf-badges {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.3rem;
  }
  }
</style>
