import { Transform, TransformOptions } from 'stream'

interface Opts extends TransformOptions {
  delimiter: Buffer
}

export default class TransfromParser extends Transform {
  buffer = Buffer.alloc(0)
  dataLen = 0
  delimiter: Buffer

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
    let canWhile = true
    while (data.indexOf(this.delimiter) !== -1 && canWhile) {
      const len = data.readInt16BE(10) + 18 // 数据域长度 + 其他数据位长度
      if (data.length >= len) {
        this.push(data.slice(0, len))
        data = data.slice(len)
      } else {
        canWhile = false // 存在符合的结束符，但按数据域读取读取buf，buf字节不够
      }
    }
    this.buffer = data
    cb()
  }

  _flush(cb) {
    this.push(this.buffer)
    this.buffer = Buffer.alloc(0)
    this.dataLen = 0
    cb()
  }
}
