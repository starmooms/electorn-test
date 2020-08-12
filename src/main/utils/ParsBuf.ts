interface SliceItemData {
  byte: number
  hasSigned: boolean
}

declare type SliceItem = number | SliceItemData

export default class ParsBuf {
  sliceArr: SliceItemData[]
  bufLength: number

  constructor(bufSpliceArr: SliceItem[]) {
    this.bufLength = 0
    this.sliceArr = bufSpliceArr.map(item => {
      if (typeof item === 'number') {
        this.bufLength += item
        return {
          byte: item,
          hasSigned: false
        }
      } else {
        this.bufLength += item.byte
        return item
      }
    })
  }
}
