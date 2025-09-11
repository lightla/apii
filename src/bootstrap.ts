// src/bootstrap.ts
import { createApp } from 'vue'
import type { Plugin } from 'vue'
import { createVuestic } from "vuestic-ui";
import './assets/styles/preprocessed-app.css'
import './assets/styles/app.scss'
import "vuestic-ui/css";
import App from './App.vue'
import { createPinia } from 'pinia'
import installFontAwesome from './plugins/fontawesome'
import mdiVue from 'mdi-vue/v3'
import * as mdijs from '@mdi/js'
import Unicon from 'vue-unicons'

// @ts-ignore
import { uniLayerGroupMonochrome, uniCarWash, uniToggleOff } from 'vue-unicons/dist/icons'
import { appStyleManager } from "@/app-style-manager.ts";

Unicon.add([uniLayerGroupMonochrome, uniCarWash, uniToggleOff])

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
    app.use(Unicon as unknown as Plugin)

    installFontAwesome(app)
    app.mount(mountId)

    return app
}