<script>
  let { team, extraBadges = [] } = $props();
</script>

<a href="/teams/{team?.id}" class="team-roster-card">
  <div class="team-info-header">
    {#if team?.logo}
      <img src={team.logo} alt={team.name} class="team-logo" loading="lazy" />
    {/if}
    <div class="team-meta">
      <span class="team-name">{team?.name || "Unknown"}</span>
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
    width: 272px;
    padding: 1rem;
    border-radius: var(--wa-border-radius-s);
    border: 1px solid
      var(--wa-color-border-quiet, var(--wa-color-brand-border-loud));
    transition: all 100ms ease;
    text-decoration: none;
    color: inherit;
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

  .team-meta {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .status-tags {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .team-name {
    font-weight: var(--wa-font-weight-semibold, 600);
    color: var(--wa-color-filled-on-normal);
    font-size: var(--wa-font-size-m);
  }
</style>
