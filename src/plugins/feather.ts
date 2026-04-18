// @ts-ignore
import feather from 'feather-icons'

import type { App } from 'vue'

export default {
    install(app: App) {
        app.directive('feather', {
            mounted(el) {
                feather.replace({ class: 'feather' }) // optional: add default class
            },
            updated(el) {
                feather.replace()
            }
        })
    }
}
