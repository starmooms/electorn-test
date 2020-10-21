// const path = require('path')

// const { EventEmitter } = require('events')

// class a extends EventEmitter {
//   constructor() {
//     super()
//   }

//   b() {
//     this.emit('bb')
//     setImmediate(() => {
//       console.log('bbend')
//     })
//   }
// }

// const b = new a()
// b.on('bb', async () => {
//   new Promise((resolve, reject) => {
//     setTimeout(() => {
//       console.log(33)
//     }, 2000)
//   })
// })

// b.b()

// const a = Buffer.alloc(4)
// a.writeFloatBE('-1.335', 0)
// console.log(a)

// console.log(a.readFloatBE(0).toFixed(6))

const str = '312e322e300000000000'
const b = Buffer.from(str, 'hex')
b.write('09', 'hex')
console.log(b.toString('hex'))
// b.writeUIntBE(1, 0)
// console.log(String(b) === '1.2.0')
// console.log(b.toString('ascii') === '1.2.0')
// console.log(b.toString('ascii').replace(/[^\x20-\x7E]+/g, ''))
// console.log(b.toString('ascii').replace(/(\x00)+$/g, '') === '1.2.0')
