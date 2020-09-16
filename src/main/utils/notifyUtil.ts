import ipcManage from '../core/IpcManage'

export default class NotifyUtil {
  status = false

  send(msg: string, type: string) {
    ipcManage.ipcNotify({
      type,
      title: '提示',
      message: msg
    })
  }

  notify(msg?: string) {
    if (this.status) {
      this.status = false
      if (msg) {
        this.send(msg, 'success')
      }
    }
  }

  error(msg: string) {
    if (!this.status) {
      this.status = true
      this.send(msg, 'error')
    }
  }
}
