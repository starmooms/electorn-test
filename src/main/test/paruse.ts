import { BufWriteModel } from '../../main/utils/bufModel'
import { AGREEMENT, CAL_READ_MODEL, SAMP_MODEL } from '@/shared/model'
import { BufModelT } from '@/types/BufModel'

// npm i -g ts-node tsconfig-paths
// npm link tsconfig-paths  // 使全局装的tsconfig-paths本地可用

// -r tsconfig-paths  # 注册tsconfig-paths
// --project/-P 指定tsconfig
// --compiler-options/-O  要与编译器选项合并的JSON对象
// --files   使用 tsconfig.json 中的 include 和 exclude， 默认为false
// ts-node -r tsconfig-paths/register --project ./tsconfig.json -O '{\"module\":\"commonjs\",\"moduleResolution\":\"node\"}' --files ./src/main/test/paruse.ts

// ts-node -r ./src/main/test/tsPath.ts -O '{\"module\":\"commonjs\",\"moduleResolution\":\"node\"}' --files ./src/main/test/paruse.ts

function showAll(buf: string, model:BufModelT.OrginModel[], log=true) {
  buf = buf.replace(/\s/g, '')
  const bufModel = new BufWriteModel({
    model: model,
    readBuf: Buffer.from(buf, 'hex')
  })
  return {
    bufModel,
    data: bufModel.showAll(void 0, void 0, log)
  }
}

/** 仅读取data数据 */
function showDataAll(buf: string, model:BufModelT.OrginModel[], log = false) {
  const { data } = showAll(buf, AGREEMENT, log)
  return showAll(data.data, model)
}

showDataAll(
  '68 01 01 cc 00 68 8a 00 00 bd 00 0b cc 00 04 02 01 00 00 00 00 00 1f e0 a4 ed ed ed ed',
  CAL_READ_MODEL
)
