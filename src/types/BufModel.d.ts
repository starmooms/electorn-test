import BufModel from '@/main/utils/ParsBuf'

export declare namespace BufModelT {
  interface ModelOItem {
    name: string
    bytLen: number
    type?: 'int' | 'float'
  }

  interface ModelOList {
    name: string
    type: 'list'
    model: OrginModel[]
    len: string
  }

  interface ModelOByte {
    name: string
    type: 'byte'
    len: string
  }

  /** Model 源 */
  type OrginModel = ModelOItem | ModelOList | ModelOByte

  /** bufModel参数 */
  interface BufModelOpts {
    model: OrginModel[]
    listLen?: {
      [key: string]: number
    }
  }

  /** BufWriteOpts参数 */
  interface BufWriteOpts {
    model?: BufModelT.OrginModel
    listLen?: BufModelOpts['listLen']
    parent: {
      bufModel?: BufModel
      buf: Buffer
      start: number
    }
  }

  type ModelBaseItem = {
    offset: number
  } & OrginModel

  type ModelListItem<T = any> = {
    offset: number
    bufModel: BufModel
    listLength: number
    listAction: T[]
  } & ModelBaseItem
  type ModelItem = ModelBaseItem | ModelListItem
}
