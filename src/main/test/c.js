// const dayjs = require('dayjs')

// // 当天时间戳
// console.log(
//   dayjs()
//     .startOf('day')
//     .unix()
// )

// const now = dayjs()
// const today = now.startOf('day').unix()
// const nowUnix = now.unix()
// console.log(today, nowUnix)

// const last15 = dayjs()
//   .subtract(15, 'minute')
//   .unix()
// console.log(nowUnix - last15)

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

let data = Buffer.from(
  '01010000edededededededed6800180000000099a0edededed68010100006800180000000099a0edededed68010100006800180000000099a0edededed68010100006800180000000099a0edededed68010100006800180000000099a0edededed68010100006800180000000099a0edededed68010100006800180000000099a0edededed68010100006800180000000099a0edededed68010100006800180000000099a0edededed68010100006800180000',
  'hex'
)
// const b = Buffer.from('edededed', 'hex')
// const c = a.indexOf(b) + b.length
// console.log(a.indexOf(b) + b.length)
// console.log(a.slice(1, 6))
// console.log(a.readInt16BE(10), a.length)
// console.log(a.slice(12336))
// console.log(a.slice(12336).length)
let end = -1
const startChar = Buffer.from('68', 'hex')
const delimiter = Buffer.from('edededed', 'hex')
while ((end = data.indexOf(delimiter)) !== -1) {
  const start = data.indexOf(startChar)
  // console.log('start', start)
  // console.log('end', end)
  if (start >= 0 && start < end) {
    const len = data.readUInt16BE(start + 10) + 18 // 数据域长度 + 其他数据位长度
    // console.log('len', len)
    if (data.length >= len) {
      const endIndex = start + len
      console.log(data.slice(start, endIndex))
      const result = data.slice(start, endIndex)
      console.log(
        'lastIndex',
        result.lastIndexOf(delimiter) === len - delimiter.length
      )
      data = data.slice(endIndex)
      continue
    }
  }

  // 如果读取到结束帧，当起始不是68，清除结束帧前面的内容
  const flushEnd = end + delimiter.length
  console.log('flushEnd', flushEnd)
  data = data.slice(flushEnd)
  console.log('flshData', data)
}
console.log(data, 'data')
