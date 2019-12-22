import { JsonFile } from '@microsoft/node-core-library'
import { RushConfiguration } from '@microsoft/rush-lib/lib/api/RushConfiguration'
import fs from 'fs'
import { ncp } from 'ncp'
import path from 'path'
import prompts from 'prompts'
import replaceInFile from 'replace-in-file'
import { promisify } from 'util'

type RushJson = {
  projects: {
    packageName: string
    projectFolder: string
  }[]
}

type WorkspaceJson = {
  folders: {
    path: string
  }[]
}

const copy = promisify(ncp)

const packagePath = (name: string, ...rest: string[]) =>
  path.resolve('packages', name, ...rest)

const addSorted = <
  TObj extends Record<TKey, unknown[]>,
  TKey extends keyof TObj,
  TVal extends TObj[TKey][number] & Record<TCmp, string>,
  TCmp extends keyof TVal
>(
  object: TObj,
  key: TKey,
  value: TVal,
  sortKey: TCmp
) => {
  object[key] = ([...object[key], value] as TVal[]).sort((l, r) =>
    l[sortKey].localeCompare(r[sortKey])
  ) as TObj[TKey]
}

const createPackage = async () => {
  const rushJson = RushConfiguration.tryFindRushJsonLocation()

  if (!rushJson) {
    throw new Error("can't find rush.json")
  }

  const rushConfig = JsonFile.load(rushJson) as RushJson

  const { packageName }: { packageName: string } = await prompts({
    message: 'Package name:',
    name: 'packageName',
    type: 'text',
    validate: (name: string) =>
      // tslint:disable-next-line: non-literal-fs-path
      fs.existsSync(packagePath(name))
        ? 'directory already exists'
        : rushConfig.projects.some(p => name === p.packageName)
        ? 'package already exists'
        : true
  })

  if (!packageName) {
    return
  }

  const { description }: { description: string } = await prompts({
    message: 'Package description:',
    name: 'description',
    type: 'text'
  })

  if (!description) {
    return
  }

  console.log('Updating rush.json')

  addSorted(
    rushConfig,
    'projects',
    {
      packageName: `@ms-ows/${packageName}`,
      projectFolder: `packages/${packageName}`
    },
    'packageName'
  )

  rushConfig.projects = [...rushConfig.projects].sort((l, r) =>
    l.packageName.localeCompare(r.packageName)
  )

  JsonFile.save(rushConfig, rushJson, { updateExistingFile: true })

  console.log('Copying starter files')

  await copy(packagePath('sample-app'), packagePath(packageName))

  console.log('Updating package.json')

  const packageJson = packagePath(packageName, 'package.json')

  JsonFile.save({ ...JsonFile.load(packageJson), description }, packageJson, {
    updateExistingFile: true
  })

  console.log('Updating sample-app references')

  await replaceInFile({
    files: `${packagePath(packageName)}/**`,
    from: /sample-app/g,
    ignore: '**/node_modules/**',
    to: packageName
  })

  console.log('Updating workspace')

  const workspacePath = require.resolve('../../../sizer.code-workspace')

  const workspaceJson = JsonFile.load(workspacePath) as WorkspaceJson

  addSorted(
    workspaceJson,
    'folders',
    {
      path: `./rush-managed/packages/${packageName}`
    },
    'path'
  )

  JsonFile.save(workspaceJson, workspacePath, { updateExistingFile: true })
}

createPackage().catch(console.error)
