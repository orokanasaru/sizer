import { clone } from 'ramda'
import { minify as terserMinify, MinifyOptions } from 'terser'

export const minify = (input: string, options: Readonly<MinifyOptions>) => {
  // terser mutates the options which breaks equality checking later
  const { code, error } = terserMinify(input, clone(options))

  return { code, error }
}
