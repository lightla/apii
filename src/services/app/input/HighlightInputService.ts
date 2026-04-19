
import type {Ref} from 'vue'

import {HighlightVariableTypeEnum} from "@/types"

import type {
    HighlightVariableOptionParam, HighlightInputParam, HighlightVariableTypeParam
} from "@/types"


import {replaceHighlightVariables} from "@/utils/variable-input.ts";

export class HighlightInputService {
    constructor(private trackedHighlightInputs: Ref<HTMLDivElement[]>) {}

    highlightInput(param: HighlightInputParam){
        console.log("service-inputIndex:", param.inputIndex);

        if (param.inputIndex === undefined || param.inputIndex === null) {
            return;
        }

        const trackedInput = this.trackedHighlightInputs.value[param.inputIndex];

        console.log("service-trackedInput-inputIndex:", param.inputIndex);
        console.log("service-trackedInput-value:", trackedInput);
        console.log("service-trackedInput:", this.trackedHighlightInputs);
        console.log("service-trackedInput.value:", this.trackedHighlightInputs.value);
        console.log("service-trackedInput.length:", this.trackedHighlightInputs.value.length);

        if (! trackedInput) {
            return;
        }

        const highlightVariableTypes: HighlightVariableTypeParam[] = [];

        // Kiểm tra chính xác chuỗi "true" từ dataset
        if (trackedInput.dataset.enabledEnvVariable === 'true') {
            highlightVariableTypes.push({
                type: HighlightVariableTypeEnum.EnvVariable,
                definedVariableCssClass: "defined-env-variable",
                undefinedEnvVariableCssClass: "undefined-env-variable",
            });
        }

        if (trackedInput.dataset.enabledUriParam === 'true') {
            highlightVariableTypes.push({
                type: HighlightVariableTypeEnum.UriParam,
                definedVariableCssClass: "defined-uri-param",
            });
        }

        console.log("service-highlightVariableTypes:" +  highlightVariableTypes)

        replaceHighlightVariables({
            target: trackedInput,
            variables: highlightVariableTypes,
            options: param.options,
            withCursor: param.withCursor,
        });
    }

    rescanHighlightAllInputs({
                                 exceptInputIndex,
                                 options
                             }: {
        exceptInputIndex?: number | null;
        options?: HighlightVariableOptionParam;
    } = {}) {
        return;

        this.trackedHighlightInputs.value.forEach((trackedInput: HTMLDivElement, index: number) => {
            if (index === exceptInputIndex) {
                return;
            }

            this.highlightInput({
                inputIndex: index,
                options: options,
                withCursor: false
            });
        });
    }
}
