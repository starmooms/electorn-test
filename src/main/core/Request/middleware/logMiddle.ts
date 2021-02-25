import logger from '@/main/core/Logger'
import { Communi } from '@/main/core/Request/Communi'
import { BufWriteModel } from '@/main/utils/bufModel'
import { AGREEMENT } from '@/shared/model'

function bufToString(buf: Buffer) {
  return buf
    .toString('hex')
    .replace(/../g, $1 => `${$1} `)
    .trim()
}

export function showAll(buf: Buffer) {
  const bufModel = new BufWriteModel({
    model: AGREEMENT,
    readBuf: buf
  })
  bufModel.showAll()
}

export default function(communi: Communi) {
  communi.middleware.add(async (next, { opts, send }) => {
    // showAll(send.buf)
    const name = `${opts.control.name}[${send.sId}]`
    logger.debug(name, bufToString(send.buf))
    try {
      const result = await next()
      logger.debug(`${name} back`, bufToString(result.data.originBuf))
      return result
    } catch (err) {
      logger.error(`${name} err`, err.message)
      throw err
    }
  })
}
