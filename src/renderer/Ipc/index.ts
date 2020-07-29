import { ipcRenderer } from 'electron'
import Vue from 'vue'
import { eventNames } from 'process'

const emitList: any = {}

ipcRenderer.on('errorMsg', (event, msg) => {
  Vue.prototype.$message.error(msg)
})

ipcRenderer.on('ipcManage:send', (event, eventName, ...args) => {
  const emitArr = emitList[eventName]
  if (emitArr) {
    emitArr.forEach((emit: any) => {
      emit(...args)
    })
  }
})

export const setEmit = (eventName: string, cb) => {
  const emitArr: any[] = emitList[eventName]
  let index = 0
  if (emitArr) {
    index = emitArr.push(cb) - 1
  } else {
    emitList[eventName] = [cb]
  }

  return () => {
    const emitArr = emitList[eventName]
    emitArr.splice(index, 1)
    if (emitArr.length === 0) {
      delete emitList[eventName]
    }
  }
}
