<script>
  import AnimatedCounter from "./animatedCounter.svelte";

  /**
   * A variant of StatBoxStandard that combines two related stats into a single
   * box, separated by a vertical divider that has a slight diagonal angle.
   *
   * Example: ERA and FIP side by side.
   *
   * Each stat supports its own label, badge abbr, value, formatting precision,
   * tooltip and color thresholds.
   */
  let {
    // "left" / "primary" stat
    label = "",
    abbr = "",
    stat = 0,
    decimals = null,
    // "right" / "secondary" stat
    label2 = "",
    abbr2 = "",
    stat2 = 0,
    decimals2 = null,
    // overall box tooltip (optional)
    tooltipText = "",
  } = $props();

  const tooltipId = `dual-tip-${Math.random().toString(36).substring(2, 9)}`;

  function isMissing(value) {
    return (
      value === "N/A" ||
      value === "-.--" ||
      value === "NaN" ||
      value === undefined ||
      value === null
    );
  }

  function colorFor(abbr, stat) {
    const numericValue = parseFloat(stat);
    if (isNaN(numericValue) || numericValue === 0)
      return "var(--wa-color-filled-on-normal)";

    const ua = String(abbr).toUpperCase();
    const isEraLike = ua === "ERA" || ua === "FIP";
    const isWHIP = ua === "WHIP";
    const isBB = ua === "BB/9" || ua === "BB";
    const isOpp = ua === "OOBP" || ua === "OOPS";
    const isK = ua === "K/9";
    const isAvg = ua === "AVG" || ua === "BA";
    const isObp = ua === "OBP";
    const isSlg = ua === "SLG";
    const isOps = ua === "OPS";

    if (isEraLike) {
      if (numericValue <= 3.0) return "var(--wa-color-success-60)";
      if (numericValue <= 4.0) return "var(--wa-color-success-80)";
      if (numericValue <= 4.8) return "var(--wa-color-neutral-50)";
      return "var(--wa-color-danger-70)";
    }

    if (isWHIP) {
      if (numericValue <= 1.1) return "var(--wa-color-success-60)";
      if (numericValue <= 1.25) return "var(--wa-color-success-80)";
      if (numericValue <= 1.35) return "var(--wa-color-neutral-50)";
      return "var(--wa-color-danger-70)";
    }

    if (isBB) {
      if (numericValue <= 2.2) return "var(--wa-color-success-60)";
      if (numericValue <= 3.0) return "var(--wa-color-success-80)";
      if (numericValue <= 3.8) return "var(--wa-color-neutral-50)";
      return "var(--wa-color-danger-70)";
    }

    if (isObp) {
      if (numericValue >= 0.39) return "var(--wa-color-success-60)";
      if (numericValue >= 0.35) return "var(--wa-color-success-80)";
      if (numericValue >= 0.315) return "var(--wa-color-neutral-50)";
      return "var(--wa-color-danger-70)";
    }

    if (isAvg) {
      if (numericValue >= 0.3) return "var(--wa-color-success-60)";
      if (numericValue >= 0.27) return "var(--wa-color-success-80)";
      if (numericValue >= 0.24) return "var(--wa-color-neutral-50)";
      return "var(--wa-color-danger-70)";
    }

    if (isSlg) {
      if (numericValue >= 0.5) return "var(--wa-color-success-60)";
      if (numericValue >= 0.44) return "var(--wa-color-success-80)";
      if (numericValue >= 0.39) return "var(--wa-color-neutral-50)";
      return "var(--wa-color-danger-70)";
    }

    if (isOps) {
      if (numericValue >= 0.9) return "var(--wa-color-success-60)";
      if (numericValue >= 0.8) return "var(--wa-color-success-80)";
      if (numericValue >= 0.72) return "var(--wa-color-neutral-50)";
      return "var(--wa-color-danger-70)";
    }

    if (isOpp) {
      if (numericValue <= 0.66) return "var(--wa-color-success-60)";
      if (numericValue <= 0.73) return "var(--wa-color-success-80)";
      if (numericValue <= 0.78) return "var(--wa-color-neutral-50)";
      return "var(--wa-color-danger-70)";
    }

    if (isK) {
      if (numericValue >= 10.0) return "var(--wa-color-success-60)";
      if (numericValue >= 8.5) return "var(--wa-color-success-80)";
      if (numericValue >= 7.0) return "var(--wa-color-neutral-50)";
      return "var(--wa-color-danger-70)";
    }

    return "var(--wa-color-filled-on-normal)";
  }

  const hasLeft = $derived(!isMissing(stat));
  const hasRight = $derived(!isMissing(stat2));
  const showDivider = $derived(hasLeft && hasRight);

  const leftColor = $derived(colorFor(abbr, stat));
  const rightColor = $derived(colorFor(abbr2, stat2));
</script>

{#if !hasLeft && !hasRight}
  <!-- empty placeholder -->
{:else}
  {#if tooltipText}
    <wa-tooltip for={tooltipId}>{tooltipText}</wa-tooltip>
  {/if}
  <div class="stat-molucule" id={tooltipId}>
    <div class="dual-wrapper">
      {#if hasLeft}
        <div class="dual-side left-side">
          <span class="stat-label">{label}</span>
          <div class="name-badge-wrapper">
            <span class="stat-value" style="color: {leftColor};">
              <AnimatedCounter value={stat} precision={decimals} />
            </span>
            <wa-badge appearance="filled" size="m" variant="neutral"
              >{abbr}</wa-badge
            >
          </div>
        </div>
      {/if}

      {#if showDivider}
        <div class="slash-divider"></div>
      {/if}

      {#if hasRight}
        <div class="dual-side right-side">
          <span class="stat-label">{label2}</span>
          <div class="name-badge-wrapper">
            <span class="stat-value" style="color: {rightColor};">
              <AnimatedCounter value={stat2} precision={decimals2} />
            </span>
            <wa-badge appearance="filled" size="m" variant="neutral"
              >{abbr2}</wa-badge
            >
          </div>
        </div>
      {/if}
    </div>
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
    padding: 1rem 1.5rem 1.25rem 1.5rem;
    transition: all 100ms ease;
    border-radius: var(--wa-border-radius-s);
    border: 1px solid
      var(--wa-color-border-quiet, var(--wa-color-brand-border-loud));
    overflow: hidden;
  }

  .dual-wrapper {
    display: flex;
    width: 100%;
    justify-content: center;
    align-items: stretch;
    gap: 1.5rem;
  }

  .dual-side {
    display: flex;
    flex-direction: column;
    align-items: start;
    gap: 0.75rem;
    flex: 1;
    min-width: 0;
  }

  .left-side {
    padding-left: 0.75rem;
    text-align: left;
  }

  .right-side {
    text-align: left;
    padding-left: 0.75rem;
  }

  .slash-divider {
    position: relative;
    width: 2px;
    align-self: stretch;
    background-color: var(
      --wa-color-border-quiet,
      var(--wa-color-brand-border-loud)
    );
    transform: skewX(-10deg);
    border-radius: var(--wa-border-radius-s);
  }

  .name-badge-wrapper {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  wa-badge {
    width: 42px;
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

  .stat-label {
    font-weight: var(--wa-font-weight-semibold, 700);
    color: var(--wa-color-filled-on-normal);
    font-size: var(--wa-font-size-xs);
    white-space: nowrap;
  }

  .stat-value {
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
    font-weight: var(--wa-font-weight-bold, 600);
    font-size: var(--wa-font-size-xl);
    transition: color 0.3s ease;
  }
</style>
