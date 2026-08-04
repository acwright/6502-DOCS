import { readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import { createCssVariablesTheme } from '@shikijs/core'
import { defineConfig } from 'vitepress'

// `aliases` earns its place on 6502asm: VitePress's snippet-import syntax reads
// the leading digits of `{6502asm}` as a line-highlight range and is left
// asking for a language called `asm`, so a snippet needs a name that starts
// with a letter.
function loadGrammar(name: string, aliases: string[] = []) {
  const path = fileURLToPath(new URL(`./languages/${name}.tmLanguage.json`, import.meta.url))
  return { ...JSON.parse(readFileSync(path, 'utf-8')), aliases }
}

export default defineConfig({
  title: 'ACE Documentation',
  description:
    "The user's and programmer's guide to the ACE — a whole 65C02 computer on one board.",
  lang: 'en-US',
  base: '/6502-DOCS/',
  cleanUrls: true,
  lastUpdated: true,

  // Branding migrated from 6502-ASSETS in Phase 2. Entries in `head` are emitted
  // verbatim, so they carry `base` by hand; `themeConfig.logo` does not.
  head: [
    ['link', { rel: 'icon', href: '/6502-DOCS/favicon.ico', sizes: '16x16' }],
    ['link', { rel: 'apple-touch-icon', href: '/6502-DOCS/images/mark.png' }],
    ['meta', { property: 'og:image', content: '/6502-DOCS/images/mark.png' }]
  ],

  // No landing page: `/` renders docs/index.md directly, using the default
  // doc layout (no `layout: home`), so the sidebar is visible from first paint.
  rewrites: {
    'index.md': 'index.md'
  },

  markdown: {
    // Greyscale-only code blocks: token colours come from CSS variables
    // defined in theme/style.css, not from a hard-coded colour theme.
    theme: createCssVariablesTheme({ name: 'greyscale', variablePrefix: '--shiki-' }),
    languages: [loadGrammar('basic'), loadGrammar('6502asm', ['ca65', 'asm'])]
  },

  themeConfig: {
    // Three wordmark variants shipped from ASSETS: `logo` is white glyphs on
    // transparent, `logo-bow` black glyphs on a white plate, `logo-wob` white on
    // a black plate. The plated `wob` reads as a cramped chip at nav height, so
    // each theme takes the variant whose plate matches its paper and disappears.
    logo: { light: '/images/logo-bow.png', dark: '/images/logo.png' },

    nav: [{ text: 'Guide', link: '/' }],

    sidebar: [
      {
        text: 'Introduction',
        collapsed: true,
        items: [
          { text: 'Welcome', link: '/' },
          { text: 'Your ACE', link: '/your-ace' }
        ]
      },
      {
        text: 'Getting Started',
        collapsed: true,
        items: [
          { text: 'Setting up', link: '/getting-started/setup' },
          { text: 'First power-on', link: '/getting-started/first-boot' },
          { text: 'Your first ten minutes', link: '/getting-started/first-ten-minutes' },
          { text: "When something's wrong", link: '/getting-started/troubleshooting' }
        ]
      },
      {
        text: 'Using Your ACE',
        collapsed: true,
        items: [
          { text: 'The keyboard', link: '/using/keyboard' },
          { text: 'Sound and video', link: '/using/sound-and-video' },
          { text: 'Storage', link: '/using/storage' },
          { text: 'Serial and a terminal', link: '/using/serial' },
          { text: 'The Monitor', link: '/using/monitor' },
          { text: 'The emulator', link: '/using/emulator' }
        ]
      },
      {
        text: 'Programming in BASIC',
        collapsed: true,
        items: [
          { text: 'Where to start', link: '/basic/' },
          { text: 'Typing it in', link: '/basic/typing-it-in' },
          { text: 'Numbers and variables', link: '/basic/numbers-and-variables' },
          { text: 'Showing things', link: '/basic/print' },
          { text: 'Asking questions', link: '/basic/input' },
          { text: 'Making decisions', link: '/basic/decisions' },
          { text: 'Going round again', link: '/basic/loops' },
          { text: 'Subroutines', link: '/basic/subroutines' },
          { text: 'Arrays', link: '/basic/arrays' },
          { text: 'Working with words', link: '/basic/strings' },
          { text: 'Lists in the program', link: '/basic/data' },
          { text: 'Your own functions', link: '/basic/functions' },
          { text: 'Sound and pictures', link: '/basic/sound-and-pictures' },
          { text: 'Sticks and keys', link: '/basic/controls' },
          { text: 'Saving your work', link: '/basic/files' },
          { text: 'Time and memory that lasts', link: '/basic/clock' },
          { text: 'Reaching the machine', link: '/basic/machine' },
          { text: 'When it goes wrong', link: '/basic/debugging' },
          { text: 'Programs worth typing', link: '/basic/projects' }
        ]
      },
      {
        text: 'BASIC Reference',
        collapsed: true,
        items: [
          { text: 'Every keyword', link: '/basic/reference' },
          { text: 'Every error message', link: '/basic/errors' },
          { text: 'What BASIC does with your memory', link: '/basic/inside' }
        ]
      },
      {
        text: 'Cross-Development',
        collapsed: true,
        items: [
          { text: 'Where to start', link: '/crossdev/' },
          { text: 'Why cross-develop', link: '/crossdev/why' },
          { text: 'Installing cc65', link: '/crossdev/cc65' },
          { text: 'The tool belt', link: '/crossdev/tools' },
          { text: 'Starting from a template', link: '/crossdev/templates' },
          { text: 'The Makefile', link: '/crossdev/makefile' },
          { text: 'The linker config', link: '/crossdev/linker' },
          { text: 'Build, run, repeat', link: '/crossdev/build-run-loop' },
          { text: 'Debugging', link: '/crossdev/debugging' },
          { text: 'Testing your program', link: '/crossdev/testing' },
          { text: 'Onto real hardware', link: '/crossdev/to-hardware' },
          { text: 'BASIC from your editor', link: '/crossdev/basic' },
          { text: 'Driving it from an agent', link: '/crossdev/agents' }
        ]
      },
      {
        text: 'Add-ons',
        collapsed: true,
        items: [{ text: 'The KIM keypad', link: '/addons/kim' }]
      },
      {
        text: 'The Rest of the Family',
        collapsed: true,
        items: [
          { text: 'Overview', link: '/family/' },
          { text: 'COB', link: '/family/cob' },
          { text: 'DEV', link: '/family/dev' },
          { text: 'VCS', link: '/family/vcs' }
        ]
      }
    ],

    socialLinks: [{ icon: 'github', link: 'https://github.com/acwright/6502-DOCS' }],

    search: {
      provider: 'local'
    },

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © AC6502'
    }
  }
})
