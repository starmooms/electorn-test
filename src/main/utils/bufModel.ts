import { deepClone } from '@/shared/utils'
import { BufModelT } from '@/types/BufModel'
import { replaceAscii } from '.'

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

          if (readBuf.length > 0) {
            len = readBuf.readUIntBE(lenTarget.offset, lenTarget.bytLen)
          }
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
        this.bufLength += listBufModel.bufLength * len
      } else {
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

      if (!opts.readBuf) {
        this.writeListLen(opts.listLen)
      }
    }
    this.createListModel()
  }

  /** 写入列表帧长度 */
  writeListLen(listLen: BufWriteModelOpts['listLen']) {
    if (listLen) {
      Object.entries(listLen).forEach(([key, len]) => {
        const model = this.getTarget(key)
        if (model.type === 'list') {
          this.writer(model.len, len)
        }
      })
    }
  }

  createListModel() {
    const listModel = this.bufModel.listModel

    if (listModel.length > 0) {
      listModel.forEach(item => {
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

  /** 根据属性名获取target内容 */
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
    if (target.bytLen === void 0) {
      throw new Error(`${name} bytLen undefined`)
    }
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
    if (target.bytLen === void 0) {
      throw new Error(`${name} bytLen undefined`)
    }
    const bitArr = Array(target.bytLen * 8).fill(fillNum)
    data.forEach(item => {
      bitArr[item] = 1
    })
    return this.writer(name, parseInt(bitArr.reverse().join(''), 2))
  }

  /** 写ip */
  writerIp(name: string, ip: string) {
    const { offset } = this.getOffset(name)
    Buffer.from(ip.split('.')).copy(this.buf, offset)
  }

  /** 写16进制 */
  writerHex(name: string, data: string) {
    const { offset } = this.getOffset(name)
    this.buf.write(data, offset, 'hex')
  }

  getOffset(name: string) {
    const target = this.getTarget(name)
    if (target.bytLen === void 0) {
      throw new Error(`${name} bytLen undefined`)
    }
    const offset = this.start + target.offset
    return {
      offset,
      target
    }
  }

  /** 直接读数值 */
  read(name: string) {
    const { target, offset } = this.getOffset(name)
    // logger.info(
    //   target.name,
    //   this.buf.slice(offset, offset + target.bytLen).toString('hex')
    // )
    if (target.type === 'float') {
      return this.buf.readFloatBE(offset)
    }
    if (target.type === 'int') {
      return this.buf.readIntBE(offset, target.bytLen)
    }
    return this.buf.readUIntBE(offset, target.bytLen)
  }

  /** 读字符 默认ascii */
  readStr(name: string, encoding = 'ascii') {
    const { target, offset } = this.getOffset(name)
    let str = this.buf.toString(encoding, offset, offset + target.bytLen)
    if (encoding === 'ascii') {
      str = replaceAscii(str)
    }
    return str
  }

  /** 读16进制数值 */
  readHex(name: string) {
    return this.readStr(name, 'hex')
  }

  /** 读Ip */
  readIp(name: string) {
    const { target, offset } = this.getOffset(name)
    return this.buf.slice(offset, offset + target.bytLen).join('.')
  }

  readFloat(name: string, fractionDigits = 6) {
    const n = fractionDigits > 1 ? 10 ** fractionDigits : 1
    // console.log(this.read(name) + Number.EPSILON)
    return Math.round(this.read(name) * n) / n
  }

  /** 连接 */
  concat(buf: Buffer) {
    this.buf = Buffer.concat([this.buf, buf])
  }

  /** 循环列表项 */
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

  showAll(result: any[] = [], log = true) {
    try {
      Object.keys(this.bufModel.modelTarget).forEach(item => {
        // logger.info(this.getTarget(item))
        const data = this.getTarget(item)
        if (data.type === 'list') {
          const listObj: any[] = [`listName: ${item}`]
          result.push(listObj)
          this.ecahList(item, listModel => {
            const subItem: any = []
            listObj.push(subItem)
            listModel.showAll(subItem, false)
          })
        } else {
          result.push(`${item} : ${this.readHex(item)}`)
          // logger.info(item, this.readHex(item))
        }
      })
    } catch (err) {
      console.error('SHOW ALL ERROR', err)
      throw err
    } finally {
      if (log) {
        console.log(JSON.stringify(result, null, 2))
      }
    }
  }
}
