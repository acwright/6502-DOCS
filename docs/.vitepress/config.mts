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

const BIOS_VERSION: string = JSON.parse(
  readFileSync(fileURLToPath(new URL('../../data/boot.json', import.meta.url)), 'utf-8')
).version.string

export default defineConfig({
  title: 'ACE Documentation',
  description:
    "The user's and programmer's guide to the ACE — a whole 65C02 computer on one board.",
  lang: 'en-US',
  base: '/6502-DOCS/',
  cleanUrls: true,
  lastUpdated: true,

  // Default to light regardless of the OS preference: the ACE itself is black
  // text on a white screen, and the site's first impression should match the
  // machine's. Still a real toggle — a reader who picks dark keeps it on their
  // next visit, via the usual `vitepress-theme-appearance` localStorage key.
  appearance: { initialValue: 'light' } as any,

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
    // Grayscale-only code blocks: token colors come from CSS variables
    // defined in theme/style.css, not from a hard-coded color theme.
    theme: createCssVariablesTheme({ name: 'grayscale', variablePrefix: '--shiki-' }),
    languages: [loadGrammar('basic'), loadGrammar('6502asm', ['ca65', 'asm'])],

    // The cards under `public/cards/` are standalone pages, not VitePress
    // routes. Their `.html` paths are not in VitePress's asset-extension list,
    // so the SPA router treats a card link as an inbound page link, calls
    // `preventDefault()`, and client-side routes to a page that does not exist
    // — the card never opens. The router skips any link carrying a `target`,
    // so marking these `_self` restores a plain full-page navigation in the
    // same tab, which is what the prose tells the reader to expect ("use your
    // browser's back button to come back").
    //
    // The attribute has to go on *after* VitePress's own link rule has run:
    // that rule is what prepends `base`, and it skips any link that already
    // carries a `target`. Setting the attribute first silently costs every
    // card link its `/6502-DOCS/` prefix — the same broken-link bug in a new
    // spot. So let it rewrite the href on the token, then add the attribute
    // and render the token again.
    config(md) {
      const isCardLink = (href: string) => /(?:^|\/)cards\/.+\.html(?:[#?]|$)/.test(href)
      const renderLink =
        md.renderer.rules.link_open ??
        ((tokens, idx, options, _env, self) => self.renderToken(tokens, idx, options))

      md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
        const href = tokens[idx].attrGet('href')
        const rendered = renderLink(tokens, idx, options, env, self)
        if (!href || !isCardLink(href)) return rendered

        tokens[idx].attrSet('target', '_self')
        return self.renderToken(tokens, idx, options)
      }
    }
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
          { text: 'Going around again', link: '/basic/loops' },
          { text: 'Subroutines', link: '/basic/subroutines' },
          { text: 'Arrays', link: '/basic/arrays' },
          { text: 'Working with words', link: '/basic/strings' },
          { text: 'Lists in the program', link: '/basic/data' },
          { text: 'Your own functions', link: '/basic/functions' },
          { text: 'Sound and video', link: '/basic/sound-and-video' },
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
        text: 'Programming in Assembly',
        collapsed: true,
        items: [
          { text: 'Where to start', link: '/assembly/' },
          { text: 'The 65C02', link: '/assembly/65c02' },
          { text: 'Registers and addressing', link: '/assembly/registers' },
          { text: 'The instruction set', link: '/assembly/instructions' },
          { text: 'The memory map', link: '/assembly/memory-map' },
          { text: 'The Kernal', link: '/assembly/kernal' },
          { text: 'Hello world', link: '/assembly/hello' },
          { text: 'Console in and out', link: '/assembly/console' },
          { text: 'The screen', link: '/assembly/video' },
          { text: 'The graphics modes', link: '/assembly/graphics' },
          { text: 'Sound', link: '/assembly/sound' },
          { text: 'The keyboard and the sticks', link: '/assembly/input' },
          { text: 'Files on the card', link: '/assembly/storage' },
          { text: 'The serial port', link: '/assembly/serial' },
          { text: 'The clock', link: '/assembly/clock' },
          { text: 'Interrupts', link: '/assembly/interrupts' },
          { text: "What's fitted", link: '/assembly/detection' },
          { text: 'Writing a cartridge', link: '/assembly/cartridges' },
          { text: 'BASIC and machine code', link: '/assembly/basic-interop' },
          { text: 'Banked RAM', link: '/assembly/banking' },
          { text: 'Idioms and speed', link: '/assembly/idioms' },
          { text: 'Worked projects', link: '/assembly/projects' }
        ]
      },
      {
        text: 'F18A Mode',
        collapsed: true,
        items: [
          { text: 'What F18A mode is', link: '/f18a/' },
          { text: 'Turning it on', link: '/f18a/unlocking' },
          { text: 'Colors', link: '/f18a/color' },
          { text: 'Sprites', link: '/f18a/sprites' },
          { text: 'Scrolling and layers', link: '/f18a/scrolling' },
          { text: 'The bitmap layer', link: '/f18a/bitmap' },
          { text: 'The GPU', link: '/f18a/gpu' },
          { text: 'Every register', link: '/f18a/registers' }
        ]
      },
      {
        text: 'Add-ons',
        collapsed: true,
        items: [{ text: 'The KIM keypad', link: '/addons/kim' }]
      },
      {
        text: 'Reference',
        collapsed: true,
        items: [
          { text: 'Printable cards', link: '/reference/' },
          { text: 'The character set', link: '/reference/character-set' },
          { text: 'Connectors', link: '/reference/connectors' },
          { text: 'The keyboard matrix', link: '/reference/keyboard-matrix' },
          { text: 'The keypad map', link: '/reference/keypad-map' },
          { text: 'Glossary', link: '/reference/glossary' }
        ]
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
      // Which firmware this manual describes is a fact about the machine, and
      // the one thing a reader with an older ROM needs in order to know why a
      // page and their screen disagree. Read from the fact base rather than
      // typed, so it cannot be the last place on the site still saying v1.4.
      message: `Written for BIOS ${BIOS_VERSION}. Released under the MIT License.`,
      copyright: 'Copyright © AC6502'
    }
  }
})
