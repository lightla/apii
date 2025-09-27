import { reactive } from 'vue'
import { RuntimeError } from '@/errors/RuntimeError.ts'

type StepFn = (input: any[]) => any[]

interface CreateSequentialPipelineOptions {
    initialData: any[]
    callbackSteps: Record<string, (input: any[]) => any[]>
}

function createPipelineExecutor({
     initialData,
     callbackSteps,
 }: CreateSequentialPipelineOptions) {
    const orderedStepNames = Object.keys(callbackSteps)

    const stepResults = reactive<Record<string, any[]>>({})
    const state = {hasRun: false, }

    // Chạy toàn bộ pipeline từ đầu
    function run() {
        state.hasRun = true

        let inputData = initialData
        for (const stepName of orderedStepNames) {
            stepResults[stepName] = (callbackSteps[stepName])(inputData)
            inputData = stepResults[stepName]
        }
    }

    // Chạy lại từ một bước cụ thể
    function rerunFromStep(stepName: string) {
        if (! state.hasRun) {
            throw new RuntimeError("Pipeline must be run first")
        }

        const stepIndex = orderedStepNames.indexOf(stepName)

        if (stepIndex === -1) {
            throw new RuntimeError("Pipeline not found step" + stepName)
        }

        let inputData = (stepIndex === 0)
            ? initialData
            : stepResults[orderedStepNames[stepIndex - 1]]

        for (let i = stepIndex; i < orderedStepNames.length; i++) {
            const stepName = orderedStepNames[i]
            stepResults[stepName] = (callbackSteps[stepName])(inputData)
            inputData = stepResults[stepName]
        }
    }

    return {
        run,
        rerunFromStep,
        state,
        stepResults,
        finalStepResult: stepResults[orderedStepNames.length - 1],
    }
}

export { createPipelineExecutor }