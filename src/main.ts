import {
    createApp,
    h,
} from "vue"

import App from "./components/App.vue"
import "./style.css"

const app = createApp({
    render: () => h(App)
})

app.mount("#app")
