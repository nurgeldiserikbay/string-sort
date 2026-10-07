import './styles.css'
import './ui/mainMenu.css'
import './ui/secondaryScreens.css'
import './ui/gameplayScreen.css'
import { GameApp } from './game/GameApp.js'
import { applyMonetizationLayout } from './game/MonetizationLayout.js'

applyMonetizationLayout()

const root = document.querySelector('#app')
const app = new GameApp(root)
app.mount()

window.addEventListener('beforeunload', () => app.destroy())
