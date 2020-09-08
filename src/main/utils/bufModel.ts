import { deepClone } from '@/shared/utils'
import logger from '../core/Logger'
import { BufModelT } from '@/types/BufModel'
import { toHex } from '.'

// export interface Model {
//   name: string
//   bytLen?: number
//   type?: 'list' | 'int' | 'float'
//   model?: Model[]
// }

declare type Model = BufModelT.OrginModel

interface BufModelOpts {
  model: Model[]
  readBuf?: Buffer
  listLen?: {
    [key: string]: number
  }
}

declare type BufWriteModelOpts = {
  model?: BufModelOpts['model']
  listLen?: BufModelOpts['listLen']
  readBuf?: Buffer
  parent?: {
    bufModel: BufModel
    buf: Buffer
    start: number
  }
}

declare type ModelBaseItem = Model & {
  offset: number
  type?: string
  bytLen: number
}

declare type ModelListItem<T = any> = ModelBaseItem & {
  bufModel: BufModel
  listLength: number
  listAction: T[]
}

declare type ModelItem = ModelBaseItem | ModelListItem

interface ModelTarget {
  [key: string]: ModelItem
}

/** model */
class BufModel<T = any> {
  modelTarget: ModelTarget = {}
  bufLength = 0
  listModel: ModelListItem<T>[] = []

  constructor({ model, listLen, readBuf }: BufModelOpts) {
    model.forEach(item => {
      const target: ModelItem = {
        offset: this.bufLength,
        bytLen: 0,
        ...deepClone(item)
      }
      this.modelTarget[item.name] = target
      if (target.type === 'list') {
        if (!target.model) {
          throw new Error(`${target.name} list model undefined`)
        }

        let len = 0
        if (readBuf) {
          if (!target.len) {
            throw new Error(`${target.name} read listlen undefined`)
          }

          const lenTarget = this.modelTarget[target.len]
          if (!lenTarget) {
            throw new Error(
              `ReadBuf ${target.name} listlen read ${target.len} undefined before`
            )
          }

          len = readBuf.readIntBE(lenTarget.offset, lenTarget.bytLen)
        } else if (!listLen || listLen[target.name] === void 0) {
          throw new Error(`${target.name} listlen undefined`)
        } else {
          len = listLen[target.name]
        }

        const listBufModel = new BufModel({
          model: target.model
        })
        const listTarget = target as ModelListItem
        listTarget.bufModel = listBufModel
        listTarget.listLength = len
        listTarget.listAction = []
        listTarget.bytLen = listBufModel.bufLength
        this.listModel.push(listTarget)
        // logger.debug(
        //   '列表添加++++++++',
        //   target.name,
        //   listBufModel.bufLength * listLen[target.name]
        // )
        this.bufLength += listBufModel.bufLength * len
      } else {
        // logger.debug('单项添加', target.name, target.bytLen)
        this.bufLength += target.bytLen as number
      }
    })
  }
}

export class BufWriteModel {
  buf: Buffer
  bufModel: BufModel<BufWriteModel>
  start = 0

  constructor(opts: BufWriteModelOpts) {
    if (opts.parent) {
      this.buf = opts.parent.buf
      this.start = opts.parent.start
      this.bufModel = opts.parent.bufModel
      // logger.info(
      //   this.start,
      //   this.bufModel.bufLength,
      //   this.buf
      //     .slice(this.start, this.start + this.bufModel.bufLength)
      //     .toString('hex')
      // )
    } else {
      if (!opts.model) {
        throw new Error(`BufWriteModel model undefined`)
      }
      this.bufModel = new BufModel({
        model: opts.model,
        listLen: opts.listLen,
        readBuf: opts.readBuf
      })
      this.buf = opts.readBuf
        ? opts.readBuf
        : Buffer.alloc(this.bufModel.bufLength)
    }
    this.createListModel()
  }

  createListModel() {
    if (this.bufModel.listModel.length > 0) {
      this.bufModel.listModel.forEach(item => {
        item.listAction = []
        for (let i = 0; i < item.listLength; i++) {
          const action = new BufWriteModel({
            parent: {
              bufModel: item.bufModel,
              buf: this.buf,
              start: item.bufModel.bufLength * i + item.offset
            }
          })
          item.listAction.push(action)
        }
      })
    }
  }

  getTarget(name: string) {
    const target = this.bufModel.modelTarget[name]
    if (!target) {
      throw new Error(`BufModel write ${name} undefined`)
    }
    return target
  }

  /** 直接写数值 */
  writer(name: string, value: number | string) {
    const target = this.getTarget(name)
    if (target.bytLen === void 0) throw new Error(`${name} bytLen undefined`)
    const data = (value as unknown) as number
    const offset = this.start + target.offset
    if (target.type === 'float') {
      // if (typeof data === 'number') {
      //   data = Math.round((data + Number.EPSILON) * 100) / 100
      // }
      return this.buf.writeFloatBE(data, offset)
    }
    if (target.type === 'int') {
      return this.buf.writeIntBE(data, offset, target.bytLen)
    }
    return this.buf.writeUIntBE(data, offset, target.bytLen)
  }

  /** 按位写 */
  writerBit(name: string, data: number[], fillNum = 0) {
    const target = this.getTarget(name)
    if (target.bytLen === void 0) throw new Error(`${name} bytLen undefined`)
    const bitArr = Array(target.bytLen * 8).fill(fillNum)
    data.forEach(item => {
      bitArr[item] = 1
    })
    return this.writer(name, parseInt(bitArr.reverse().join(''), 2))
  }

  /** 直接读数值 */
  read(name: string) {
    const target = this.getTarget(name)
    if (target.bytLen === void 0) throw new Error(`${name} bytLen undefined`)
    const offset = this.start + target.offset
    if (target.type === 'float') {
      return this.buf.readFloatBE(offset)
    }
    if (target.type === 'int') {
      return this.buf.readIntBE(offset, target.bytLen)
    }
    return this.buf.readUIntBE(offset, target.bytLen)
  }

  /** 读16进制数值 */
  readHex(name: string) {
    const target = this.getTarget(name)
    const data = this.read(name)
    return toHex(data, target.bytLen)
  }

  readFloat(name: string, fractionDigits = 6) {
    const n = fractionDigits > 1 ? 10 ** fractionDigits : 1
    // console.log(this.read(name) + Number.EPSILON)
    return Math.round(this.read(name) * n) / n
  }

  ecahList(
    name: string,
    cb: (BufWriteModel: BufWriteModel, index: number) => any
  ) {
    const target = this.getTarget(name) as ModelListItem<BufWriteModel>
    if (target.listAction) {
      target.listAction.forEach((item, index) => {
        cb(item, index)
      })
    }
  }
}
