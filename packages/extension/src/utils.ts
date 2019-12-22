import * as R from 'ramda'

export const equals = R.equals as <T>(l: T, r: T) => boolean
export const isValue = <T>(val: T | undefined): val is T => val !== undefined

export const allValues = <T>(seq: (T | undefined)[]) =>
  seq.every(isValue) ? (seq as T[]) : undefined
