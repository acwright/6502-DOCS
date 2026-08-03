import { readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import { createCssVariablesTheme } from '@shikijs/core'
import { defineConfig } from 'vitepress'

function loadGrammar(name: string) {
  const path = fileURLToPath(new URL(`./languages/${name}.tmLanguage.json`, import.meta.url))
  return JSON.parse(readFileSync(path, 'utf-8'))
}

export default defineConfig({
  title: 'AC6502 Documentation',
  description:
    "The user's and programmer's guide to the AC6502 family of homebrew computers.",
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
    languages: [loadGrammar('basic'), loadGrammar('6502asm')]
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
        items: [{ text: 'Welcome', link: '/' }]
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
