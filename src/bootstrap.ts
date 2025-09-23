// src/bootstrap.ts
import { createApp } from 'vue'
import type { Plugin } from 'vue'
import { createVuestic } from "vuestic-ui";
import './assets/styles/preprocessed-app.css'
import './assets/styles/app.scss'
import "@milkdown/crepe/theme/common/style.css";
import "@milkdown/crepe/theme/frame.css";
import "@milkdown/crepe/theme/nord.css";

// "./theme/common/*": "./lib/theme/common/*",
//     "./theme/classic.css": "./lib/theme/classic/style.css",
//     "./theme/classic-dark.css": "./lib/theme/classic-dark/style.css",
//     "./theme/nord.css": "./lib/theme/nord/style.css",
//     "./theme/nord-dark.css": "./lib/theme/nord-dark/style.css",
//     "./theme/frame.css": "./lib/theme/frame/style.css",
//     "./theme/frame-dark.css": "./lib/theme/frame-dark/style.css"
import "vuestic-ui/css";
import App from './App.vue'
import { createPinia } from 'pinia'
import installFontAwesome from './plugins/fontawesome'
import mdiVue from 'mdi-vue/v3'
import * as mdijs from '@mdi/js'

// @ts-ignore
import { appStyleManager } from "@/app-style-manager.ts";


export function createVueApp(options: {
    requestsData?: any[],
    saveUrl?: string,
    mountId?: string
} = {}) {
    const { requestsData = [], saveUrl = '', mountId = '#app' } = options

    const app = createApp(App, {
        requestsData,
        saveUrl,
    })

    appStyleManager.loadStyles(mountId);

    app.use(createPinia())
    app.use(createVuestic())
    app.use(mdiVue, {icons: mdijs})

    installFontAwesome(app)
    app.mount(mountId)

    return app
}