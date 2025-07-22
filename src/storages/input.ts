import {defineStore} from "pinia";
import {ref} from "vue";
import {
    type HighlightInputParam, type HighlightVariableOptionParam,
    HighlightVariableTypeEnum,
    type HighlightVariableTypeParam
} from "@/types/variable-input.ts";

import {replaceHighlightVariables} from "@/utils/variable-input.ts";


export const useInputStorage = defineStore('inputs', () => {
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