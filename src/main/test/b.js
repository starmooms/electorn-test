// const buf1 = Buffer.from('0616', 'hex')
// const buf3 = Buffer.from([12, 255])
// console.log(buf1)
// console.log(buf3)
// buf1.writeIntLE(0x18, )
// console.log(buf1)

const Bluebird = require('bluebird')

// const buf1 = Buffer.from('0016', 'hex')
// console.log(`${buf1[0]}${buf1[1]}`)
// const buf2 = Buffer.alloc(2)
// buf2.writeInt16BE(254)
// console.log(buf2)

// const end = Buffer.from([0x00, 0x00, 0x16])
// end.writeUIntBE(256, 0, 2)
// console.log(end, end.readUInt16BE(0))

// const buf = Buffer.alloc(3)
// buf.writeUIntBE(3, 1, 1)
// buf.writeUIntBE(6, 2, 1)
// console.log(buf)

// function spliceBuf(buf, ...args) {
//   const result = []
//   let index = 0
//   for (let i = 0; i < args.length; i++) {
//     console.log(index, args[i])
//     result.push(buf.slice(index, args[i] + index))
//     index += args[i]
//   }
//   return result
// }

// const r = spliceBuf(Buffer.from([0x01, 0x02, 0x03, 0x04, 0x05, 0xff]), 1, 2, 3)
// console.log(r)

// function sliceBufFormNum(buf, spliceArr) {
//   const result = []
//   let index = 0
//   for (let i = 0; i < spliceArr.length; i++) {
//     let byte = 0
//     let hasSigned = false
//     const item = spliceArr[i]
//     if (typeof item === 'number') {
//       byte = item
//     } else {
//       byte = item.byte
//       hasSigned = item.hasSigned || false
//     }
//     console.log(index, byte)
//     const data = hasSigned
//       ? buf.readIntBE(index, byte)
//       : buf.readUIntBE(index, byte)
//     result.push(data)
//     index += byte
//   }
//   return result
// }

// const buf = Buffer.from([20, 40, -40, 40])
// console.log(buf)
// const r = sliceBufFormNum(buf, [1, 1, { byte: 1, hasSigned: true }, 1])
// console.log(r)

// const a = Buffer.from([
//   104,
//   1,
//   1,
//   0,
//   0,
//   104,
//   195,
//   0,
//   0,
//   0,
//   11,
//   0,
//   0,
//   0,
//   0,
//   0,
//   0,
//   0,
//   0,
//   0,
//   0,
//   0,
//   0,
//   101,
//   81
// ])
// console.log(a)

// const a = Buffer.from([
//   0x68,
//   0x01,
//   0x01,
//   0x00,
//   0x00,
//   0x68,
//   0xc3,
//   0x00,
//   0x00,
//   0x09,
//   0x00,
//   0x0b
// ])

// console.log(a[11])

// console.log(a.readUInt16BE(10))

// function intToFloat(number) {
//   number = ~-(number + 1)
//   console.log(number)

//   if (number < 0) {
//     number += Math.pow(2, 32)
//   }
//   console.log(number)
//   const float = Buffer.from(number.toString(16), 'hex').readFloatBE(0)

//   const significantDigits = 5
//   return parseFloat(float.toFixed(significantDigits))
// }
// intToFloat(1.4)

// const a = Buffer.alloc(4)
// a.writeFloatBE(1.11111, 0)
// console.log(a)
// console.log(a.readFloatBE(0))

// const a = Buffer.alloc(8)
// a.writeDoubleBE(1.4, 0)
// console.log(a)
// console.log(a.readDoubleBE(0))

// const a = Buffer.from([0x00])
// console.log(a.toString('hex'))

// const a = '01000010'
// const c = parseInt(a, 2)
// const d = Buffer.alloc(1)
// d.writeIntBE(c, 0, 1)
// console.log(d)

// function readData(buf) {
//   const dataStart = 12
//   const dataLen = buf.readUInt16BE(10)
//   const dataEndLen = dataLen + dataStart
//   console.log(buf.slice(dataStart, dataEndLen).toString('hex'))
//   return {
//     buf: buf.slice(dataStart, dataEndLen)
//     // sId: toHex(buf.readUInt16BE(8), 2)
//   }
// }
// readData(
//   Buffer.from(
//     '68010100006885000002006300000800000200000000000000000000010200000affffff9c0000000202000014ffffff38000000030200001efffffed40000000402000028fffffe700000000502000032fffffe0c000000060200003cfffffda80000000702000046fffffd4400006667edededed',
//     'hex'
//   )
// )

// const arr1 = [0, 30]
// console.time()
// let result = 0
// arr1.forEach(num => {
//   result |= 1 << num
// })
// console.log(result.toString('2'))
// console.timeEnd()

// console.time()
// const bytArr = Array(32).fill(0)
// arr1.forEach(item => {
//   bytArr[item] = 1
// })
// console.log(
//   bytArr
//     .reverse()
//     .join('')
//     .toString('2')
// )
// console.timeEnd()

// console.time()
// const bytArr2 = Array(32).fill(0)
// for (let i = 0; i <= arr1.length; i++) {
//   bytArr2[arr1[i]] = 1
// }
// console.log(
//   bytArr2
//     .reverse()
//     .join('')
//     .toString('2')
// )
// console.timeEnd()

const p = () => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // if (i === 2) {
      //   reject('ddd')
      // }
      reject('33')
    }, 1000)
  })
}

Bluebird.mapSeries([1, 2, 31, 45], async i => {
  await p()
  console.log(i)
})
