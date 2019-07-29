import { minify as terserMinify, MinifyOptions } from 'terser'

export const minify = (input: string, options: MinifyOptions) => {
  const { code, error, warnings } = terserMinify(input, options)

  return { code, error, warnings }
}
