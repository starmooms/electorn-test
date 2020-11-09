console.time()
let g = 1
for (let i = 0; i < 5000; i++) {
  g += i
}
console.log(g)
console.timeEnd()
