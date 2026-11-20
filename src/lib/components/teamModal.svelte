<script>
  import { beforeNavigate, goto } from "$app/navigation";
  import { fade, fly } from "svelte/transition";

  import WaSelect from "@awesome.me/webawesome/dist/components/select/select.js";
  import WaOption from "@awesome.me/webawesome/dist/components/option/option.js";

  import { getTeamInfo } from "../../api/getTeamInfo";
  import { getTeamLogo } from "../../api/getTeamLogo";
  import { teamModalTrigger } from "$lib/teamModalTrigger.svelte.js";
  import StatBoxTeamInfo from "$lib/components/statBoxTeamInfo.svelte";
  import RosterShowcase from "$lib/components/rosterShowcase.svelte";

  const CURRENT_SEASON = String(new Date().getFullYear());

  let teamData = $state(null);
  let loading = $state(false);
  let errorMsg = $state("");
  let selectedSeason = $state(CURRENT_SEASON);
  let seasonOptions = $state([CURRENT_SEASON]);

  const activeTeam = $derived(teamModalTrigger.team);
  const logoUrl = $derived(
    activeTeam ? activeTeam.logo || getTeamLogo(activeTeam.id) : "",
  );
  const roster = $derived(teamData?.roster ?? []);

  // A different team gets a fresh filter; changing seasons on the same team
  // keeps the dropdown mounted so the new data can load underneath it.
  $effect(() => {
    const id = activeTeam?.id;
    selectedSeason = CURRENT_SEASON;
    seasonOptions = id ? [CURRENT_SEASON] : [];
  });

  // Reload for a different team or season. The cancellation guard prevents a
  // slow response from an earlier request from overwriting the modal.
  $effect(() => {
    const id = activeTeam?.id;
    const season = selectedSeason;
    teamData = null;
    errorMsg = "";

    if (!id) return;

    let cancelled = false;
    loading = true;

    getTeamInfo(id, season)
      .then((data) => {
        if (cancelled) return;
        teamData = data;
        seasonOptions = data.seasons?.length ? data.seasons : [season];
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Failed to load team data", err);
        errorMsg = err?.message || "Unable to load this team.";
      })
      .finally(() => {
        if (!cancelled) loading = false;
      });

    return () => {
      cancelled = true;
    };
  });

  // Player cards inside the modal navigate to their full pages. Close the
  // overlay without triggering the compatibility-route redirect.
  beforeNavigate(() => {
    teamModalTrigger.close();
  });

  function closeModal() {
    const returnTo = teamModalTrigger.returnTo;
    teamModalTrigger.close();
    if (returnTo) goto(returnTo, { replaceState: true });
  }

  function handleKeydown(e) {
    if (e.key === "Escape" && activeTeam) {
      e.preventDefault();
      closeModal();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if activeTeam}
  <div
    class="team-modal-backdrop"
    role="presentation"
    onclick={closeModal}
    transition:fade={{ duration: 150 }}
  ></div>
  <div
    class="team-modal"
    role="dialog"
    aria-modal="true"
    aria-label="{activeTeam.name} team details"
    transition:fly={{ y: 12, duration: 180 }}
  >
    <div class="team-modal-top">
      <div class="close-group">
        <kbd class="esc-kbd" title="Press esc to close">esc</kbd>
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <wa-button
          size="m"
          appearance="plain"
          onclick={closeModal}
          aria-label="Close team details"
        >
          <wa-icon name="xmark" label="Close"></wa-icon>
        </wa-button>
      </div>
    </div>

    <div class="team-modal-content">
      <div class="team-heading">
        <img src={logoUrl} alt="" class="team-heading-logo" />
        <div class="team-heading-text">
          <div class="wa-heading-l">{activeTeam.name}</div>
          {#if activeTeam.abbreviation}
            <wa-badge appearance="filled" size="s" variant="neutral">
              {activeTeam.abbreviation}
            </wa-badge>
          {/if}
        </div>

        {#if seasonOptions.length > 0}
          <div class="season-filter">
            <wa-select
              appearance="filled"
              size="s"
              value={selectedSeason}
              onchange={(e) => (selectedSeason = e.target.value)}
              style="width: 110px;"
              aria-label="Season"
            >
              {#each seasonOptions as season}
                <wa-option value={season}>{season}</wa-option>
              {/each}
            </wa-select>
          </div>
        {/if}
      </div>

      {#if loading}
        <div class="spinner-centering">
          <wa-spinner style="font-size: 3rem;"></wa-spinner>
        </div>
      {:else if errorMsg || !teamData}
        <div class="empty-state">
          <p>We couldn't find that team :(</p>
        </div>
      {:else}
        <div class="category-header">Record</div>
        <StatBoxTeamInfo
          teamLogo={logoUrl}
          teamName={teamData.name || activeTeam.name}
          teamId={teamData.id || activeTeam.id}
          record={teamData.record}
          division={teamData.division?.name || ""}
          divisionStandings={teamData.divisionStandings}
        />

        {#if roster.length > 0}
          <div class="category-header">
            Roster
            <span class="category-header-count">{roster.length}</span>
          </div>
          <RosterShowcase {roster} />
        {:else}
          <div class="category-header">Roster</div>
          <div class="empty-state">
            <p>No roster is available for this team right now.</p>
          </div>
        {/if}
      {/if}
    </div>
  </div>
{/if}

<style>
  .team-modal-backdrop {
    position: fixed;
    inset: 0;
    background: var(--wa-color-overlay-modal);
    z-index: 101;
  }

  .team-modal {
    position: fixed;
    left: 0;
    right: 0;
    margin: 0 auto;
    bottom: calc(max(1.5rem, env(safe-area-inset-bottom)) + 2.75rem + 0.75rem);
    height: min(80dvh, 42rem);
    max-height: calc(
      100dvh - max(1.5rem, env(safe-area-inset-bottom)) - 4.5rem
    );
    width: min(80dvw);
    z-index: 103;
    display: flex;
    flex-direction: column;
    background-color: var(--wa-color-surface-default);
    border: 1px solid var(--wa-color-border-quiet);
    border-radius: var(--wa-border-radius-l);
    padding-bottom: 2rem;
    box-shadow:
      0 0.75rem 2rem -0.5rem var(--wa-color-shadow),
      var(--wa-shadow-l);
    overflow: hidden;
  }

  .team-modal-top {
    display: flex;
    justify-content: flex-end;
    flex-shrink: 0;
    padding: 0.75rem 1rem 0 0;
  }

  .close-group {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-shrink: 0;
  }

  .esc-kbd {
    font-family: var(--font-mono, monospace);
    font-size: 0.75rem;
    border: 1px solid var(--wa-color-border-quiet);
    border-radius: 6px;
    padding: 0.05rem 0.4rem;
    opacity: 0.7;
    cursor: default;
    height: min-content;
    align-self: center;
    flex-shrink: 0;
  }

  .team-modal-content {
    display: flex;
    flex-direction: column;
    padding: 0 2rem;
    flex: 1;
    min-height: 0;
    overflow-y: auto;
  }

  .team-heading {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding-bottom: 1rem;
  }

  .team-heading-logo {
    width: 56px;
    height: 56px;
    padding: 0.5rem;
    border-radius: var(--wa-border-radius-m);
    background-color: var(--wa-color-gray-70);
    box-shadow: var(--wa-shadow-m);
    border: 1px solid var(--wa-color-border-quiet);
    object-fit: contain;
    box-sizing: border-box;
    flex-shrink: 0;
  }

  .team-heading-text {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    min-width: 0;
  }

  .season-filter {
    margin-left: auto;
    flex-shrink: 0;
  }

  .category-header {
    position: sticky;
    top: 0;
    z-index: 2;
    background-color: var(--wa-color-surface-default);
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.6rem 0 0.75rem;
    margin-top: 0.5rem;
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--wa-color-text-quiet);
    cursor: default;
  }

  .category-header::after {
    content: "";
    flex: 1;
    height: 1px;
    background: var(--wa-color-border-quiet);
  }

  .category-header-count {
    font-variant-numeric: tabular-nums;
    background-color: var(--wa-color-surface-lowered);
    color: var(--wa-color-text-quiet);
    border: 1px solid var(--wa-color-border-quiet);
    border-radius: 999px;
    padding: 0.06rem 0.5rem;
    font-size: 0.65rem;
    font-weight: 600;
    letter-spacing: 0;
    text-transform: none;
    flex-shrink: 0;
  }

  .spinner-centering {
    display: flex;
    width: 100%;
    flex: 1;
    justify-content: center;
    align-items: center;
  }

  .empty-state {
    padding: 2rem 1rem;
    text-align: center;
    border: 1px dashed var(--wa-color-border-quiet);
    border-radius: var(--wa-border-radius-m);
    color: var(--wa-color-neutral-on-quiet);
    margin: 1rem 0;
  }

  .empty-state p {
    margin: 0;
  }

  @media (max-width: 768px) {
    .esc-kbd {
      display: none;
    }
  }

  @media (max-width: 480px) {
    .team-modal {
      top: 4px;
      left: 4px;
      right: 4px;
      width: auto;
      bottom: calc(max(2rem, env(safe-area-inset-bottom)) + 2.75rem + 0.6rem);
      height: auto;
      max-height: none;
      border-radius: var(--wa-border-radius-l);
    }

    .team-modal-content {
      padding: 0 1rem;
    }
  }
</style>
