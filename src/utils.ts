import { isEqual as lodashEqual } from 'lodash-es'

export const isEqual = lodashEqual as <T>(l: T, r: T) => boolean

export const isValue = <T>(val: T | undefined): val is T => val !== undefined
