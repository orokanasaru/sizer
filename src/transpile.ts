import { CompilerOptions, transpileModule } from 'typescript'

export type TypeScriptOptions = Pick<
  CompilerOptions,
  | 'allowSyntheticDefaultImports'
  | 'downlevelIteration'
  | 'emitDecoratorMetadata'
  | 'esModuleInterop'
  | 'experimentalDecorators'
  | 'importHelpers'
  | 'jsx'
  | 'jsxFactory'
  | 'module'
  | 'preserveConstEnums'
  | 'removeComments'
  | 'target'
>

export const transpile = (input: string, options: TypeScriptOptions) => {
  const { diagnostics, outputText } = transpileModule(input, {
    compilerOptions: options
  })

  return { diagnostics, outputText }
}
