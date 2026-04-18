import {defineStore} from 'pinia';
import {computed, ref} from 'vue';
import { nanoid } from 'nanoid'

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
        { id: nanoid(), name: '{{v3}}', value: 'Value 2', isValidFormat: true},
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

    const findIndexByName = (name: string) => {
        return definedEnvVariables.value.findIndex(
            variable => variable.isValidFormat && variable.name === name
        );
    };

    return {
        definedEnvs, addDefinedEnv,
        definedEnvVariables, addDefinedEnvVariable, collectEnvVariableNames, findIndexByName
    };
});

export { useEnvStorage };