import { Transform, TransformOptions } from 'stream'
import logger from '../core/Logger'

interface Opts extends TransformOptions {
  delimiter: Buffer
}

export default class TransfromParser extends Transform {
  buffer = Buffer.alloc(0)
  delimiter: Buffer
  startChar = Buffer.from('68', 'hex')
  lenPosition = 10 // 数据域长度位置
  otherLen = 18 // 除数据域其他字节长度

  constructor(options: Opts) {
    super(options)

    if (options.delimiter === undefined) {
      throw new TypeError('"delimiter" is not a bufferable object')
    }

    if (options.delimiter.length === 0) {
      throw new TypeError('"delimiter" has a 0 or undefined length')
    }

    this.delimiter = Buffer.from(options.delimiter)
  }

  _transform(chunk, encoding, cb) {
    let data = Buffer.concat([this.buffer, chunk])
    let end = -1
    // logger.info('_transform', chunk.toString('hex'))

    while ((end = data.indexOf(this.delimiter)) !== -1) {
      const start = data.indexOf(this.startChar)

      if (start >= 0 && start < end) {
        const len = data.readUInt16BE(start + this.lenPosition) + this.otherLen // 数据域长度 + 其他数据位长度
        if (data.length >= len) {
          const endIndex = start + len
          const result = data.slice(start, endIndex)

          // 判断结束符位置是否正确
          if (
            result.lastIndexOf(this.delimiter) ===
            len - this.delimiter.length
          ) {
            this.push(result)
            data = data.slice(endIndex)
            continue
          }
        }
      }

      // 如果读取到结束帧，但结果不匹配，清除结束帧和前面的内容
      const flushEnd = end + this.delimiter.length
      data = data.slice(flushEnd)
    }

    this.buffer = data
    cb()
  }

  _flush(cb) {
    // logger.info('Parset _flush', this.buffer)
    this.push(this.buffer)
    this.buffer = Buffer.alloc(0)
    cb()
  }
}
