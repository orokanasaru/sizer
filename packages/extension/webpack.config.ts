import { CleanWebpackPlugin } from 'clean-webpack-plugin'
import path from 'path'
import TerserPlugin from 'terser-webpack-plugin'
import {
  BannerPlugin,
  Configuration,
  DefinePlugin,
  NormalModuleReplacementPlugin
} from 'webpack'
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer'
import webpackMerge from 'webpack-merge'

type EnvironmentOptions = {
  analyze?: boolean
  disableConcatenation?: boolean
}

type Resource = { request: string }

const analysis: Configuration = {
  plugins: [
    new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      generateStatsFile: true
    })
  ]
}

const disableConcatenation: Configuration = {
  optimization: {
    concatenateModules: false
  }
}

const getCommonConfig = (mode: Configuration['mode']): Configuration => ({
  entry: { sizer: './src/sizer.ts' },
  externals: {
    terser: 'commonjs terser',
    typescript: 'commonjs typescript',
    vscode: 'commonjs vscode'
  },
  mode,
  module: {
    rules: [
      {
        loader: 'ts-loader',
        options: {
          configFile: 'tsconfig.build.json',
          reportFiles: ['src/**/*.{ts,tsx}']
        },
        test: /\.tsx?$/
      },
      {
        enforce: 'pre',
        test: /\.js$/,
        use: ['source-map-loader']
      }
    ]
  },
  output: {
    chunkFilename: '[name].js',
    filename: '[name].js',
    libraryTarget: 'commonjs2'
  },
  plugins: [
    new DefinePlugin({
      'process.env': {
        BUILD_TIMESTAMP: `"${new Date().toISOString()}"`
      }
    }),
    new BannerPlugin({
      banner: 'require("source-map-support").install();',
      entryOnly: false,
      raw: true
    }),
    new NormalModuleReplacementPlugin(/rxjs/, (resource: Resource) => {
      resource.request = resource.request.replace(/rxjs/, 'rxjs/_esm2015')
    })
  ],
  resolve: {
    extensions: ['.js', '.ts', '.tsx', '.json']
  },
  target: 'node'
})

const getProductionConfig = (): Configuration => ({
  devtool: 'source-map',
  optimization: {
    minimizer: [
      new TerserPlugin({
        cache: true,
        parallel: true,
        sourceMap: true
      })
    ]
  },
  output: {
    path: path.join(__dirname, 'dist')
  },
  plugins: [new CleanWebpackPlugin()],
  stats: {
    maxModules: Infinity
  }
})

const getDevelopmentConfig = (): Configuration => ({
  devtool: 'eval-source-map',
  output: {
    path: path.join(__dirname, 'build')
  },
  plugins: [new CleanWebpackPlugin()]
})

module.exports = (
  env: EnvironmentOptions,
  { mode = 'development' }: Configuration
) =>
  webpackMerge(
    getCommonConfig(mode),
    mode === 'production' ? getProductionConfig() : getDevelopmentConfig(),
    env && env.analyze ? analysis : {},
    env && env.disableConcatenation ? disableConcatenation : {}
  )
