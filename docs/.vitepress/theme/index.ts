import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import './style.css'
import ColorChart from './ColorChart.vue'
import Diagram from './Diagram.vue'
import Emulator from './Emulator.vue'
import Figure from './Figure.vue'
import KIM from './KIM.vue'
import PlaceholderImage from './PlaceholderImage.vue'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('ColorChart', ColorChart)
    app.component('Diagram', Diagram)
    app.component('Emulator', Emulator)
    app.component('Figure', Figure)
    app.component('KIM', KIM)
    app.component('PlaceholderImage', PlaceholderImage)
  }
} satisfies Theme
