import {defineStore} from 'pinia';
import {computed, ref, watch} from 'vue';
import { nanoid } from 'nanoid'
import {envStorageManager, type StoredEnv} from '@/storages/env-storage-manager'
import {replaceHighlightVariables} from "@/utils/variable-input.ts";
import {
    type HighlightInputParam,
    type HighlightVariableTypeParam,
    HighlightVariableTypeEnum,
} from "@/types/variable-input.ts";

type EnvVariable = {
    id?: string;
    name: string;
    value: string;
    isValidFormat: boolean;
}

type Env = {
    id?: string;
    name: string;
    code: string;
}

const useEnvStorage = defineStore('variables', () => {
    const definedEnvs = ref<Env[]>([
        { id: nanoid(), name: 'Default', code: 'default'},
    ])
    const isHydratingEnvs = ref(false) 

    const toStoredEnvs = (envs: Env[]): StoredEnv[] => {
        return envs.map((env) => ({
            id: env.id,
            name: env.name,
            code: env.code,
        }))
    }

    const fromStoredEnv = (env: StoredEnv): Env => {
        return {
            id: env.id ?? nanoid(),
            name: env.name,
            code: env.code,
        }
    }

    const persistDefinedEnvs = async (): Promise<void> => {
        if (isHydratingEnvs.value) return
        try {
            const dataToSave = toStoredEnvs(definedEnvs.value)
            await envStorageManager.saveEnvs(dataToSave)
        } catch (e) {
            console.error('[EnvStorage] Persist error:', e)
        }
    }

    const hydrateEnvsFromStorage = async () => {
        isHydratingEnvs.value = true
        try {
            const storedEnvs = await envStorageManager.loadEnvs()
            if (storedEnvs && storedEnvs.length > 0) {
                definedEnvs.value = storedEnvs.map(fromStoredEnv)
            }
        } catch (e) {
            console.error('[EnvStorage] Hydration error:', e)
        } finally {
            // Đảm bảo set false sau khi gán value để không bị watch chặn hoặc gây loop
            isHydratingEnvs.value = false
        }
    }

    const addDefinedEnv = (env: Env): void => {
        env.id = nanoid();
        definedEnvs.value.push(env)
        void persistDefinedEnvs()
    }

    // Biến môi trường mẫu
    const definedEnvVariables = ref<EnvVariable[]>([
        { id: nanoid(), name: '{{v1}}', value: 'Value 1', isValidFormat: true},
        { id: nanoid(), name: '{{v11}}', value: 'Value 11', isValidFormat: true},
        { id: nanoid(), name: '{{v2}}', value: 'Value 2', isValidFormat: true},
    ])

    const addDefinedEnvVariable = (envVariable: EnvVariable): void => {
        envVariable.id = nanoid();
        definedEnvVariables.value.push(envVariable)
    }

    const collectEnvVariableNames = () => {
        return computed(() =>
            definedEnvVariables.value
                .filter(variable => variable.isValidFormat)
                .map(variable => variable.name)
        ).value;
    };

    // Watch sâu để tự động lưu khi bất kỳ env nào thay đổi (tên, code...)
    watch(definedEnvs, () => {
        void persistDefinedEnvs()
    }, { deep: true })

    // Khởi tạo load dữ liệu ngay khi store được sử dụng
    void hydrateEnvsFromStorage()

    return {
        definedEnvs, addDefinedEnv,
        definedEnvVariables, addDefinedEnvVariable, collectEnvVariableNames,
        persistDefinedEnvs,
    };
});

const useInputStorage = defineStore('inputs', () => {
    const trackedHighlightInputs = ref<HTMLDivElement[]>([]);

    const highlightInput = ({inputIndex, options, withCursor = true}: HighlightInputParam) => {
        if (inputIndex === undefined || inputIndex === null) return;
        const trackedInput = trackedHighlightInputs.value[inputIndex];
        if (!trackedInput) return;

        const highlightVariableTypes: HighlightVariableTypeParam[] = [];
        if (trackedInput.dataset.enabledEnvVariable) {
            highlightVariableTypes.push({
                type: HighlightVariableTypeEnum.EnvVariable,
                definedVariableCssClass: "defined-env-variable",
                undefinedEnvVariableCssClass: "undefined-env-variable",
            });
        }
        if (trackedInput.dataset.enabledUriParam) {
            highlightVariableTypes.push({
                type: HighlightVariableTypeEnum.UriParam,
                definedVariableCssClass: "defined-uri-param",
            });
        }

        replaceHighlightVariables({
            target: trackedInput,
            variables: highlightVariableTypes,
            options: options,
            withCursor: withCursor,
        });
    }

    const rescanHighlightAllInputs = (exceptInputIndex?: number|null, options ?: any) => {
        trackedHighlightInputs.value.forEach((trackedInput: HTMLDivElement, index : number) => {
            if (index === exceptInputIndex) return;
            highlightInput({
                inputIndex: index,
                options: options,
                withCursor: false
            });
        });
    }

    return { trackedHighlightInputs, rescanHighlightAllInputs, highlightInput };
});

export { useEnvStorage, useInputStorage };
