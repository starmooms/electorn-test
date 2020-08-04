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
