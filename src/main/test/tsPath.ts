const tsConfig = require("../../../tsconfig.json");
const tsConfigPaths = require("tsconfig-paths");
const path = require('path')

// tsconfig-paths 使ts-node 解析'@'路径
const cleanup = tsConfigPaths.register({
  baseUrl: path.resolve(__dirname, "../../../"),
  paths: tsConfig.compilerOptions.paths,
})
