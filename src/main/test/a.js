// const crc16_ty = require('./crc16')

// //10进制转16进制
// var x = 99999999;
// x = x.toString(16);
// console.log("16进制：", x);

// //16进制转10进制
// x = parseInt("68H", 16);
// console.log("10进制：", x);

/**
 * 自定义函数名：PrefixZero
 * @param num： 被操作数
 * @param n： 固定的总位数
 */
function PrefixZero(num, n) {
  return (Array(n).join(0) + num).slice(-n)
}

// console.log(dataBufLength, "16进制")
// console.log(parseInt("a", 16))

// console.log(dataLenBuf)

const data =
  'hellowhellowhellowhellowhellowhellowhellowhellowhellowhellowhellowhellowhellowhellowhellowhellowhellowhellowhellowhellowhellowhellowhellowhellowhellowhellowhellowhellowhellowhellowhellowhellowhellowhellowhellowhellowhellowhellowhellowhellowhellowhellowhellowhellowhellowhellowhellowhellowhellowhellowhellowhellowhellowhellowhellowhellowhellowhellowhellowhellowhellowhellowhellowhellowhellowhellowhellowhellowhellowhellowhellowhellowhellowhellowhellowhellowhellowhellowhellowhellowhellowhellowhellowhellowhellowhellowhellowhellowhellowhellowhellowhellowhellowhellowhellowhellowhellowhellowhellowhellowhellowhellowhellowhellow'
const dataBuf = Buffer.from(data, 'ascii')
// console.log(dataBuf, '数据域')

let dataBufLength = dataBuf.length.toString(16)
dataBufLength = PrefixZero(dataBufLength, 4)
const dataLenBuf = Buffer.alloc(2)
dataLenBuf.writeUIntBE('0x' + dataBufLength, 0, 2)

console.log(dataBuf.length, '长度')
console.log(dataLenBuf, '数据域长度')

// function crc16(buf) {
//   var crc = 0xFFFF;
//   for (var i = 0; i < buf.length; i++) {
//     crc = (crc >> 8) ^ buf[i];
//     for (var j = 0; j < 8; j++) {
//       var temp = crc & 0x01;
//       crc >>= 0x0001;
//       if (temp == 0x01) {
//         crc ^= 0xA001;
//       }
//     }
//   }
//   return crc;
// }
// var crc = crc16(buf5);
// console.log(crc.toString(16).toUpperCase(), "crc16");

function crc16(buf) {
  let crc = 0xffff
  for (let i = 0; i < buf.length; i++) {
    crc = crc ^ buf[i]
    for (let j = 0; j < 8; j++) {
      const temp = crc & 0x0001
      crc >>= 1
      if (temp) {
        crc ^= 0xa001
      }
    }
  }
  return crc & 0xff
}

const buf4 = Buffer.from([
  0x68,
  0x03,
  0x01,
  0xff,
  0xff,
  0x68,
  0xe1,
  0x00,
  0x00,
  0x00
])
const buf5 = Buffer.concat([buf4, dataLenBuf, dataBuf])
// console.log('buf5', buf5)
// console.log(crc16_ty(buf5).toString(16), 'crc16')
const crc16Buf = Buffer.alloc(2)
crc16Buf.writeUIntBE(`0x${crc16(buf5).toString(16)}`, 0, 2)
const buf6 = Buffer.concat([buf5, crc16Buf, Buffer.from([0x16])])
console.log('包内容', buf6)

function getResult(s, l = 2) {
  return `${PrefixZero(s.toString(16), l)}`
}

// function getArrResult(arr) {
//   let s = ''
//   arr.forEach(i => {
//     s += getResult(i)
//   })
//   return s
// }

function getBufResults(b) {
  let s = ''
  for (let i = 0; i < b.length; i++) {
    s += ` ${getResult(b[i])}`
  }
  return s
}

const buf88 = Buffer.from(
  '6801010000688500061f0063000008000002000c220000000000000001000000080000000a0000000202000d8dfffffffe00000003000000020000000000000004000000020000000e00000005000000010000000100000006000000020000001900000007000000020000001d0000bb36edededed',
  'hex'
)

function showDetails(result) {
  console.log('帧起始符：', getResult(result[0]))
  console.log('从机类型：', getResult(result[1]))
  console.log('版本号：', getResult(result[2]))
  console.log('地址 主控：', getResult(result[3]))
  console.log('地址 从控：', getResult(result[4]))
  console.log('帧起始符：', getResult(result[5]))
  console.log('控制码：', getResult(result[6]))
  console.log('错误码：', getResult(result[7]))
  console.log('流水号：', getBufResults([result[8], result[9]]))
  console.log('数据域长度', getBufResults([result[10], result[11]]))
  // console.log(parseInt(`${result[10]}${result[11]}`, 10))
  const n = parseInt(result.slice(10, 12).toString('hex'), 16)
  const sIndex = 12 + n
  const data = result.slice(12, sIndex)
  console.log('数据域：', getBufResults(data), data.toString('hex'))
  // console.log('校验码：', getBufResults([result[sIndex], result[sIndex + 1]]))
  // console.log('帧结束符：', getResult(result[sIndex + 2]))
}
showDetails(buf88)

function FixZero(num, n) {
  return (Array(n).join('0') + num).slice(-n)
}

function toHex(num, n) {
  return FixZero(num.toString(16), n * 2)
}

function readData(buf) {
  const dataLen = buf.readUInt16BE(10) //parseInt(buf.slice(10, 12).toString('hex'), 16)
  console.log('read数据域长度', dataLen)
  const dataEndLen = dataLen + 12
  const checkBuf = buf.slice(0, dataEndLen)
  const crc16Buf = buf.readUInt16BE(dataEndLen)
  console.log('read校验码', toHex(crc16Buf, 2))
  if (crc16(checkBuf) === crc16Buf) {
    console.log('校验成功')
  }
}

readData(buf6)

// // https://www.yuque.com/u203312/vdb7mr/cqicrx
// // https://github.com/donvercety/node-crc16
// console.log(Buffer.from([0x12]))
// console.log(Buffer.from('0x12'))
