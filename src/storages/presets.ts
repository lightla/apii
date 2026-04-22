import { defineStore } from 'pinia';
import { ref } from 'vue';

export interface PresetItem {
    key: string;
    value: string;
    description: string;
}

export interface HeaderPreset {
    id: string;
    name: string;
    items: PresetItem[];
}

export interface QueryPreset {
    id: string;
    name: string;
    items: PresetItem[];
}

export interface BodyPreset {
    id: string;
    name: string;
    type: 'form-data' | 'json';
    formData?: PresetItem[];
    json?: string;
}

const PRESETS_STORAGE_KEY = 'api_presets_v2';

export const usePresetStorage = defineStore('presets', () => {
    const saved = localStorage.getItem(PRESETS_STORAGE_KEY);
    const initialData = saved ? JSON.parse(saved) : {
        headers: [
            {
                id: 'preset-bearer-auth',
                name: 'Auth: Bearer Token',
                items: [{ key: 'Authorization', value: 'Bearer {{auth}}', description: 'From Preset' }]
            }
        ],
        query: [
            {
                id: 'preset-pagination',
                name: 'Pagination',
                items: [
                    { key: 'page', value: '1', description: 'Page number' },
                    { key: 'limit', value: '10', description: 'Items per page' }
                ]
            }
        ],
        body: [
            {
                id: 'preset-json-example',
                name: 'Example JSON',
                type: 'json',
                json: '{\n  "title": "{{title}}",\n  "content": "Hello World"\n}'
            },
            {
                id: 'preset-form-example',
                name: 'Example Form',
                type: 'form-data',
                formData: [
                    { key: 'id', value: '{{id}}', description: '' }
                ]
            }
        ]
    };

    const headerPresets = ref<HeaderPreset[]>(initialData.headers || []);
    const queryPresets = ref<QueryPreset[]>(initialData.query || []);
    const bodyPresets = ref<BodyPreset[]>(initialData.body || []);

    const persist = () => {
        localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify({
            headers: headerPresets.value,
            query: queryPresets.value,
            body: bodyPresets.value
        }));
    };

    // Generic CRUD helpers could be here, but let's keep it simple for now and expose the refs.
    // They can be modified directly followed by persist().
    
    return { 
        headerPresets, 
        queryPresets, 
        bodyPresets, 
        persist 
    };
});
