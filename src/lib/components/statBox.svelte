<script>
  import AnimatedCounter from "./animatedCounter.svelte";

  let {
    percentile = 0,
    label = "",
    abbr = "",
    badgeText = "",
    stat = 0,
    careerSeasonLength = 0,
    progressContext = "",
    rank = undefined,
    rankHref = "",
    tooltipText = "",
    isRetired = false,
    image = "",
    imageAlt = "",
    imageFallback = "",
  } = $props();

  const tooltipId = `pill-tip-${Math.random().toString(36).substring(2, 9)}`;

  const isCareer = $derived(label.toLowerCase().includes("career"));

  // Stat family detection. The abbr drives both the value color and the bottom
  // track, so normalize it once and match case-insensitively.
  const statAbbr = $derived(String(abbr).toUpperCase());
  const isNormalizedStat = $derived(
    statAbbr === "OPS+" || statAbbr === "ERA+",
  );
  const isWarStat = $derived(statAbbr === "WAR" || statAbbr === "HWAR");
  const isOpsStat = $derived(statAbbr === "OPS");
  const isEraStat = $derived(statAbbr === "ERA" || statAbbr === "FIP");

  const isCareerWar = $derived(isCareer && isWarStat);

  const disableVisuals = $derived(isNaN(parseFloat(percentile)));

  let numericValue = $derived.by(() => {
    const num = parseFloat(percentile);
    return isNaN(num) ? 0 : num;
  });

  let activeColor = $derived.by(() => {
    if (isNaN(parseFloat(percentile))) return "var(--wa-color-neutral-text)";

    if (isCareerWar) return "var(--wa-color-filled-on-normal)";
    if (disableVisuals) return "var(--wa-color-filled-on-normal)";

    if (isNormalizedStat) {
      if (numericValue >= 140) return "var(--wa-color-success-60)";
      if (numericValue >= 115) return "var(--wa-color-success-80)";
      if (numericValue >= 90) return "var(--wa-color-neutral-50)";
      return "var(--wa-color-danger-70)";
    }

    // ERA-like stats: lower is better (matches statBoxStandardQuad/Dual).
    if (isEraStat) {
      if (numericValue <= 3.0) return "var(--wa-color-success-60)";
      if (numericValue <= 4.0) return "var(--wa-color-success-80)";
      if (numericValue <= 4.8) return "var(--wa-color-neutral-50)";
      return "var(--wa-color-danger-70)";
    }

    // OPS: higher is better (matches statBoxStandardQuad/Dual).
    if (isOpsStat) {
      if (numericValue >= 0.9) return "var(--wa-color-success-60)";
      if (numericValue >= 0.78) return "var(--wa-color-success-80)";
      if (numericValue >= 0.72) return "var(--wa-color-neutral-50)";
      return "var(--wa-color-danger-70)";
    }

    // WAR (and anything else) is higher-is-better on the WAR scale.
    if (numericValue >= 5.0) return "var(--wa-color-success-60)";
    if (numericValue >= 2.5) return "var(--wa-color-success-80)";
    if (numericValue >= 0.5) return "var(--wa-color-neutral-50)";
    return "var(--wa-color-danger-70)";
  });

  let fillWidthPercent = $derived.by(() => {
    if (!isNormalizedStat || disableVisuals) return 0;
    return Math.min(Math.max((numericValue / 200) * 100, 0), 100);
  });
</script>

{#if percentile === "N/A" || percentile === "-.--" || percentile === "NaN" || !percentile || String(percentile).includes("NaN")}
  <!-- empty placeholder -->
{:else}
  {#if tooltipText}
    <wa-tooltip for={tooltipId}>{tooltipText}</wa-tooltip>
  {/if}
  <div class="stat-molucule" id={tooltipId} class:has-image={image}>
    {#if image}
      <img
        class="stat-image"
        src={image}
        alt={imageAlt}
        loading="lazy"
        decoding="async"
        onerror={(event) => {
          const img = event.currentTarget;
          if (imageFallback && img.src !== imageFallback) {
            img.src = imageFallback;
          } else {
            img.style.display = "none";
          }
        }}
      />
    {/if}
    <span class="stat-label">{label}</span>
    <div class="name-badge-wrapper">
      <div class="war-career-length-wrapper">
        <span class="stat-value" style="color: {activeColor};">
          <AnimatedCounter value={percentile} />
        </span>
      </div>
      <div class="badges-wrapper">
        <wa-badge appearance="filled" size="m" variant="neutral"
          >{badgeText || abbr}</wa-badge
        >
        {#if !careerSeasonLength == 0}
          <wa-badge appearance="outlined" size="m" variant="neutral">
            <AnimatedCounter value={careerSeasonLength} /> Seasons
          </wa-badge>
        {/if}
        {#if rank}
          {#if rankHref}
            <a href={rankHref} class="stat-rank-link" aria-label="Open the leaderboard for this rank">
              <wa-badge appearance="accent" size="m" variant="brand"
                >{rank}</wa-badge
              >
            </a>
          {:else}
            <wa-badge appearance="accent" size="m" variant="brand"
              >{rank}</wa-badge
            >
          {/if}
        {/if}
        {#if progressContext !== ""}
          {#if isWarStat}
            <wa-badge appearance="outlined" size="m" variant="neutral">
              <AnimatedCounter value={progressContext} /> Games
            </wa-badge>
          {/if}
          {#if statAbbr === "OPS+"}
            <wa-badge appearance="outlined" size="m" variant="neutral">
              <AnimatedCounter value={progressContext} /> At Bats
            </wa-badge>
          {/if}
          {#if statAbbr === "ERA+"}
            <wa-badge appearance="outlined" size="m" variant="neutral">
              <AnimatedCounter value={progressContext} /> Innings Pitched
            </wa-badge>
          {/if}
        {/if}
      </div>
    </div>

    {#if isNormalizedStat && !disableVisuals}
      <div class="context-track">
        <div class="league-avg-tick"></div>
        <div
          class="context-fill"
          style="width: {fillWidthPercent}%; background-color: {activeColor};"
        ></div>
      </div>
    {/if}

    {#if isWarStat && !disableVisuals && !isCareerWar}
      <div class="segmented-track">
        <div
          class="track-segment"
          style="background-color: {numericValue >= 0
            ? activeColor
            : 'var(--wa-color-border-quiet)'}"
        ></div>

        <div
          class="track-segment"
          style="background-color: {numericValue >= 0.5
            ? activeColor
            : 'var(--wa-color-border-quiet)'}"
        ></div>

        <div
          class="track-segment"
          style="background-color: {numericValue >= 2.5
            ? activeColor
            : 'var(--wa-color-border-quiet)'}"
        ></div>

        <div
          class="track-segment"
          style="background-color: {numericValue >= 5.0
            ? activeColor
            : 'var(--wa-color-border-quiet)'}"
        ></div>
      </div>
    {/if}
  </div>
{/if}

<style>
  .stat-molucule {
    position: relative;
    display: flex;
    flex: 1;
    justify-content: center;
    flex-direction: column;
    align-items: start;
    gap: 1rem;
    min-width: 280px;
    cursor: help;
    padding: 1rem 3rem 1.25rem 1rem;
    transition: all 100ms ease;
    border-radius: var(--wa-border-radius-s);
    border: 1px solid
      var(--wa-color-border-quiet, var(--wa-color-brand-border-loud));
    overflow: hidden;
  }

  .name-badge-wrapper {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  wa-badge {
    height: 26px;
  }

  .stat-molucule:hover {
    transform: scale(1.03);
    transition: all 100ms ease;
    background-color: var(--wa-color-fill-normal);

    .name-badge-wrapper wa-badge {
      border-color: var(
        --wa-color-border-loud,
        var(--wa-color-brand-border-loud)
      );
    }
  }

  .stat-molucule.has-image {
    --stat-image-w: 75px;
  }

  .stat-image {
    position: absolute;
    top: 1rem;
    right: 1rem;
    width: var(--stat-image-w, 75px);
    height: auto;
    object-fit: contain;
    object-position: top right;
    pointer-events: none;
    z-index: 0;
  }

  /* Reserve the top-right corner for the image without disturbing the box's
     own padding, so the label and value never run underneath it. */
  .has-image .stat-label,
  .has-image .name-badge-wrapper {
    position: relative;
    z-index: 1;
    max-width: min(
      100%,
      calc(100% - var(--stat-image-w, 75px) + 1.5rem)
    );
  }

  .stat-label {
    font-weight: var(--wa-font-weight-semibold, 700);
    color: var(--wa-color-filled-on-normal);
    font-size: var(--wa-font-size-s);
    white-space: nowrap;
  }

  .has-image .stat-label {
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .stat-value {
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
    font-weight: var(--wa-font-weight-bold, 600);
    font-size: var(--wa-font-size-xl);
    transition: color 0.3s ease;
  }

  .war-career-length-wrapper {
    display: flex;
    align-items: center;
    gap: 0.2rem;
  }

  .badges-wrapper {
    display: flex;
    gap: 0.5rem;
  }

  .stat-rank-link {
    display: inline-flex;
    text-decoration: none;
  }

  .stat-rank-link:hover wa-badge {
    filter: brightness(1.15);
  }

  .season-count {
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
    font-weight: var(--wa-font-weight-bold, 600);
    font-size: var(--wa-font-size-s);
    color: var(--wa-color-neutral-on-quiet);
  }

  .progress-count {
    font-variant-numeric: tabular-nums;
    font-weight: var(--wa-font-weight-semibold);
    font-size: var(--wa-font-size-xs);
    color: var(--wa-color-neutral-on-quiet);
  }

  .context-track {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 4px;
    background-color: var(--wa-color-border-quiet);
  }

  .context-fill {
    height: 100%;
    transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .league-avg-tick {
    position: absolute;
    left: 50%;
    bottom: 0;
    width: 2px;
    height: 12px;
    border-top-right-radius: 1rem;
    border-top-left-radius: 1rem;
    background-color: var(--wa-color-border-loud);
    z-index: 3;
  }

  .segmented-track {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 4px;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 4px;
    background-color: transparent;
  }

  .track-segment {
    height: 100%;
    background-color: var(--wa-color-border-quiet);
    transition: background-color 0.4s ease;
  }
</style>
