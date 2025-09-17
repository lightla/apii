import {defineStore} from 'pinia';
import {ref} from 'vue';
import {nanoid} from 'nanoid'

type ManagerLayout = {
    id: string;
    code: string;
    name: string;
}

export const useManagerLayoutStorage = defineStore('current-request', () => {
    /*******************
     * Current Request
     *******************/

    const definedManagerLayouts = ref<ManagerLayout[]>([
        { id: nanoid(), code: 'list', name: 'List'},
        { id: nanoid(), code: 'collection', name: 'Collection'},
        { id: nanoid(), code: 'flow', name: 'Flow'},
    ])

    return {
        definedManagerLayouts: definedManagerLayouts,
    };
});