import { Communi } from '@/main/core/Request/Communi'
import { ERROR_STATUS } from '@/shared/config/port'
import mainDb from '@/main/core/sqlite/MainDb'
export declare type FilterNodeMethodFunction = (
  value: any,
  data: any,
  child: Node
) => boolean

export default function(communi: Communi) {
  communi.middleware.add(async (next, { opts }) => {
    const { requestType, masterId } = opts
    try {
      const result = await next()
      const { check, errCode } = result.data

      // 判断是否有错误信息
      if (!check) {
        throw new Error('通讯校验码错误')
      }

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
        const serialPort = communi.serialPort
        if (serialPort) {
          info += serialPort.path
          serialPort.handleError()
        }
      } else if (requestType === 'Tcp') {
        const tcpClient = communi.tpcRequest.getClient(masterId)
        if (tcpClient) {
          info += tcpClient.ip
        }
      } else {
        info += 'unkown device'
      }

      err.message = `${info} POST_ERROR ${err.message}`
      throw err
    }
  })
}
