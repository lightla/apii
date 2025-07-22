export enum HighlightVariableTypeEnum {
  EnvVariable = 'env-variable',
  UriParam = 'uri-param'
}

export type HighlightVariableTypeParam = {
  type: HighlightVariableTypeEnum;
  definedVariableCssClass: string;
  undefinedEnvVariableCssClass?: string | null;
}

export type HighlightVariableOptionParam = {
  definedEnvVariables?: string[];
}

export type HighlightInputParam = {
  inputIndex?: number;
  options?: HighlightVariableOptionParam;
  withCursor?: boolean;
}

export type HighlightVariableParam = {
  target: HTMLDivElement;
  variables: HighlightVariableTypeParam[];
  options?: HighlightVariableOptionParam;
  withCursor?: boolean
}