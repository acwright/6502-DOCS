<script setup lang="ts">
/**
 * A drawing from `docs/.vitepress/diagrams/`, inlined into the page.
 *
 * Inlined rather than linked as an `<img>` on purpose: the drawings carry no
 * color of their own — every shape is `currentColor` at some opacity — so
 * putting the markup in the page is what lets one file serve both the light and
 * the dark theme. An `<img>` would be a separate document and could not see the
 * site's variables.
 *
 * The files are written by the diagram builder; ask for one that does not exist
 * and the build stops rather than shipping a gap.
 */
const drawings = import.meta.glob('../diagrams/*.svg', {
  query: '?raw',
  import: 'default',
  eager: true
}) as Record<string, string>

const props = defineProps<{
  /** File name without the extension, e.g. "memory-map". */
  name: string
  /** What the picture shows. Shown under it. */
  caption?: string
}>()

const svg = drawings[`../diagrams/${props.name}.svg`]
if (!svg) {
  throw new Error(
    `<Diagram name="${props.name}"> — no such drawing. Have: ` +
      Object.keys(drawings)
        .map((path) => path.replace('../diagrams/', '').replace('.svg', ''))
        .join(', ')
  )
}
</script>

<template>
  <figure class="doc-figure">
    <div v-html="svg" />
    <figcaption v-if="caption">{{ caption }}</figcaption>
  </figure>
</template>
