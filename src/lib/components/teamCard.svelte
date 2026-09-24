<script>
  import { overflowFade } from "$lib/actions/overflowFade.js";

  let { team, extraBadges = [], highlighted = false } = $props();

  let imgLoaded = $state(false);
</script>

<a href="/teams/{team?.id}" class="team-roster-card" class:highlighted>
  {#if highlighted}
    <span class="enter-badge" aria-hidden="true">↵ Enter</span>
  {/if}
  <div class="team-info-header">
    {#if team?.logo}
      {#if !imgLoaded}
        <div class="img-placeholder" aria-hidden="true"></div>
      {/if}
      <img
        src={team.logo}
        alt={team.name}
        class="team-logo"
        class:img-hidden={!imgLoaded}
        onload={() => (imgLoaded = true)}
      />
    {/if}
    <div class="team-meta">
      <span class="team-name" use:overflowFade>{team?.name || "Unknown"}</span>
      <div class="status-tags">
        {#if team?.abbreviation}
          <wa-badge appearance="filled" size="s" variant="neutral"
            >{team.abbreviation}</wa-badge
          >
        {/if}
        {#if team?.leagueName}
          <wa-badge appearance="filled" size="s" variant="neutral"
            >{team.leagueName}</wa-badge
          >
        {/if}
        {#each extraBadges as badge}
          <wa-badge appearance="filled" size="s" variant="neutral"
            >{badge}</wa-badge
          >
        {/each}
      </div>
    </div>
  </div>
</a>

<style>
  .team-roster-card {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    width: 296px;
    padding: 1rem;
    border-radius: var(--wa-border-radius-s);
    border: 1px solid
      var(--wa-color-border-quiet, var(--wa-color-brand-border-loud));
    transition: all 100ms ease;
    text-decoration: none;
    color: inherit;
    overflow: hidden;
    position: relative;
  }

  .team-roster-card.highlighted {
    border-color: var(--wa-color-brand-border-loud);
    background-color: color-mix(
      in srgb,
      var(--wa-color-brand-fill-normal) 14%,
      transparent
    );
    box-shadow: 0 0 0 1px var(--wa-color-brand-border-loud);
  }

  .enter-badge {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    z-index: 1;
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    font-family: var(--font-mono, monospace);
    font-size: 0.6rem;
    font-weight: 700;
    line-height: 1;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--wa-color-brand-on-loud);
    background-color: var(--wa-color-brand-fill-loud);
    border-radius: 999px;
    padding: 0.3rem 0.5rem;
    box-shadow: var(--wa-shadow-s);
    pointer-events: none;
    user-select: none;
  }

  .team-roster-card:hover {
    transform: scale(1.03);
    background-color: var(--wa-color-fill-normal);
    border-color: var(--wa-color-border-quiet);
    cursor: pointer;

    .team-name {
      text-decoration: underline;
      text-decoration-color: var(--wa-color-fill-accent-quiet);
    }

    wa-badge {
      border-color: var(
        --wa-color-border-loud,
        var(--wa-color-brand-border-loud)
      );
    }
  }

  .team-roster-card:active {
    transform: scale(0.95);
    background-color: var(--wa-color-fill-normal);
    border-color: var(--wa-color-border-quiet);
    cursor: pointer;

    .team-name {
      text-decoration: underline;
      text-decoration-color: var(--wa-color-fill-accent-quiet);
    }

    wa-badge {
      border-color: var(
        --wa-color-border-loud,
        var(--wa-color-brand-border-loud)
      );
    }
  }

  .team-info-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    width: 100%;
  }

  .team-logo {
    width: 48px;
    height: 48px;
    border-radius: var(--wa-border-radius-m);
    background-color: var(--wa-color-gray-70);
    padding: 0.3rem;
    object-fit: contain;
    box-shadow: var(--wa-shadow-m);
    border: 1px solid var(--wa-color-border-quiet);
    box-sizing: border-box;
    flex-shrink: 0;
  }

  .img-hidden {
    display: none;
  }

  .img-placeholder {
    width: 45.6px;
    height: 67.64px;
    border-radius: var(--wa-border-radius-m);
    background-color: var(--wa-color-gray-70);
    flex-shrink: 0;
    animation: img-pulse 1.2s ease-in-out infinite;
  }

  @keyframes img-pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.4;
    }
  }

  .team-meta {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    min-width: 0;
  }

  .status-tags {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    max-width: 100%;
  }

  .team-name {
    font-weight: var(--wa-font-weight-semibold, 600);
    color: var(--wa-color-filled-on-normal);
    font-size: var(--wa-font-size-m);
    display: block;
    white-space: nowrap;
    overflow: hidden;
  }

  .team-name.overflowing {
    mask-image: linear-gradient(to right, black calc(100% - 28px), transparent);
    -webkit-mask-image: linear-gradient(
      to right,
      black calc(100% - 28px),
      transparent
    );
  }

  @media (max-width: 480px) {
    .team-roster-card {
      width: 100%;
    }
  }
</style>
