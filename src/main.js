import './styles.css'
import { GameApp } from './game/GameApp.js'

const root = document.querySelector('#app')
const app = new GameApp(root)
app.mount()

window.addEventListener('beforeunload', () => app.destroy())
