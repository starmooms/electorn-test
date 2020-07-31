const crc16_ty = require('./crc16')

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

const data = 'hellowhellow'
const dataBuf = Buffer.from(data, 'ascii')
console.log(dataBuf, '数据域')

let dataBufLength = dataBuf.length.toString(16)
dataBufLength = PrefixZero(dataBufLength, 4)
const dataLenBuf = Buffer.alloc(2)
dataLenBuf.writeUIntBE('0x' + dataBufLength, 0, 2)
// console.log(dataBufLength, "长度")
console.log(dataLenBuf, '数据域长度')

const buf4 = Buffer.from([0x68, 0x03, 0x01, 0x00, 0x00, 0x68, 0xe1, 0x00])
const buf5 = Buffer.concat([buf4, dataBuf, dataLenBuf])
console.log(buf4, buf4.length)

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

console.log(crc16_ty(buf5).toString(16), 'crc16')

// https://www.yuque.com/u203312/vdb7mr/cqicrx
// https://github.com/donvercety/node-crc16
console.log(Buffer.from([0x12]))
console.log(Buffer.from('0x12'))
