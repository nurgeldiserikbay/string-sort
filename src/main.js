import './styles.css'
import { GameApp } from './game/GameApp.js'
import { applyMonetizationLayout } from './game/MonetizationLayout.js'

applyMonetizationLayout()

const root = document.querySelector('#app')
const app = new GameApp(root)
app.mount()

window.addEventListener('beforeunload', () => app.destroy())
