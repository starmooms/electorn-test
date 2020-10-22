// const net = require('net')

// // '192.168.0.201', 5002
// const tcpServer = net.createServer(socket => {
//   console.log('链接成功')
//   socket.on('data', data => {
//     console.log('tcpserver 收到数据', data.toString('hex'))
//     // socket.write(Buffer.from('你好', 'utf-8'))
//     socket.write(
//       Buffer.from(
//         '68010100006885004078011f00000008000000000000030300004868000035980000000000000000000000002e0003000000000001030300003b80000039540000000000000000000000002e0003000000000002030300003aec000039970000000000000000000000002e0003000000000003030300003b99000039a30000000000000000000000002e0003000000000004030300004aaa000039160000000000000000000000002e0003000000000005030300003c5e00003ae70000000000000000000000002e0003000000000006030300003b1a000039160000000000000000000000002e000300000001000701000000822a00001bdf000000020000002b050000002e00010000000b000000000000000000000000000000000000000000000000000000000000008f6bedededed'
//       )
//     )
//   })
//   socket.on('error', err => {
//     console.log('错误tcpServer', err)
//   })
//   socket.on('end', () => {
//     console.log('关闭tcpServer')
//   })
// })
// tcpServer.listen(31111, '192.168.0.201')

// let tcpClient = null
// const a = () => {
//   tcpClient = net.createConnection(32222, '192.168.0.200')
//   tcpClient.on('data', data => {
//     console.log('tcpClient 收到数据', data.toString('hex'))
//   })
//   tcpClient.on('end', () => {
//     console.log('tpc client end')
//   })
//   tcpClient.on('error', err => {
//     console.error('TCP Client Error', err)
//   })
// }
