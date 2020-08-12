import { Transform } from 'stream'
import logger from '../core/Logger'

export default class ProtocolParser extends Transform {
  constructor(options = {}) {
    super(options)

    // if (typeof options.length !== 'number') {
    //   throw new TypeError('"length" is not a number')
    // }

    // if (options.length < 1) {
    //   throw new TypeError('"length" is not greater than 0')
    // }

    // this.length = options.length
    // this.position = 0
    // this.buffer = Buffer.alloc(this.length)
  }

  _transform(chunk, encoding, cb) {
    logger.info('_transform', chunk)
    this.push(chunk)
    cb()
  }

  _flush(cb) {
    logger.info('_flush')
    // this.push(this.buffer.slice(0, this.position))
    cb()
  }
}
