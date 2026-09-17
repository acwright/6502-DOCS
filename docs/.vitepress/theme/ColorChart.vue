<script setup lang="ts">
// The sixteen text-mode colors: row 0 of the 6502-PICOVDP's default palette,
// which puts the TMS9918's colors at their old numbers. `data/hardware.json`'s
// `colors` field, with the `TMS_*` names `6502-VDP.inc` gives assembly programs
// and the 12-bit RGB the card draws each one as.
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
    0 and 1 look the same — text mode draws color 0 as black. In a graphics
    layer, 0 is usually transparent instead.
  </p>
</template>
