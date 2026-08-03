import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import './style.css'
import PlaceholderImage from './PlaceholderImage.vue'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('PlaceholderImage', PlaceholderImage)
  }
} satisfies Theme
