import { toHex } from '.'

interface SliceItemData {
  byte: number
  hasSigned: boolean
}

interface SliceData extends SliceItemData {
  offset: number
}

declare type SliceItem = number | SliceItemData

class BufData {
  bufModel: BufModel
  buf: Buffer
  // declare getIndex(index:number, <T>hex:boolean=>T ? String : Boolean

  constructor(bufModel: BufModel, buf: Buffer) {
    this.bufModel = bufModel
    this.buf = buf
  }

  getIndex(index: number, hex = false) {
    const sliceItem = this.bufModel.sliceData[index]
    if (!sliceItem) {
      throw new Error(`BufModel ${index} no defined`)
    }
    const { hasSigned, offset, byte } = sliceItem
    const data = hasSigned
      ? this.buf.readIntBE(offset, byte)
      : this.buf.readUIntBE(offset, byte)
    return hex ? toHex(data, byte) : data
  }
}

/** Buffer 数据模型 */
export default class BufModel {
  sliceData: SliceData[]
  bufLength: number

  constructor(bufSpliceArr: SliceItem[]) {
    this.bufLength = 0
    this.sliceData = bufSpliceArr.map(item => {
      const dataItem = {
        byte: 1,
        hasSigned: false,
        offset: this.bufLength
      }
      if (typeof item === 'number') {
        dataItem.byte = item
        this.bufLength += item
      } else {
        dataItem.byte = item.byte
        dataItem.hasSigned = item.hasSigned
        this.bufLength += item.byte
      }
      return dataItem
    })
  }

  getBufData(buf: Buffer) {
    return new BufData(this, buf)
  }
}
