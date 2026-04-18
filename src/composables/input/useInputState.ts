import {toRef} from 'vue'
import {useInputStorage} from "@/storages";
import {HighlightInputService} from "@/services/app/input";
import type {HighlightInputParam} from "@/types";

export const useInputState = () => {
    const inputStorage = useInputStorage()

    const highlightService = new HighlightInputService(
        toRef(inputStorage, 'trackedHighlightInputs')
    )

    return {
        highlightInput: highlightService.highlightInput.bind(highlightService),
        rescanHighlightAllInputs: highlightService.rescanHighlightAllInputs.bind(highlightService),
    }
}
