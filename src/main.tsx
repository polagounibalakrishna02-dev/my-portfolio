import { createRoot } from 'react-dom/client'
import '@fontsource/anton/400.css'
import '@fontsource-variable/archivo/wdth.css'
import '@fontsource-variable/jetbrains-mono/index.css'
import './styles.css'
import App from './App'

if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
window.scrollTo(0, 0)

// No StrictMode: the GSAP timelines here are imperative and should mount exactly once.
createRoot(document.getElementById('root')!).render(<App />)
