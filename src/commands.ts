import { writeOutput } from './output'
import { getCurrentConfiguration } from './settings'
import { transpile } from './transpile'

export const testTranspile = () => {
  {
    const { outputText } = transpile(
      `
        export const transpile = (input: string, options: Options) => {
        const { diagnostics, outputText } = transpileModule(input, { compilerOptions: options });

        return { diagnostics, outputText};
        };
      `,
      getCurrentConfiguration().typeScript
    )

    writeOutput(outputText)
  }
}
