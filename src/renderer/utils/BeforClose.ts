import { remote } from 'electron'

class BeofreClose {
  events = new Set<any>()
  constructor() {
    console.log('??')
    this.init()
  }

  init() {
    window.addEventListener('beforeunload', this.handleEvents)
  }

  handleEvents = (e: any, ...args) => {
    console.log(e)
    console.log(args)
    if (this.events.size > 0) {
      // setTimeout(() => {
      //   alert('3')
      //   window.removeEventListener('beforeunload', this.handleEvents)
      //   win.close()
      // }, 1000)
      setTimeout(() => {
        this.handle()
      }, 1000)
      e.returnValue = false

      // setTimeout(() => {

      //   this.events.values()
      //   win.close()
      // })
      // e.returnValue = false
    }
  }

  async handle() {
    const win = remote.getCurrentWindow()
    await Promise.all(Array.from(this.events).map(fun => fun()))
    window.removeEventListener('beforeunload', this.handleEvents)
    console.log(win)
    win.close()
  }

  on(cb: any) {
    this.events.add(cb)
  }

  off(cb: any) {
    this.events.delete(cb)
  }
}
const beforeClose = new BeofreClose()
export default beforeClose
