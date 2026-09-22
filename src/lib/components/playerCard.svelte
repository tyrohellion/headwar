<script>
  import { overflowFade } from "$lib/actions/overflowFade.js";

  let { player, position = "", extraBadges = [] } = $props();

  const isInjured = $derived(player.status?.code && player.status.code !== "A");
  let imgLoaded = $state(false);
</script>

<a
  href="/players/{player.person?.id}"
  class="player-roster-card"
  class:il-card={isInjured}
>
  <div class="player-info-header">
    {#if player.person?.id}
      {#if !imgLoaded}
        <div class="img-placeholder" aria-hidden="true"></div>
      {/if}
      <img
        src="https://img.mlbstatic.com/mlb-photos/image/upload/d_default_profile.png/w_60,q_auto:best/v1/people/{player
          .person.id}/headshot/67/current"
        alt={player.person.fullName}
        class="player-headshot"
        class:dimmed={isInjured}
        class:img-hidden={!imgLoaded}
        onload={() => (imgLoaded = true)}
        onerror={(e) => {
          e.target.src =
            "https://img.mlbstatic.com/mlb-photos/image/upload/w_60,d_people:generic:headshot:67:current.png/v1/people/generic/headshot/67/current";
        }}
      />
    {/if}
    <div class="player-meta">
      <span class="player-name" use:overflowFade
        >{player.person?.fullName || "Unknown"}</span
      >
      <div class="status-tags">
        <wa-badge appearance="filled" size="s" variant="brand"
          >{player.position?.name || position}</wa-badge
        >
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
  .player-roster-card {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    width: 360px;
    height: 104px;
    padding: 1rem;
    border-radius: var(--wa-border-radius-s);
    border: 1px solid
      var(--wa-color-border-quiet, var(--wa-color-brand-border-loud));
    transition: all 100ms ease;
    text-decoration: none;
    color: inherit;
    overflow: hidden;
  }

  .player-roster-card:hover {
    transform: scale(1.03);
    background-color: var(--wa-color-fill-normal);
    border-color: var(--wa-color-border-quiet);
    cursor: pointer;

    .player-name {
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

  .player-roster-card:active {
    transform: scale(0.95);
    background-color: var(--wa-color-fill-normal);
    border-color: var(--wa-color-border-quiet);
    cursor: pointer;

    .player-name {
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

  .player-roster-card.il-card {
    opacity: 0.85;
    background-color: rgba(var(--wa-color-neutral-rgb), 0.02);
  }

  .player-info-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    width: 100%;
  }

  .player-headshot {
    width: 45.6px;
    height: 67.64px;
    border-radius: var(--wa-border-radius-m);
    background-color: var(--wa-color-gray-80);
    object-fit: cover;
    box-shadow: var(--wa-shadow-m);
    border: 1px solid var(--wa-color-border-quiet);
  }

  .player-headshot.dimmed {
    filter: grayscale(40%);
    opacity: 0.7;
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

  .player-meta {
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

  .player-name {
    font-weight: var(--wa-font-weight-semibold, 600);
    color: var(--wa-color-filled-on-normal);
    font-size: var(--wa-font-size-m);
    display: block;
    white-space: nowrap;
    overflow: hidden;
  }

  .player-name.overflowing {
    mask-image: linear-gradient(to right, black calc(100% - 28px), transparent);
    -webkit-mask-image: linear-gradient(
      to right,
      black calc(100% - 28px),
      transparent
    );
  }

  @media (max-width: 480px) {
    .player-roster-card {
      width: 100%;
    }
  }
</style>
