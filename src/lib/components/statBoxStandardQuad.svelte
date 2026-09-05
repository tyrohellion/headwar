<script>
  import AnimatedCounter from "./animatedCounter.svelte";

  let {
    label1 = "",
    abbr1 = "",
    stat1 = 0,
    decimals1 = null,
    tooltip1 = "",
    label2 = "",
    abbr2 = "",
    stat2 = 0,
    decimals2 = null,
    tooltip2 = "",
    label3 = "",
    abbr3 = "",
    stat3 = 0,
    decimals3 = null,
    tooltip3 = "",
    label4 = "",
    abbr4 = "",
    stat4 = 0,
    decimals4 = null,
    tooltip4 = "",
  } = $props();

  const tooltipId = `quad-tip-${Math.random().toString(36).substring(2, 9)}`;

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

  const has1 = $derived(!isMissing(stat1));
  const has2 = $derived(!isMissing(stat2));
  const has3 = $derived(!isMissing(stat3));
  const has4 = $derived(!isMissing(stat4));

  const color1 = $derived(colorFor(abbr1, stat1));
  const color2 = $derived(colorFor(abbr2, stat2));
  const color3 = $derived(colorFor(abbr3, stat3));
  const color4 = $derived(colorFor(abbr4, stat4));

  const sideId1 = $derived(`${tooltipId}-1`);
  const sideId2 = $derived(`${tooltipId}-2`);
  const sideId3 = $derived(`${tooltipId}-3`);
  const sideId4 = $derived(`${tooltipId}-4`);
</script>

{#snippet statSide(label, abbr, stat, decimals, color, id)}
  <div class="quad-side" {id}>
    <span class="stat-label">{label}</span>
    <div class="name-badge-wrapper">
      <span class="stat-value" style="color: {color};">
        <AnimatedCounter value={stat} precision={decimals} />
      </span>
      <wa-badge appearance="filled" size="m" variant="neutral">{abbr}</wa-badge>
    </div>
  </div>
{/snippet}

{#if !has1 && !has2 && !has3 && !has4}
  <!-- empty placeholder -->
{:else}
  {#if has1 && tooltip1}
    <wa-tooltip for={sideId1}>{tooltip1}</wa-tooltip>
  {/if}
  {#if has2 && tooltip2}
    <wa-tooltip for={sideId2}>{tooltip2}</wa-tooltip>
  {/if}
  {#if has3 && tooltip3}
    <wa-tooltip for={sideId3}>{tooltip3}</wa-tooltip>
  {/if}
  {#if has4 && tooltip4}
    <wa-tooltip for={sideId4}>{tooltip4}</wa-tooltip>
  {/if}
  <div class="stat-molucule">
    <div class="quad-wrapper">
      {#if has1}
        {@render statSide(label1, abbr1, stat1, decimals1, color1, sideId1)}
      {/if}
      {#if has1 && has2}
        <div class="slash-divider"></div>
      {/if}
      {#if has2}
        {@render statSide(label2, abbr2, stat2, decimals2, color2, sideId2)}
      {/if}
      {#if has2 && has3}
        <div class="slash-divider"></div>
      {/if}
      {#if has3}
        {@render statSide(label3, abbr3, stat3, decimals3, color3, sideId3)}
      {/if}
      {#if has3 && has4}
        <div class="slash-divider"></div>
      {/if}
      {#if has4}
        {@render statSide(label4, abbr4, stat4, decimals4, color4, sideId4)}
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
    min-width: 639px;
    max-width: 922px;
    cursor: help;
    padding: 1rem 1.5rem 1.25rem 1.5rem;
    transition: all 100ms ease;
    border-radius: var(--wa-border-radius-s);
    border: 1px solid
      var(--wa-color-border-quiet, var(--wa-color-brand-border-loud));
    overflow: hidden;
  }

  .quad-wrapper {
    display: flex;
    width: 100%;
    justify-content: center;
    align-items: stretch;
    gap: 1.25rem;
  }

  .quad-side {
    display: flex;
    flex-direction: column;
    align-items: start;
    gap: 0.75rem;
    flex: 1;
    text-align: left;
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
    align-items: center;
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
    font-size: var(--wa-font-size-l);
    transition: color 0.3s ease;
  }

  @media (max-width: 760px) {
    .stat-label {
      display: none;
    }

    .stat-molucule {
      min-width: 320px;
    }

    .name-badge-wrapper {
      align-items: center;
    }

    .stat-value {
      font-size: var(--wa-font-size-m);
    }
  }
</style>
