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
    <a class="legacy-banner-link" :href="CURRENT">Current docs →</a>
  </div>
</template>
