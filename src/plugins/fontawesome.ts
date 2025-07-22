import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faUser, faCoffee, faHome, faTrash, faTrashAlt, faPlus, fas } from '@fortawesome/free-solid-svg-icons'
import type {App} from "vue";

// Đăng ký các icon bạn muốn dùng
library.add(faUser, faCoffee, faHome, faTrash, faPlus, fas)

export default (app: App) => {
    app.component('FontAwesomeIcon', FontAwesomeIcon)
}
