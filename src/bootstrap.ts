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
import Toast from "vue-toastification";
import "vue-toastification/dist/index.css";
import CloseToast from "./app/Generals/CloseToast.vue";
import App from './App.vue'
import { createPinia } from 'pinia'
import installFontAwesome from './plugins/fontawesome'
import mdiVue from 'mdi-vue/v3'
// import * as mdijs from '@mdi/js'

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
    app.use(Toast, {
        transition: "Vue-Toastification__bounce",
        maxToasts: 20,
        newestOnTop: true,
        position: "bottom-right",
        timeout: 2000,
        closeOnClick: true,
        pauseOnFocusLoss: true,
        pauseOnHover: true,
        draggable: true,
        draggablePercent: 0.6,
        showCloseButtonOnHover: false,
        hideProgressBar: false,
        closeButton: CloseToast,
        icon: true,
        rtl: false,
        toastClassName: "custom-app-toast",
        bodyClassName: ["custom-app-toast-body"]
    })
    // app.use(mdiVue, {icons: mdijs})

    app.directive('click-outside', {
        mounted(el: any, binding) {
            el.clickOutsideEvent = (event: Event) => {
                // Kiểm tra xem click có nằm ngoài element và các con của nó không
                if (!(el === event.target || el.contains(event.target as Node))) {
                    binding.value(event);
                }
            };
            // Sử dụng setTimeout để tránh bắt sự kiện click hiện tại vừa mở dropdown
            setTimeout(() => {
                document.addEventListener('click', el.clickOutsideEvent);
            }, 0);
        },
        unmounted(el: any) {
            document.removeEventListener('click', el.clickOutsideEvent);
        },
    });

    installFontAwesome(app)
    app.mount(mountId)

    return app
}