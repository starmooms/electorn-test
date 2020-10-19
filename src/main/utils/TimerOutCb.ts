export default class TimerOutCb {
  timer!: NodeJS.Timeout
  ms: number
  cb: any
  constructor(ms: number, cb: any) {
    this.ms = ms
    this.cb = cb
  }

  setTimer() {
    this.clearTimer()
    this.timer = setTimeout(() => {
      this.cb()
    }, this.ms)
  }

  clearTimer() {
    clearTimeout(this.timer)
  }
}
