const { EventEmitter } = require('events')

class a extends EventEmitter {
  constructor() {
    super()
  }

  b() {
    this.emit('bb')
    setImmediate(() => {
      console.log('bbend')
    })
  }
}

const b = new a()
b.on('bb', async () => {
  new Promise((resolve, reject) => {
    setTimeout(() => {
      console.log(33)
    }, 2000)
  })
})

b.b()
