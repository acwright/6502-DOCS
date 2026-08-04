<script setup lang="ts">
import { withBase } from 'vitepress'

/**
 * A photograph or a screenshot, with a caption.
 *
 * `screen` marks a picture that came off the video card: 320×192 hard pixels,
 * which the browser must not smooth on the way up.
 */
const props = defineProps<{
  /** Path under `docs/public`, e.g. "/images/photos/ace.jpg". */
  src: string
  /** What is in the picture, for a reader who cannot see it. */
  alt: string
  /** What the picture shows. Shown under it. */
  caption?: string
  /** True for an emulator screenshot. */
  screen?: boolean
}>()
</script>

<template>
  <figure class="doc-figure" :class="{ 'is-screen': screen }">
    <img :src="withBase(src)" :alt="alt" loading="lazy" decoding="async" />
    <figcaption v-if="caption">{{ caption }}</figcaption>
  </figure>
</template>
