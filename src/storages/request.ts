import {defineStore} from 'pinia';
import {ref} from 'vue';
import {nanoid} from 'nanoid'

type Request = {
    id?: string;
    uri: string;
    httpMethod: string
}

export const useRequestStorage = defineStore('current-request', () => {
    /*******************
     * Current Request
     *******************/

    const currentRequest = ref<Request>( {
        id: nanoid(),
        uri: 'No Environment',
        httpMethod: 'post'
    })

    return {
        currentRequest,
    };
});