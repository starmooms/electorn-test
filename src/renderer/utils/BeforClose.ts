import command from '../command'

/** 全局关闭回调 */
class BeofreClose {
  events = new Set<any>()
  constructor() {
    this.init()
  }

  /** 监听关闭事件 */
  init() {
    command.on({
      eventName: '/win/close',
      onEmit: data => {
        this.handleEvents(data)
      }
    })
  }

  /** 触发窗口关闭前 */
  async handleEvents(data: any) {
    if (this.events.size > 0) {
      try {
        await Promise.all(Array.from(this.events).map(fun => fun()))
      } catch (err) {
        console.error(err)
        alert(err)
      }
    }
    command.send('/win/closed', data)
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
