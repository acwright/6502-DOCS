<script setup lang="ts">
defineProps<{
  /** Short title shown in the frame, e.g. "ACE board, front". */
  label: string
  /** What the real image will show and how it should be framed. */
  caption: string
}>()
</script>

<template>
  <div class="placeholder-image">
    <div class="placeholder-label">{{ label }}</div>
    <div class="placeholder-caption">{{ caption }}</div>
  </div>
</template>
