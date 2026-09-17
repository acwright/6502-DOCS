<script setup lang="ts">
import { computed, ref } from 'vue'
import { data as facts } from '../data/facts.data.mts'

/**
 * A machine on the page.
 *
 * The emulator's web build ships a second entry point sized for a frame, and it
 * is served from the same origin as this site, so a chapter can offer a real
 * ACE next to the listing it is describing at the cost of one `<iframe>`.
 *
 * Three things are worth knowing about how this one is wired.
 *
 * **The program travels in the URL.** `prg64` carries the bytes themselves,
 * built by `scripts/build-embeds.mjs` from the same file under `samples/` that
 * the chapter displays and the harness runs. Nothing is fetched, so the snippet
 * is self-contained on the dev server as well as the deployed site — and, more
 * to the point, the program that runs cannot be a different program from the one
 * printed above it.
 *
 * **The card is always named.** Every frame asks for `vdp=picovdp`, the
 * card this edition documents, which boots BIOS 2.0. The frame's default is
 * the TMS9918A with BIOS 1.6, it is due to change, and the frame never reads
 * the card a reader chose in the full app, so a frame that left it out would
 * boot whatever the emulator's default is that year.
 *
 * **Nothing loads until the reader asks.** The frame enters the DOM on the
 * click and not before, so it is absent from the built HTML, costs no request
 * on a page nobody scrolls to the bottom of, and does not put four emulating
 * CPUs on a laptop that only wanted to read.
 *
 * **There is no `persist` prop, on purpose.** Persistence is one IndexedDB
 * record per origin, and this site shares its origin with the full web
 * emulator: an embed that saved its own small card would become what a reader's
 * app restores. The parameter is not accepted rather than defaulted off.
 */
const props = withDefaults(
  defineProps<{
    /**
     * A program from `data/embeds.json`, e.g. "basic/times-table". Omit for an
     * empty machine — which is what the chapters about booting and typing
     * want, since there the machine itself is the subject.
     */
    sample?: string
    /**
     * Whether to type `RUN` once BASIC is up. Defaults to true when there is a
     * program to run. `:run="false"` loads the program and stops, for the one
     * chapter whose exercise is starting it yourself and then stopping it.
     */
    run?: boolean
    /** Typed into the machine once it has booted, instead of `RUN`. */
    type?: string
    /** Start unmuted, for the chapters where the sound is the point. */
    sound?: boolean
    /** The frame's own control bar. */
    controls?: 'full' | 'minimal' | 'none'
    /** CPU clock in MHz. The ACE ships at 1. */
    freq?: 1 | 2
    /** What the panel says before it is started. */
    label?: string
    /** Shown under the machine. Describes the machine, never the mechanism. */
    caption?: string
  }>(),
  { run: true, controls: 'minimal', freq: 1, sound: false }
)

const started = ref(false)

const program = computed(() => {
  if (!props.sample) return null
  const found = (facts.embeds.programs as Record<string, { prg64: string }>)[props.sample]
  if (!found) {
    throw new Error(
      `<Emulator sample="${props.sample}"> — no such program. Add it to scripts/build-embeds.mjs. Have: ` +
        Object.keys(facts.embeds.programs).join(', ')
    )
  }
  return found
})

const src = computed(() => {
  const params = new URLSearchParams()

  params.set('vdp', facts.emulator.card)
  if (program.value) params.set('prg64', program.value.prg64)

  // The frame boots as it mounts, and it only mounts on the click. Holding it
  // at `autostart=0` as well would cost the reader a second click — one here to
  // fetch the machine, one inside it to start the machine — for a saving the
  // click-to-load already made. `autotype` waits for BASIC either way.
  const typed = props.type ?? (program.value && props.run ? 'RUN\r' : '')
  if (typed) params.set('autotype', typed)

  if (props.controls !== 'minimal') params.set('controls', props.controls)
  if (props.freq !== 1) params.set('freq', String(props.freq))
  // Browsers block autoplay in a frame regardless, so this is not a promise of
  // noise — it is the difference between the reader's first click in the frame
  // producing sound and the reader having to find the mute button first.
  if (props.sound) params.set('muted', '0')

  // The frame takes commands from any origin unless told otherwise. Nothing on
  // this site sends it any, so only this page's own origin may. Read at click
  // time rather than baked in, so the dev server's frames answer to the dev
  // server the way the deployed site's answer to the deployed site.
  if (typeof window !== 'undefined') params.set('origins', window.location.origin)

  return `${facts.emulator.web.frame}?${params}`
})

// The full app remembers the card its reader last chose, and a `vdp=` in its
// address overrides that for the visit — so the way out of a frame opens the
// same machine the frame was showing.
const appHref = `${facts.emulator.web.app}?vdp=${facts.emulator.card}`

function start() {
  started.value = true
}

const label = computed(
  () => props.label ?? (program.value ? 'Run this program' : 'Start the machine')
)
</script>

<template>
  <figure
    class="doc-emulator"
    :style="{ '--frame-aspect': `${facts.emulator.frame.width} / ${facts.emulator.frame.height}` }"
  >
    <div class="doc-emulator-frame">
      <iframe
        v-if="started"
        :src="src"
        :title="caption ?? label"
        :allow="facts.emulator.frame.allow"
        loading="lazy"
      />
      <button v-else type="button" class="doc-emulator-start" @click="start">
        <span class="doc-emulator-label">{{ label }}</span>
        <span class="doc-emulator-note">Runs here, in this page</span>
      </button>
    </div>

    <figcaption>
      <span v-if="caption">{{ caption }}</span>
      <a class="doc-emulator-out" :href="appHref" target="_blank" rel="noreferrer">
        Open the full emulator
      </a>
    </figcaption>
  </figure>
</template>
