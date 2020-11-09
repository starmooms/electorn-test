// // 科学计算法转换为字符串
// const toNonExponential = num => {
//   const m = num.toExponential().match(/\d(?:\.(\d*))?e([+-]\d+)/)
//   return num.toFixed(Math.max(0, (m[1] || '').length - m[2]))
// }

// // 加
// function floatAdd(arg1, arg2) {
//   let r1, r2, m
//   try {
//     r1 = arg1.toString().split('.')[1].length
//   } catch (e) {
//     r1 = 0
//   }
//   try {
//     r2 = arg2.toString().split('.')[1].length
//   } catch (e) {
//     r2 = 0
//   }
//   m = Math.pow(10, Math.max(r1, r2))
//   return (floatMultiply(arg1, m) + floatMultiply(arg2, m)) / m
// }

// // 减
// function floatSub(arg1, arg2) {
//   let r1, r2, m, n
//   try {
//     r1 = arg1.toString().split('.')[1].length
//   } catch (e) {
//     r1 = 0
//   }
//   try {
//     r2 = arg2.toString().split('.')[1].length
//   } catch (e) {
//     r2 = 0
//   }
//   m = Math.pow(10, Math.max(r1, r2))
//   // 动态控制精度长度
//   n = r1 >= r2 ? r1 : r2
//   return ((floatMultiply(arg1, m) - floatMultiply(arg2, m)) / m).toFixed(n)
// }

// // 乘
// function floatMultiply(arg1, arg2) {
//   if (arg1 == null || arg2 == null) {
//     return null
//   }
//   arg1 = toNonExponential(arg1)
//   arg2 = toNonExponential(arg2)
//   let n1, n2
//   let r1, r2 // 小数位数
//   try {
//     r1 = arg1.toString().split('.')[1].length
//   } catch (e) {
//     r1 = 0
//   }
//   try {
//     r2 = arg2.toString().split('.')[1].length
//   } catch (e) {
//     r2 = 0
//   }
//   n1 = Number(arg1.toString().replace('.', ''))
//   n2 = Number(arg2.toString().replace('.', ''))
//   return (n1 * n2) / Math.pow(10, r1 + r2)
// }

// // 除
// function floatDivide(arg1, arg2) {
//   if (arg1 == null) {
//     return null
//   }
//   if (arg2 == null || arg2 == 0) {
//     return null
//   }
//   arg1 = toNonExponential(arg1)
//   arg2 = toNonExponential(arg2)
//   let n1, n2
//   let r1, r2 // 小数位数
//   try {
//     r1 = arg1.toString().split('.')[1].length
//   } catch (e) {
//     r1 = 0
//   }
//   try {
//     r2 = arg2.toString().split('.')[1].length
//   } catch (e) {
//     r2 = 0
//   }
//   n1 = Number(arg1.toString().replace('.', ''))
//   n2 = Number(arg2.toString().replace('.', ''))
//   return floatMultiply(n1 / n2, Math.pow(10, r2 - r1))
//   // return (n1 / n2) * Math.pow(10, r2 - r1)
// }

// console.log(floatDivide(0.0033, 100))
// console.log(floatDivide(170890000, 380026238.96999997))
// console.log(floatDivide(2.3, 100000))
