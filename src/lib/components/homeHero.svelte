<script>
  import WaButton from "@awesome.me/webawesome/dist/components/button/button.js";
  import WaIcon from "@awesome.me/webawesome/dist/components/icon/icon.js";
  import { searchTrigger } from "$lib/searchTrigger.svelte.js";
  import "@fontsource/bbh-bartle/400.css";

  function openSearch() {
    searchTrigger.open();
  }
</script>

<section class="hero" aria-labelledby="hero-title">
  <div class="hero-inner">
    <h1 class="statement" id="hero-title">
      <span class="hero-mark">HEADWAR</span>
      <span class="hero-line">Baseball for the modern web.</span>
    </h1>

    <wa-button
      class="hero-search"
      size="large"
      variant="neutral"
      appearance="outlined"
      pill
      onclick={openSearch}
    >
      <wa-icon slot="start" name="magnifying-glass" aria-hidden="true"
      ></wa-icon>
      <span class="hero-search-text">Search players or teams...</span>
      <kbd slot="end" class="hero-search-kbd">/</kbd>
    </wa-button>
  </div>
</section>

<style>
  .hero {
    position: relative;
    overflow: hidden;
    margin-top: calc(var(--page-pad-top, 2.5rem) * -1);
    padding: clamp(3rem, 8vw, 6rem) 0 clamp(2.75rem, 7vw, 5rem);
  }

  @keyframes hero-rise {
    from {
      opacity: 0;
      transform: translateY(16px);
    }
    to {
      opacity: 1;
      transform: none;
    }
  }

  .hero-inner {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: clamp(1.75rem, 4vw, 3rem);
    width: 100%;
    margin: 0 auto;
    container-type: inline-size;
  }

  .statement {
    display: flex;
    align-items: flex-end;
    flex-wrap: wrap;
    gap: 0.75rem clamp(1.25rem, 3cqi, 2.75rem);
    max-width: 100%;
    margin: 0;
    animation: hero-rise 600ms cubic-bezier(0.22, 1, 0.36, 1) both;
  }

  .hero-mark {
    font-family: "BBH Bartle", "Inter Variable", system-ui, sans-serif;
    font-weight: 400;
    font-size: clamp(1.5rem, 6.4cqi, 200px);
    line-height: 0.8;
    letter-spacing: 0;
    white-space: nowrap;
    color: #2564ab;
  }

  :global(html.wa-dark) .hero-mark {
    color: #8ab9f3;
  }

  @container (max-width: 640px) {
    .hero-mark {
      font-size: clamp(1.5rem, 10.2cqi, 200px);
    }
  }

  .hero-line {
    padding-bottom: 0.08em;
    max-width: 9em;
    font-family: "Inter Variable", system-ui, sans-serif;
    font-size: clamp(1.4rem, 2cqi, 2.6rem);
    line-height: 1.04;
    font-weight: 400;
    letter-spacing: -0.03em;
    color: var(--wa-color-text-normal);
    animation: hero-rise 600ms cubic-bezier(0.22, 1, 0.36, 1) 90ms both;
  }


  .hero-search {
    margin-top: 0.25rem;
    width: min(42rem, 100%);
    animation: hero-rise 600ms cubic-bezier(0.22, 1, 0.36, 1) 180ms both;
  }

  .hero-search::part(base) {
    width: 100%;
    height: 3.75rem;
    justify-content: flex-start;
    padding-inline: 1.4rem;
    font-family: "Inter Variable", system-ui, sans-serif;
    font-size: 1.125rem;
    font-weight: 400;
    color: var(--wa-color-text-quiet);
    background-color: color-mix(
      in srgb,
      var(--wa-color-surface-default) 82%,
      transparent
    );
    border: 1px solid var(--wa-color-border-quiet);
    box-shadow: var(--wa-shadow-l);
    transition: all 140ms ease;
  }

  .hero-search:hover::part(base) {
    color: var(--wa-color-text-normal);
    background-color: var(--wa-color-surface-raised);
    border-color: var(--wa-color-border-loud);
    transform: scale(1.02);
  }

  .hero-search:active::part(base) {
    transform: scale(0.99);
  }

  .hero-search::part(start) {
    color: var(--wa-color-text-quiet);
    --wa-icon-size: 1.35rem;
  }

  .hero-search::part(label) {
    display: block;
    flex: 1;
    text-align: left;
  }

  .hero-search-text {
    text-align: left;
  }

  .hero-search-kbd {
    font-family: var(--font-mono, monospace);
    font-size: 0.85rem;
    line-height: 1;
    border: 1px solid var(--wa-color-border-quiet);
    border-radius: 6px;
    padding: 0.3rem 0.5rem;
    opacity: 0.7;
    flex-shrink: 0;
  }

  @media (max-width: 480px) {
    .hero-search-kbd {
      display: none;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .statement,
    .hero-line,
    .hero-search {
      animation: none;
    }
  }
</style>
