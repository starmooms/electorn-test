// const buf1 = Buffer.from('0616', 'hex')
// const buf3 = Buffer.from([12, 255])
// console.log(buf1)
// console.log(buf3)
// buf1.writeIntLE(0x18, )
// console.log(buf1)

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
