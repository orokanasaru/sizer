import { CompilerOptions, transpileModule } from 'typescript'

export const transpile = (
  input: string,
  options: Readonly<CompilerOptions>
) => {
  const { diagnostics, outputText } = transpileModule(input, {
    compilerOptions: options,
    fileName: input.match(/<\/|\/>/) ? 'tmp.tsx' : 'tmp.ts'
  })

  return { diagnostics, outputText }
}
