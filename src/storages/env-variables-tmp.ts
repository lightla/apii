import {defineStore} from 'pinia';
import {computed, ref, watch} from 'vue';
import { nanoid } from 'nanoid'
import {envStorageManager} from '@/storages/env-storage-manager'
import {replaceHighlightVariables} from "@/utils/variable-input.ts";
import {
    type HighlightInputParam,
    type HighlightVariableTypeParam,
    HighlightVariableTypeEnum,
} from "@/types/variable-input.ts";

type Env = {
    id?: string;
    name: string;
    code: string;
}

type VariableDefinition = {
    id: string;
    name: string;
}

type EnvValuesMap = Record<string, Record<string, string>>;

const useEnvStorage = defineStore('variables', () => {
    // 1. Môi trường
    const definedEnvs = ref<Env[]>([
        { id: nanoid(), name: 'Default', code: 'default'},
    ])
    const selectedEnvCode = ref('default')
    const isHydrating = ref(true)

    // 2. Định nghĩa biến (Cố định)
    const variableDefinitions = ref<VariableDefinition[]>([
        { id: nanoid(), name: '{{v1}}' },
    ])

    // 3. Giá trị của biến theo môi trường
    const envValues = ref<EnvValuesMap>({
        'default': {}
    })

    const hydrate = async () => {
        isHydrating.value = true
        try {
            const data = await envStorageManager.loadEnvs()
            if (data && typeof data === 'object' && data.definedEnvs) {
                definedEnvs.value = data.definedEnvs
                variableDefinitions.value = data.variableDefinitions || []
                envValues.value = data.envValues || { 'default': {} }
                selectedEnvCode.value = data.selectedEnvCode || 'default'
            } else {
                // Nếu chưa có dữ liệu, khởi tạo Default cho envValues
                if (!envValues.value['default']) {
                  envValues.value['default'] = {}
                }
            }
        } catch (e) {
            console.error('[EnvStorage] Hydrate failed:', e)
        } finally {
            setTimeout(() => { isHydrating.value = false }, 50)
        }
    }

    const persist = async () => {
        if (isHydrating.value) return
        const dataToSave = {
            definedEnvs: definedEnvs.value,
            variableDefinitions: variableDefinitions.value,
            envValues: envValues.value,
            selectedEnvCode: selectedEnvCode.value
        }
        await envStorageManager.saveEnvs(dataToSave)
    }

    const addDefinedEnv = (env: Env) => {
        env.id = nanoid()
        definedEnvs.value.push(env)
        if (!envValues.value[env.code]) {
            envValues.value[env.code] = {}
        }
        void persist()
    }

    const addVariableDefinition = () => {
        const id = nanoid()
        variableDefinitions.value.push({ id, name: '' })
        void persist()
    }

    const removeVariableDefinition = (index: number) => {
        const varDef = variableDefinitions.value[index]
        if (!varDef) return
        variableDefinitions.value.splice(index, 1)
        Object.keys(envValues.value).forEach(code => {
            delete envValues.value[code][varDef.id]
        })
        void persist()
    }

    const definedEnvVariables = computed(() => {
        return variableDefinitions.value.map(v => ({
            id: v.id,
            name: v.name,
            value: envValues.value[selectedEnvCode.value]?.[v.id] || '',
            isValidFormat: v.name.startsWith('{{') && v.name.endsWith('}}')
        }))
    })

    const updateVariableName = (index: number, newName: string) => {
        if (variableDefinitions.value[index]) {
            variableDefinitions.value[index].name = newName
            void persist()
        }
    }

    const updateVariableValue = (index: number, newValue: string) => {
        const varDef = variableDefinitions.value[index]
        if (!varDef) return
        if (!envValues.value[selectedEnvCode.value]) {
            envValues.value[selectedEnvCode.value] = {}
        }
        envValues.value[selectedEnvCode.value][varDef.id] = newValue
        void persist()
    }

    const collectEnvVariableNames = () => {
        return variableDefinitions.value
            .map(v => v.name)
            .filter(name => name.startsWith('{{') && name.endsWith('}}'))
    };

    watch([definedEnvs, variableDefinitions, envValues, selectedEnvCode], () => {
        void persist()
    }, { deep: true })

    void hydrate()

    return {
        definedEnvs, selectedEnvCode, addDefinedEnv,
        variableDefinitions, definedEnvVariables, 
        addVariableDefinition, removeVariableDefinition,
        updateVariableName, updateVariableValue,
        collectEnvVariableNames, persist
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
        replaceHighlightVariables({ target: trackedInput, variables: highlightVariableTypes, options, withCursor });
    }
    const rescanHighlightAllInputs = (exceptInputIndex?: number|null, options ?: any) => {
        trackedHighlightInputs.value.forEach((trackedInput, index) => {
            if (index === exceptInputIndex) return;
            highlightInput({ inputIndex: index, options, withCursor: false });
        });
    }
    return { trackedHighlightInputs, rescanHighlightAllInputs, highlightInput };
});

export { useEnvStorage, useInputStorage };
