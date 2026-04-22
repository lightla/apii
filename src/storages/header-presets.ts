import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface HeaderPresetItem {
    key: string;
    value: string;
    description: string;
}

export interface HeaderPreset {
    id: string;
    name: string;
    headers: HeaderPresetItem[];
}

const PRESETS_STORAGE_KEY = 'api_header_presets';

export const useHeaderPresetStorage = defineStore('headerPresets', () => {
    const savedPresets = localStorage.getItem(PRESETS_STORAGE_KEY);
    const initialPresets = savedPresets ? JSON.parse(savedPresets) : [
        {
            id: 'preset-bearer-auth',
            name: 'Auth: Bearer Token',
            headers: [
                {
                    key: 'Authorization',
                    value: 'Bearer {{auth}}',
                    description: 'From Preset'
                }
            ]
        }
    ];

    // Migration: Replace old long descriptions
    initialPresets.forEach((p: any) => {
        p.headers.forEach((h: any) => {
            if (h.description === 'Authorization header with Bearer token') {
                h.description = 'From Preset';
            }
        });
    });
    
    localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(initialPresets));

    const presets = ref<HeaderPreset[]>(initialPresets);

    const persist = () => {
        localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(presets.value));
    };

    const addPreset = (name: string, headers: HeaderPresetItem[]) => {
        const id = Math.random().toString(36).substr(2, 9);
        presets.value.push({ id, name, headers });
        persist();
    };

    const updatePreset = (id: string, name: string, headers: HeaderPresetItem[]) => {
        const index = presets.value.findIndex(p => p.id === id);
        if (index !== -1) {
            presets.value[index] = { id, name, headers };
            persist();
        }
    };

    const deletePreset = (id: string) => {
        presets.value = presets.value.filter(p => p.id !== id);
        persist();
    };

    const findPreset = (id: string) => {
        return presets.value.find(p => p.id === id);
    };

    return { presets, addPreset, updatePreset, deletePreset, findPreset };
});
