import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import './style.css'
import Diagram from './Diagram.vue'
import Figure from './Figure.vue'
import PlaceholderImage from './PlaceholderImage.vue'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('Diagram', Diagram)
    app.component('Figure', Figure)
    app.component('PlaceholderImage', PlaceholderImage)
  }
} satisfies Theme
