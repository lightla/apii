import { defineStore } from 'pinia';
import { ref } from 'vue';
import { saveFile as dbSaveFile, deleteFile as dbDeleteFile } from './file-db';

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

export interface FilePreset {
    id: string;
    name: string;
    fileName: string;
    fileSize: string;
    mimeType: string;
}

const PRESETS_STORAGE_KEY = 'api_presets_v2';

export const usePresetStorage = defineStore('presets', () => {
    const saved = localStorage.getItem(PRESETS_STORAGE_KEY);
    const initialData = saved ? JSON.parse(saved) : {
        headers: [],
        query: [],
        body: [],
        file: []
    };

    const headerPresets = ref<HeaderPreset[]>(initialData.headers || []);
    const queryPresets = ref<QueryPreset[]>(initialData.query || []);
    const bodyPresets = ref<BodyPreset[]>(initialData.body || []);
    const filePresets = ref<FilePreset[]>(initialData.file || []);

    const persist = () => {
        localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify({
            headers: headerPresets.value,
            query: queryPresets.value,
            body: bodyPresets.value,
            file: filePresets.value
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

    const addFilePreset = async (preset: Omit<FilePreset, 'id'>, blob: Blob) => {
        const id = 'preset-' + Math.random().toString(36).substr(2, 9);
        const filePreset: FilePreset = { ...preset, id };
        filePresets.value.push(filePreset);
        await dbSaveFile(id, blob);
        persist();
        return id;
    };

    const updatePreset = (id: string, data: any) => {
        const hIdx = headerPresets.value.findIndex(p => p.id === id);
        if (hIdx !== -1) headerPresets.value[hIdx] = { ...headerPresets.value[hIdx], ...data };

        const qIdx = queryPresets.value.findIndex(p => p.id === id);
        if (qIdx !== -1) queryPresets.value[qIdx] = { ...queryPresets.value[qIdx], ...data };

        const bIdx = bodyPresets.value.findIndex(p => p.id === id);
        if (bIdx !== -1) bodyPresets.value[bIdx] = { ...bodyPresets.value[bIdx], ...data };

        const fIdx = filePresets.value.findIndex(p => p.id === id);
        if (fIdx !== -1) filePresets.value[fIdx] = { ...filePresets.value[fIdx], ...data };

        persist();
    };

    const deletePreset = (id: string) => {
        headerPresets.value = headerPresets.value.filter(p => p.id !== id);
        queryPresets.value = queryPresets.value.filter(p => p.id !== id);
        bodyPresets.value = bodyPresets.value.filter(p => p.id !== id);
        persist();
    };

    const deleteFilePreset = async (id: string) => {
        filePresets.value = filePresets.value.filter(p => p.id !== id);
        await dbDeleteFile(id);
        persist();
    };

    const getPresetsByCategory = (category: 'headers' | 'query' | 'body' | 'file') => {
        if (category === 'headers') return headerPresets.value;
        if (category === 'query') return queryPresets.value;
        if (category === 'file') return filePresets.value;
        return bodyPresets.value;
    };

    return {
        headerPresets,
        queryPresets,
        bodyPresets,
        filePresets,
        addPreset,
        addFilePreset,
        updatePreset,
        deletePreset,
        deleteFilePreset,
        getPresetsByCategory
    };
});