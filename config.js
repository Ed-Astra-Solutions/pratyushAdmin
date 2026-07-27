/**
 * Where the console talks to.
 *
 * Committed rather than generated at deploy time: this repo is served
 * straight from the branch by GitHub Pages, with no build step. Neither
 * value is a secret — the API's own password check is the gate.
 *
 * Change these if the backend moves.
 */
window.PL_ADMIN_CONFIG = {
  apiBase: 'https://api.pratyushfitness.edastra.in',
  siteUrl: 'https://pratyushfitness.edastra.in',
};
