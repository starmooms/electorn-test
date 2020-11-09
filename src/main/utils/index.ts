/**
 * @param num： 被操作数
 * @param n： 固定的总位数
 */
export function FixZero(num: string | number, n: number) {
  return (Array(n).join('0') + num).slice(-n)
}

/**
 * 10进制转换为16进制
 * @param num 数字
 * @param n 字节数
 */
export function toHex(num: number, n: number) {
  return FixZero(num.toString(16), n * 2)
}

/**
 * 字节填充方法, 返回字节填充0的字符串数组
 * @params 依次传入字节数
 *  */
export function bytFull(...args: number[]) {
  const result: string[] = []
  for (let i = 0; i < args.length; i++) {
    result.push(Array(args[i] * 2 + 1).join('0'))
  }
  return result
}

/**
 *  将buf切割成buf数组
 * @param buf
 * @param spliceArr
 */
export function sliceBuf(buf: Buffer, spliceArr: number[]) {
  const result: Buffer[] = []
  let index = 0
  for (let i = 0; i < spliceArr.length; i++) {
    result.push(buf.slice(index, spliceArr[i] + index))
    index += spliceArr[i]
  }
  return result
}

declare type sliceItem =
  | number
  | {
      byte: number
      hasSigned?: boolean
    }
/**
 *  将buf切割成二进制数组
 * @param buf
 * @param spliceArr
 */
export function sliceBufFormNum(buf: Buffer, spliceArr: sliceItem[]) {
  const result: number[] = []
  let index = 0
  for (let i = 0; i < spliceArr.length; i++) {
    let byte = 0
    let hasSigned = false
    const item = spliceArr[i]
    if (typeof item === 'number') {
      byte = item
    } else {
      byte = item.byte
      hasSigned = item.hasSigned || false
    }
    const data = hasSigned
      ? buf.readIntBE(index, byte)
      : buf.readUIntBE(index, byte)
    result.push(data)
    index += byte
  }
  return result
}

/** ascii字符过滤 */
export function replaceAscii(str: string) {
  // return str.replace(/[^\x20-\x7E]+/g, '')
  return str.replace(/(\x00)+$/g, '') // eslint-disable-line
}
