import { deepClone } from '@/shared/utils'
import logger from '../core/Logger'

export interface Model {
  name: string
  bytLen?: number
  type?: 'list' | 'int' | 'float'
  model?: Model[]
}
interface BufModelOpts {
  model: Model[]
  listLen?: {
    [key: string]: number
  }
}

declare type BufWriteModelOpts = {
  bufModel?: BufModel
  buf?: Buffer
  start?: number
  model?: BufModelOpts['model']
  listLen?: BufModelOpts['listLen']
}

declare type ModelBaseItem = Model & {
  offset: number
  type?: string
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

  constructor({ model, listLen }: BufModelOpts) {
    model.forEach(item => {
      const target: ModelItem = {
        offset: this.bufLength,
        ...deepClone(item)
      }
      this.modelTarget[item.name] = target
      if (target.type === 'list') {
        if (!target.model) {
          throw new Error(`${target.name} list model undefined`)
        }
        if (!listLen || listLen[target.name] === void 0) {
          throw new Error(`${target.name} listlen undefined`)
        }
        // if (!actionModel) {
        //   throw new Error(`bufModel actionModel undefined`)
        // }

        // const listLength = listLen[target.name]
        // target.bufModel = []
        // for (let i = 0; i < listLength; i++) {
        //   target.bufModel.push(actionModel(target.offset, target.model))
        // }
        // if (target.bufModel.length > 0) {
        //   const actionModel = target.bufModel[0]
        //   this.bufLength += actionModel.bufLength * listLength
        // }
        const listBufModel = new BufModel({
          model: target.model
        })
        ;(target as ModelListItem).bufModel = listBufModel
        ;(target as ModelListItem).listLength = listLen[target.name]
        ;(target as ModelListItem).listAction = []
        target.bytLen = listBufModel.bufLength
        this.listModel.push(target as ModelListItem)
        // logger.debug(
        //   '列表添加',
        //   target.name,
        //   listBufModel.bufLength * listLen[target.name]
        // )
        this.bufLength += listBufModel.bufLength * listLen[target.name]
      } else {
        // logger.debug('单项添加', target.name, target.bytLen)
        this.bufLength += target.bytLen as number
      }
    })
  }
}

export class BufWriteModel {
  buf: Buffer
  parent?: BufWriteModel
  bufModel: BufModel<BufWriteModel>
  start = 0

  constructor(opts: BufWriteModelOpts) {
    if (opts.bufModel) {
      this.bufModel = opts.bufModel
    } else {
      if (!opts.model) {
        throw new Error(`BufWriteModel model undefined`)
      }
      this.bufModel = new BufModel({
        model: opts.model,
        listLen: opts.listLen
      })
    }
    this.start = opts.start || 0
    this.buf = opts.buf || Buffer.alloc(this.bufModel.bufLength)
    this.createListModel()
  }

  createListModel() {
    if (this.bufModel.listModel.length > 0) {
      this.bufModel.listModel.forEach(item => {
        item.listAction = []
        for (let i = 0; i < item.listLength; i++) {
          const action = new BufWriteModel({
            bufModel: item.bufModel,
            buf: this.buf,
            start: item.bufModel.bufLength * i + item.offset
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
