<script setup lang="ts">
// The TMS9918's sixteen text-mode colors — `data/hardware.json`'s `colors`
// field, extracted in `scripts/extract-facts.mjs` from the same names
// `6502.inc` gives assembly programs, with the RGB the emulator renders each
// one as. See ACCURACY.md A45 for how that was checked.
import { data as facts } from '../data/facts.data.mts'

defineProps<{
  /** Show the `TMS_*` constant column, for assembly readers. */
  constants?: boolean
}>()

const colors = facts.hardware.colors.entries
</script>

<template>
  <table class="color-chart">
    <thead>
      <tr>
        <th>#</th>
        <th></th>
        <th>Name</th>
        <th v-if="constants">Constant</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="c in colors" :key="c.index">
        <td class="color-chart-index"><code>{{ c.index }}</code></td>
        <td><span class="color-swatch" :style="{ backgroundColor: c.hex }" /></td>
        <td>{{ c.name }}</td>
        <td v-if="constants"><code>{{ c.symbol }}</code></td>
      </tr>
    </tbody>
  </table>
  <p class="color-chart-note">
    0 and 1 look the same — <code>TRANSPARENT</code> has nothing behind it on a
    VGA monitor, so it comes out black too.
  </p>
</template>
