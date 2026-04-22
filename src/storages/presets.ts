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
    type: 'form-data' | 'json' | 'binary';
    formData?: PresetItem[];
    json?: string;
    value?: string; // For generic value like binary info or JSON
}

const PRESETS_STORAGE_KEY = 'api_presets_v2';

export const usePresetStorage = defineStore('presets', () => {
    const saved = localStorage.getItem(PRESETS_STORAGE_KEY);
    const initialData = saved ? JSON.parse(saved) : {
        headers: [],
        query: [],
        body: []
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

    const addPreset = (preset: any) => {
        const id = 'preset-' + Math.random().toString(36).substr(2, 9);
        const newPreset = { ...preset, id };
        
        const c = preset.category;
        if (c === 'headers') headerPresets.value.push(newPreset);
        else if (c === 'query') queryPresets.value.push(newPreset);
        else if (c === 'body') bodyPresets.value.push(newPreset);
        
        persist();
    };

    const updatePreset = (id: string, data: any) => {
        const hIdx = headerPresets.value.findIndex(p => p.id === id);
        if (hIdx !== -1) headerPresets.value[hIdx] = { ...headerPresets.value[hIdx], ...data };
        
        const qIdx = queryPresets.value.findIndex(p => p.id === id);
        if (qIdx !== -1) queryPresets.value[qIdx] = { ...queryPresets.value[qIdx], ...data };

        const bIdx = bodyPresets.value.findIndex(p => p.id === id);
        if (bIdx !== -1) bodyPresets.value[bIdx] = { ...bodyPresets.value[bIdx], ...data };
        
        persist();
    };

    const deletePreset = (id: string) => {
        headerPresets.value = headerPresets.value.filter(p => p.id !== id);
        queryPresets.value = queryPresets.value.filter(p => p.id !== id);
        bodyPresets.value = bodyPresets.value.filter(p => p.id !== id);
        persist();
    };

    const getPresetsByCategory = (category: 'headers' | 'query' | 'body') => {
        if (category === 'headers') return headerPresets.value;
        if (category === 'query') return queryPresets.value;
        return bodyPresets.value;
    };
    
    return { 
        headerPresets, 
        queryPresets, 
        bodyPresets,
        addPreset,
        updatePreset,
        deletePreset,
        getPresetsByCategory
    };
});
