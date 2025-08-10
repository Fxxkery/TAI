import App from './App.svelte'
if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js'))}
new App({ target: document.getElementById('app') })
