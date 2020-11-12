import { Transform, TransformOptions } from 'stream'
import agreement from '@/main/core/Agreement'

interface Opts extends TransformOptions {
  delimiter: Buffer
}

interface TransformImplements {
  push: (Buffer) => boolean
}

/** 转换模型 */
export class TransfromModel implements TransformImplements {
  buffer = Buffer.alloc(0)
  delimiter: Buffer = agreement.getEnd()
  startChar = Buffer.from('68', 'hex')
  lenPosition = 10 // 数据域长度位置
  otherLen = 18 // 除数据域其他字节长度
  _push?: TransformImplements['push']

  constructor(_push?: TransformImplements['push']) {
    this._push = _push
  }

  transform(chunk: Buffer, encoding?: string, cb?: any) {
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
    if (cb) {
      cb()
    }
  }

  flush(cb) {
    // logger.info('Parset _flush', this.buffer)
    this.push(this.buffer)
    this.buffer = Buffer.alloc(0)
    cb()
  }

  push(buf) {
    if (this._push) return this._push(buf)
    return true
  }

  clear() {
    this.buffer = Buffer.alloc(0)
  }
}

/** 串口解析器 */
export default class TransfromParser extends Transform {
  transformModel = new TransfromModel(this.push.bind(this))

  constructor(options: Opts) {
    super(options)
  }

  _transform(chunk, encoding, cb) {
    this.transformModel.transform(chunk, encoding, cb)
  }

  _flush(cb) {
    this.transformModel.flush(cb)
  }
}
