import net from 'net'
import logger from '../Logger'
import { BufWriteModel as BufModel } from '@/main/utils/bufModel'
import { SAMP_MODEL } from '@/shared/model'
import { TransfromModel } from '@/main/utils/transfromParser'

let socketSend: net.Socket
const sendSamp = (data: Buffer) => {
  // socket.write(Buffer.from('你好', 'utf-8'))
  const id = data.slice(8, 8 + 2).toString('hex')
  const sampLen = 256
  const writeModel = new BufModel({
    model: SAMP_MODEL,
    listLen: {
      sampList: sampLen,
      errorList: 0,
      startList: 0,
      endList: 0,
      featureList: 0
    }
  })
  writeModel.writer('sampLen', sampLen)
  // writeModel.writer('endLen', 10)
  // writeModel.writer('featureLen', 255)

  // logger.info('sampLen', writeModel.read('sampLen'))
  // logger.info('featureLen', writeModel.read('featureLen'))
  writeModel.ecahList('sampList', (wItem, index) => {
    const r = Math.floor(Math.random() * 10000)
    const U = r
    wItem.writer('slaverId', Math.floor(index / 8))
    wItem.writer('channelId', index % 8)
    wItem.writer('U', U)
    wItem.writer('I', r)
    wItem.writer('vol', r)
    wItem.writer('epower', r)
    wItem.writer('projectId', 120)
    wItem.writer('loopNum', 1)
    wItem.writer('stepId', 0)
    wItem.writerHex('workerCode', '00')
    // if (U > 50000) {
    //   wItem.writer('errCode', '01')
    // }
  })
  writeModel.ecahList('endList', (wItem, index) => {
    const U = Math.floor(Math.random() * 100000)
    wItem.writer('slaverId', Math.floor(index / 8))
    wItem.writer('channelId', index % 8)
    wItem.writer('U', U)
    wItem.writer('I', Math.floor(Math.random() * 100000))
    wItem.writer('vol', Math.floor(Math.random() * 100000))
    wItem.writer('epower', Math.floor(Math.random() * 100000))
    wItem.writer('projectId', 120)
    wItem.writer('loopNum', 1)
    wItem.writer('stepId', 0)
    wItem.writer('stepTime', 6666)
    wItem.writerHex('workerCode', 'a1')
    wItem.writerHex('endCode', '01')
    // if (U > 50000) {
    //   wItem.writer('errCode', '01')
    // }
  })
  writeModel.ecahList('featureList', (wItem, index) => {
    const U = Math.floor(Math.random() * 100000)
    const slaverId = Math.floor(index / 8)
    wItem.writer('slaverId', slaverId)
    wItem.writer('channelId', index % 8)
    wItem.writer('U', U)
    wItem.writer('I', Math.floor(Math.random() * 100000))
    wItem.writer('vol', Math.floor(Math.random() * 100000))
    wItem.writer('epower', Math.floor(Math.random() * 100000))
    wItem.writer('projectId', 120)
    wItem.writer('loopNum', 1)
    wItem.writer('stepId', 0)
    wItem.writer('stepTime', 6666)
    wItem.writerHex('workerCode', 'a1')
    wItem.writer('featureType', (slaverId % 5) + 1)
    // logger.info(slaverId, 'd:', (slaverId % 5) + 1)
    // if (U > 50000) {
    //   wItem.writer('errCode', '01')
    // }
  })
  // logger.info('end')

  const resultBuf = Buffer.from(
    `6801010000688500${id}011f${writeModel.buf.toString('hex')}8f6bedededed`,
    'hex'
  )

  resultBuf.writeUInt16BE(writeModel.buf.length, 10)
  console.log('tcpServer返回', id)
  // logger.debug('流水号', id)
  // logger.info(resultBuf.toString('hex'))
  if (socketSend) {
    socketSend.write(resultBuf, err => {
      if (err) {
        logger.error('TcpServe Error', err)
      }
    })
  }
}

const onData = data => {
  sendSamp(data)
  return true
}

const transfromModel = new TransfromModel(onData)

// '192.168.0.201', 5002
export default function tcpServe() {
  const tcpServer = net.createServer(socket => {
    console.log('链接成功')
    socketSend = socket
    socket.on('data', data => {
      console.log('tcpserver 收到数据', data.toString('hex'))
      transfromModel.transform(data)
      // sendSamp(socket, data)
    })
    socket.on('error', err => {
      console.log('错误tcpServer', err)
    })
    socket.on('end', () => {
      console.log('关闭tcpServer')
    })
  })
  tcpServer.listen(31111, '192.168.0.93')
}
