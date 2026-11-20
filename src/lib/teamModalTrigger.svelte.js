/**
 * Global bridge for team detail modals.
 *
 * The modal itself lives near the navbar (next to the universal search modal),
 * so any team card can open it by calling `teamModalTrigger.open(team)`.
 */
class TeamModalTrigger {
  /** The team whose modal should be shown. `null` means closed. */
  team = $state(null);

  /** Optional destination used by compatibility team routes on close. */
  returnTo = $state(null);

  open(team, options = {}) {
    if (!team?.id) return;

    this.team = {
      id: team.id,
      name: team.name || team.teamName || team.clubName || "Team",
      abbreviation: team.abbreviation || "",
      logo: team.logo || "",
    };
    this.returnTo = options.returnTo ?? null;
  }

  close() {
    this.team = null;
    this.returnTo = null;
  }
}

export const teamModalTrigger = new TeamModalTrigger();
