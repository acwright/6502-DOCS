<script setup lang="ts">
import { computed, ref } from 'vue'
import { data as facts } from '../data/facts.data.mts'

/**
 * A KIM on the page.
 *
 * The sibling of `Emulator.vue`, and deliberately not a mode of it. The KIM
 * runs different firmware on a different board, so it has its own emulator, its
 * own embed contract and its own `postMessage` prefix — and a single component
 * taking a `machine` prop would let a KIM page reach for `prg64`, get silence,
 * and look like a bug in the listing rather than a parameter that was never
 * going to work.
 *
 * Two things carry over from the ACE component, for the same reasons:
 *
 * **Nothing loads until the reader asks.** The frame enters the DOM on the
 * click and not before, so it costs no request on a page nobody scrolled to the
 * bottom of.
 *
 * **No program travels in the URL.** The ACE component ships the printed
 * listing as `prg64` so a **Run this** button cannot run something else. Here
 * there is nothing to keep honest: keying the bytes in *is* the exercise, and a
 * machine that arrived with the program already in it would be answering the
 * question the chapter is asking.
 */
const props = withDefaults(
  defineProps<{
    /**
     * Keys pressed on the pad once the machine is up, in the pad's own legends.
     * Defaults to the ESC the splash waits for — a frame that does not send it
     * shows `--ESC TO START--` and nothing else, which is the hardware rather
     * than a quirk of the frame.
     */
    keys?: string
    /** What is wired to the bay at `$9400`. `led-latch`, or nothing. */
    accessory?: 'led-latch'
    /** The frame's own control bar. */
    controls?: 'full' | 'minimal' | 'none'
    /** What the panel says before it is started. */
    label?: string
    /** Shown under the machine. Describes the machine, never the mechanism. */
    caption?: string
  }>(),
  { keys: facts.kimulator.splash.keys, controls: 'minimal' }
)

/**
 * There is no `panels` prop, because there is no raster to double here — a KIM
 * is four panels beside each other, and the frame's proportions follow which of
 * them are shown. A caller that could drop the terminal but not reshape the box
 * would get a machine with a hole beside it. The shape the stylesheet is given
 * is the contract's figure for all four.
 */
const started = ref(false)

const src = computed(() => {
  const params = new URLSearchParams()

  if (props.accessory) params.set('accessory', props.accessory)
  if (props.keys) params.set('keys', props.keys)
  if (props.controls !== 'minimal') params.set('controls', props.controls)

  // Nothing here drives the frame, so this is not load-bearing — it is the
  // narrower default, and costs a parameter. Read at click time rather than
  // baked in, so the dev server frames its machine the way the deployed site
  // frames its own.
  if (typeof window !== 'undefined') params.set('origins', window.location.origin)

  return `${facts.kimulator.web.frame}?${params}`
})

const label = computed(() => props.label ?? 'Start the KIM')
</script>

<template>
  <figure
    class="doc-emulator"
    :style="{ '--frame-aspect': `${facts.kimulator.frame.width} / ${facts.kimulator.frame.height}` }"
  >
    <div class="doc-emulator-frame">
      <iframe
        v-if="started"
        :src="src"
        :title="caption ?? label"
        :allow="facts.kimulator.frame.allow"
        loading="lazy"
      />
      <button v-else type="button" class="doc-emulator-start" @click="started = true">
        <span class="doc-emulator-label">{{ label }}</span>
        <span class="doc-emulator-note">Runs here, in this page</span>
      </button>
    </div>

    <figcaption>
      <span v-if="caption">{{ caption }}</span>
      <a class="doc-emulator-out" :href="facts.kimulator.web.app" target="_blank" rel="noreferrer">
        Open the full KIMulator
      </a>
    </figcaption>
  </figure>
</template>
