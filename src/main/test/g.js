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
