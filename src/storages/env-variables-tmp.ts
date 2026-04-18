import {defineStore} from 'pinia';
import {computed, ref} from 'vue';
import { nanoid } from 'nanoid'
import {replaceHighlightVariables} from "@/utils/variable-input.ts";
import {
    type HighlightVariableOptionParam,
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
    /*******************
     * Env
     *******************/

    const definedEnvs = ref<Env[]>([
        { id: nanoid(), name: 'No Environment', code: 'no-environment'},
        { id: nanoid(), name: 'Development', code: 'development'},
        { id: nanoid(), name: 'Production', code: 'production'},
        { id: nanoid(), name: 'Production1', code: 'production1'},
        { id: nanoid(), name: 'Production2', code: 'production2'},
        { id: nanoid(), name: 'Production3', code: 'production3'},
        { id: nanoid(), name: 'Production4', code: 'production4'},
    ])

    const addDefinedEnv = (env: Env): void => {
        env.id = nanoid();

        definedEnvs.value.push(env)
    }

    /*******************
     * Env Variable
     *******************/

    const definedEnvVariables = ref<EnvVariable[]>([
        { id: nanoid(), name: '{{v1}}', value: 'Value 1', isValidFormat: true},
        { id: nanoid(), name: '{{v11}}', value: 'Value 11', isValidFormat: true},
        { id: nanoid(), name: '{{v2}}', value: 'Value 2', isValidFormat: true},
        { id: nanoid(), name: '{{v311}}', value: 'Value 3', isValidFormat: true},
        { id: nanoid(), name: '{{v32222}}', value: 'Value 4', isValidFormat: true},
        { id: nanoid(), name: '{{v333333}}', value: 'Value 3', isValidFormat: true},
        { id: nanoid(), name: '{{v322233}}', value: 'Value 3', isValidFormat: true},
        { id: nanoid(), name: '{{v3223333}}', value: 'Value 3', isValidFormat: true},
        { id: nanoid(), name: '{{v3222111}}', value: 'Value 3', isValidFormat: true},
        { id: nanoid(), name: '{{v32231131}}', value: 'Value 3', isValidFormat: true},
        { id: nanoid(), name: '{{v3225111}}', value: 'Value 3', isValidFormat: true},
        { id: nanoid(), name: '{{v322879}}', value: 'Value 3', isValidFormat: true},
        { id: nanoid(), name: '{{v32297979}}', value: 'Value 3', isValidFormat: true},
        { id: nanoid(), name: '{{v3228799}}', value: 'Value 3', isValidFormat: true},
        { id: nanoid(), name: '{{v3229899}}', value: 'Value 3', isValidFormat: true},
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

    return {
        definedEnvs, addDefinedEnv,
        definedEnvVariables, addDefinedEnvVariable, collectEnvVariableNames,
    };
});

const useInputStorage = defineStore('inputs', () => {
    // Mặc định là mảng rỗng, không phải undefined
    const trackedHighlightInputs = ref<HTMLDivElement[]>([]);

    console.log("beofre-trackedHighlightInputs.value:", trackedHighlightInputs.value)
    console.log("beofre-trackedHighlightInputs..value.length:", trackedHighlightInputs.value.length)

    const newDiv = document.createElement('div'); // Tạo element
    newDiv.className = 'div0';

    trackedHighlightInputs.value.push(newDiv);

    console.log("trackedHighlightInputs.value:", trackedHighlightInputs.value)
    console.log("trackedHighlightInputs.value.length", trackedHighlightInputs.value.length)

    const highlightInput = ({inputIndex, options, withCursor = true}: HighlightInputParam) => {
        if (! inputIndex) {
            return;
        }

        const trackedInput = trackedHighlightInputs.value[inputIndex];

        console.log("trackedInput-inputIndex:", inputIndex);
        console.log("trackedInput-value:", trackedInput);
        console.log("trackedInput:", trackedHighlightInputs);
        console.log("trackedInput.value:", trackedHighlightInputs.value);
        console.log("trackedInput.length:", trackedHighlightInputs.value.length);

        if (! trackedInput) {
            return;
        }

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

    const rescanHighlightAllInputs = (exceptInputIndex?: number|null, options ?: HighlightVariableOptionParam) => {
        trackedHighlightInputs.value.forEach((trackedInput: HTMLDivElement, index : number) => {
            if (index === exceptInputIndex) {
                return;
            }

            highlightInput({
                inputIndex: index,
                options: options,
                withCursor: false
            });
        });
    }

    return { trackedHighlightInputs, rescanHighlightAllInputs, highlightInput };
});


const loadAStorage = defineStore('inputs', () => {
    // Mặc định là mảng rỗng, không phải undefined
    const trackedHighlightInputs = ref<HTMLDivElement[]>([]);

    console.log("beofre-trackedHighlightInputs.value:", trackedHighlightInputs.value)
    console.log("beofre-trackedHighlightInputs..value.length:", trackedHighlightInputs.value.length)

    const newDiv = document.createElement('div'); // Tạo element
    newDiv.className = 'div0';

    trackedHighlightInputs.value.push(newDiv);

    console.log("trackedHighlightInputs.value:", trackedHighlightInputs.value)
    console.log("trackedHighlightInputs.value.length", trackedHighlightInputs.value.length)

    const highlightInput = ({inputIndex, options, withCursor = true}: HighlightInputParam) => {
        if (! inputIndex) {
            return;
        }

        const trackedInput = trackedHighlightInputs.value[inputIndex];

        console.log("trackedInput-inputIndex:", inputIndex);
        console.log("trackedInput-value:", trackedInput);
        console.log("trackedInput:", trackedHighlightInputs);
        console.log("trackedInput.value:", trackedHighlightInputs.value);
        console.log("trackedInput.length:", trackedHighlightInputs.value.length);

        if (! trackedInput) {
            return;
        }

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

    const rescanHighlightAllInputs = (exceptInputIndex?: number|null, options ?: HighlightVariableOptionParam) => {
        trackedHighlightInputs.value.forEach((trackedInput: HTMLDivElement, index) => {
            if (index === exceptInputIndex) {
                return;
            }

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