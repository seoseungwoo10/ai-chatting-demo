import Vue from 'vue'
import App from './App.vue'
import './styles/tailwind.css'
import 'highlight.js/styles/github.css'

Vue.config.productionTip = false

new Vue({
  render: h => h(App),
}).$mount('#app')
