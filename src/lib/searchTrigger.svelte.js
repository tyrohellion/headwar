/**
 * Small bridge that lets any component ask for the universal search to open.
 *
 * The navbar owns the search UI (input + results modal), so it listens for
 * requests and does the actual opening. Everything else just calls
 * `searchTrigger.open()`.
 */
class SearchTrigger {
  /** Bumped every time someone asks for the search to open. */
  requestId = $state(0);

  open() {
    this.requestId += 1;
  }
}

export const searchTrigger = new SearchTrigger();
