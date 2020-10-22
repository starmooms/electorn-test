import net from 'net'
import logger from '../Logger'
import { BufWriteModel as BufModel } from '@/main/utils/bufModel'
import { SAMP_MODEL } from '@/shared/model'

// '192.168.0.201', 5002
export default function tcpServe() {
  const tcpServer = net.createServer(socket => {
    console.log('链接成功')
    socket.on('data', data => {
      console.log('tcpserver 收到数据', data.toString('hex'))
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
      logger.info('len', writeModel.read('sampLen'))
      writeModel.ecahList('sampList', (wItem, index) => {
        const U = Math.floor(Math.random() * 100000)
        wItem.writer('slaverId', Math.floor(index / 8))
        wItem.writer('channelId', index % 8)
        wItem.writer('U', Math.floor(Math.random() * 100000))
        wItem.writer('I', Math.floor(Math.random() * 100000))
        if (U > 50000) {
          wItem.writer('errCode', '01')
        }
      })
      const resultBuf = Buffer.from(
        `6801010000688500${id}011f${writeModel.buf.toString(
          'hex'
        )}8f6bedededed`,
        'hex'
      )

      resultBuf.writeUInt16BE(writeModel.buf.length, 10)
      // logger.debug('流水号', id)
      // logger.info(resultBuf.toString('hex'))
      socket.write(resultBuf, err => {
        if (err) {
          logger.error('TcpServe Error', err)
        }
      })
    })
    socket.on('error', err => {
      console.log('错误tcpServer', err)
    })
    socket.on('end', () => {
      console.log('关闭tcpServer')
    })
  })
  tcpServer.listen(31111, '192.168.0.201')
}
