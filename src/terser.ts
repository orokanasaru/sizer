import { cloneDeep } from 'lodash-es'
import { minify as terserMinify, MinifyOptions } from 'terser'

export const minify = (input: string, options: MinifyOptions) => {
  // terser mutates the options which breaks equality checking later
  const { code, error } = terserMinify(input, cloneDeep(options))

  return { code, error }
}
