import { Communi } from '@/main/core/Request/Communi'
import { ERROR_STATUS } from '@/shared/config/port'
import mainDb from '@/main/core/sqlite/MainDb'

export default function(communi: Communi) {
  communi.middleware.add(async (next, { opts }) => {
    const { requestType, masterId } = opts
    try {
      const result = await next()
      // 判断是否有错误信息
      const { check, errCode } = result.data
      if (!check) throw new Error('通讯校验码错误')
      if (errCode !== '00') {
        const errMsg = ERROR_STATUS[errCode] || errCode
        mainDb.saveErrorList([
          {
            masterId,
            slaverIds: '',
            channelIds: '',
            type: 1,
            action: opts.control.name,
            errCode: errCode
          }
        ])
        throw new Error(`Error_Code ${errMsg}`)
      }

      return result
    } catch (err) {
      // 错误处理
      let info = ''
      if (requestType === 'Port') {
        info += communi.serialPort!.path
        if (communi.serialPort) communi.serialPort.handleError()
      } else if (requestType === 'Tcp') {
        const tcpClient = communi.tpcRequest.getClient(masterId)
        if (tcpClient) {
          info += tcpClient.ip
        }
      }
      err.message = `${info} POST_ERROR ${err.message}`
      throw err
    }
  })
}
