// src/types/index.ts
// export * from './path-variable'
// export * from './query-param'

export * from './variable-input.ts'

export interface RouteInfo {
  group: string
  method: string
  route: string
}