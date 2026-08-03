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
    logo: undefined,
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
