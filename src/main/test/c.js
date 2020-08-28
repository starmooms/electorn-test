const dayjs = require('dayjs')

// // 当天时间戳
// console.log(
//   dayjs()
//     .startOf('day')
//     .unix()
// )

const now = dayjs()
const today = now.startOf('day').unix()
const nowUnix = now.unix()
console.log(today, nowUnix)

const last15 = dayjs()
  .subtract(15, 'minute')
  .unix()
console.log(nowUnix - last15)

// const key = '0_0_*'
// console.log('del started for key: ', key)
// const Redis = require('ioredis')

// const redis = new Redis({
//   port: 6379, // Redis port
//   host: '127.0.0.21', // Redis host
//   family: 4 // 4 (IPv4) or 6 (IPv6)
// })

// return new Promise((resolve, reject) => {
//   const stream = redis.scanStream({
//     // only returns keys following the pattern of "key"
//     match: key,
//     // returns approximately 100 elements per call
//     count: 100
//   })

//   stream.on('data', function(resultKeys) {
//     if (resultKeys.length) {
//       console.log(resultKeys)
//       redis.del(resultKeys) //from version 4 use unlink instead of del
//     } else {
//       console.log('nothing found')
//     }
//   })
//   stream.on('end', function(resultKeys) {
//     console.log('end')
//     resolve()
//   })
// })
