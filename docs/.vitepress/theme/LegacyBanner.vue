<script setup lang="ts">
/**
 * The edition notice on every page of the frozen legacy docs.
 *
 * The link to the current docs is absolute on purpose: `withBase` would resolve
 * it back into `/v1/`, which is the one place it must not go.
 */
const CURRENT = 'https://acwright.github.io/6502-DOCS/'
</script>

<template>
  <div class="legacy-banner" role="note">
    <span class="legacy-banner-text">
      <strong>TMS9918A and BIOS 1.6</strong><span class="legacy-banner-long"> — for the COB,
      DEV, KIM, VCS, PicoCalc and ACEs still on the original video card</span><span
      class="legacy-banner-short"> edition</span>
    </span>
    <!--
      `target` is what makes this leave the v1 edition at all. The current docs
      are on the same origin as these, so VitePress's router treats the link as
      one of its own pages, calls preventDefault(), and client-side routes to
      `/6502-DOCS/` — an address this build has no page for, so the reader gets
      v1's 404 instead of the current guide. The router skips any link carrying
      a `target`, which restores a plain full-page navigation in the same tab.
      The same reasoning is why the edition menu's entry carries one.
    -->
    <a class="legacy-banner-link" target="_self" :href="CURRENT">Current docs →</a>
  </div>
</template>
