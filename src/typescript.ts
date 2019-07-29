import { CompilerOptions, transpileModule } from 'typescript'

export const transpile = (input: string, options: CompilerOptions) => {
  const { diagnostics, outputText } = transpileModule(input, {
    compilerOptions: options
  })

  return { diagnostics, outputText }
}
