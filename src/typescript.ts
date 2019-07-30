import { CompilerOptions, transpileModule } from 'typescript'
import ts from 'typescript/package.json'

export const transpile = (input: string, options: CompilerOptions) => {
  console.log('TS VERSION: ', ts.version)
  const { diagnostics, outputText } = transpileModule(input, {
    compilerOptions: options,
    fileName: 'foo.ts'
  })

  return { diagnostics, outputText }
}
