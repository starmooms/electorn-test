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

function showAll(buf: Buffer) {
  const bufModel = new BufWriteModel({
    model: AGREEMENT,
    readBuf: buf
  })
  bufModel.showAll()
}

export default function(communi: Communi) {
  communi.middleware.add(async (next, { opts, send }) => {
    showAll(send.buf)
    logger.debug(opts.control.name, bufToString(send.buf))
    const result = await next()
    return result
  })
}
