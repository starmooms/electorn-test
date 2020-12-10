interface SliceData {
  offset: number
  byte: number
  hasSigned: boolean
  hasFload: boolean
}
declare type SliceItemData = Partial<SliceData>

declare type SliceItem = number | SliceItemData

export class BufData {
  bufModel: BufModel
  buf: Buffer
  // declare getIndex(index:number, <T>hex:boolean=>T ? String : Boolean

  constructor(bufModel: BufModel, buf: Buffer) {
    this.bufModel = bufModel
    this.buf = buf
  }

  getIndex(index: number) {
    const sliceItem = this.bufModel.sliceData[index]
    if (!sliceItem) {
      throw new Error(`BufModel ${index} no defined`)
    }
    const { hasSigned, hasFload, offset, byte } = sliceItem
    if (hasFload) {
      return this.buf.readFloatBE(offset).toFixed(6)
    } else if (hasSigned) {
      return this.buf.readIntBE(offset, byte)
    } else {
      return this.buf.readUIntBE(offset, byte)
    }
  }

  getIndexHex(index: number) {
    const sliceItem = this.bufModel.sliceData[index]
    if (!sliceItem) {
      throw new Error(`BufModel ${index} no defined`)
    }
    return this.buf
      .slice(sliceItem.offset, sliceItem.offset + sliceItem.byte)
      .toString('hex')
  }

  getIndexByt(index: number) {
    const num = this.getIndex(index).toString(2)
    const i = num.indexOf('1')
    if (i >= 0) {
      return num.length - i
    } else {
      return 0
    }
  }
}

declare type BufTypeWrite = BufWriteListModel | BufWriteModel
export class WriteItemModel {
  bufModel: BufTypeWrite
  start: number
  constructor(bufModel: BufTypeWrite, start: number) {
    this.bufModel = bufModel
    this.start = start
  }

  write(itemIndex: number, value: number | string) {
    const data = (value as unknown) as number
    const opts = this.bufModel.sliceData[itemIndex]
    const byte = opts.byte
    const offset = this.start + opts.offset
    const buf = this.bufModel.buf
    if (opts.hasFload) {
      buf.writeFloatBE(data, offset)
    } else if (opts.hasSigned) {
      buf.writeIntBE(data, offset, byte)
    } else {
      buf.writeUIntBE(data, offset, byte)
    }
  }
}

/** Buffer 数据模型 */
export default class BufModel {
  sliceData: SliceData[]
  bufLength: number

  constructor(bufSpliceArr: SliceItem[]) {
    this.bufLength = 0
    this.sliceData = bufSpliceArr.map(item => {
      let dataItem = {
        byte: 1,
        hasSigned: false,
        hasFload: false,
        offset: this.bufLength
      }
      if (typeof item === 'number') {
        dataItem.byte = item
        this.bufLength += item
      } else {
        dataItem = {
          ...dataItem,
          ...item
        }
        this.bufLength += dataItem.byte
      }
      return dataItem
    })
  }

  getBufData(buf: Buffer) {
    return new BufData(this, buf)
  }
}

export class BufWriteListModel extends BufModel {
  buf: Buffer
  len: number
  constructor(len: number, bufSpliceArr: SliceItem[]) {
    super(bufSpliceArr)
    this.buf = Buffer.alloc(len * this.bufLength)
    this.len = len
  }

  getWriteModel(index: number) {
    return new WriteItemModel(this, this.bufLength * index)
  }
}

export class BufWriteModel extends BufModel {
  buf: Buffer
  constructor(bufSpliceArr: SliceItem[]) {
    super(bufSpliceArr)
    this.buf = Buffer.alloc(this.bufLength)
  }

  getWriteModel() {
    return new WriteItemModel(this, 0)
  }
}

// interface ReadListOpts {
//   buf: Buffer
//   bufSpliceArr: SliceItem[]
//   len: number
// }

// export class BufReadListModel extends BufModel {
//   buf: Buffer
//   len: number
//   constructor(opts: ReadListOpts) {
//     super(opts.bufSpliceArr)
//     this.buf = opts.buf
//     this.len = opts.len
//   }

//   getWriteModel(index: number) {
//     return new WriteItemModel(this, index)
//   }
// }
