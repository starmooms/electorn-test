// node --expose-gc gc.js

const showGc = () => {
  global.gc()
  console.log(process.memoryUsage().heapUsed)
}

const delay = () => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(1)
    }, 1000)
  })
}

const next = async () => {
  const data = new Array(5 * 1024 * 1024)
  await delay()
  showGc()
  console.log(data)

  // // // 1   // start不会等待，GC不会一直增加
  // next()

  // // 2  // start不会等待，GC不会一直增加
  // next()
  // return

  // // 3    // start会一直等待，GC不会一直增加
  // return next()

  // // 4  // start会一直等待，GC会一直增加 !!
  // return await next()
}

const start = async () => {
  await next()
  console.log('start end')
}

start()
