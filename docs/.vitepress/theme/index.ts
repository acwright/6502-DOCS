import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import './style.css'
import ColourChart from './ColourChart.vue'
import Diagram from './Diagram.vue'
import Figure from './Figure.vue'
import PlaceholderImage from './PlaceholderImage.vue'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('ColourChart', ColourChart)
    app.component('Diagram', Diagram)
    app.component('Figure', Figure)
    app.component('PlaceholderImage', PlaceholderImage)
  }
} satisfies Theme
