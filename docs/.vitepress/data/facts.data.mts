// Build-time data loader for the fact base.
//
// Every table on this site is generated from `data/*.json`, which
// `scripts/extract-facts.mjs` writes from the BIOS source. Nothing is
// hand-copied, so no page can quietly fall out of step with the machine.
//
// In a page:
//
//   <script setup>
//   import { data as facts } from '../.vitepress/data/facts.data.mts'
//   </script>
//
//   <ul><li v-for="s in facts.kernal.slots">{{ s.address }} {{ s.name }}</li></ul>
//
// `watch` is a glob, so editing the fact base hot-reloads the dev server.

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { defineLoader } from 'vitepress'

const DATA = new URL('../../../data/', import.meta.url)

const FILES = [
  ['boot', 'boot.json'],
  ['kernal', 'kernal.json'],
  ['memoryMap', 'memory-map.json'],
  ['hardware', 'hardware.json'],
  ['basicKeywords', 'basic-keywords.json'],
  ['basicExamples', 'basic-examples.json'],
  ['monitorCommands', 'monitor-commands.json'],
  ['errors', 'errors.json'],
  ['systems', 'systems.json']
] as const

export declare const data: Facts

export interface Facts {
  boot: any
  kernal: any
  memoryMap: any
  hardware: any
  basicKeywords: any
  basicExamples: any
  monitorCommands: any
  errors: any
  systems: any
  /** BIOS release the whole fact base was extracted from, e.g. "1.5". */
  biosVersion: string
}

export default defineLoader({
  watch: ['../../data/*.json'],

  load(): Facts {
    const facts: Record<string, any> = {}

    for (const [key, file] of FILES) {
      facts[key] = JSON.parse(readFileSync(fileURLToPath(new URL(file, DATA)), 'utf-8'))
    }

    facts.biosVersion = facts.boot.version.string.slice(1)
    return facts as Facts
  }
})
