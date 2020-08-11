import { ipcRenderer, ipcMain } from 'electron'
import Vue from 'vue'
import { eventNames } from 'process'

interface EmitList {
  [eventName: string]: {
    [id: string]: (...args: any[]) => any
  }
}

interface Register {
  eventName: string
  onEmit: (...args: any[]) => any
  vm?: Vue
}

class Command {
  emitList: EmitList = {}
  setId = 0

  constructor() {
    this.init()
  }

  errorMsg(msg: string) {
    Vue.prototype.$message.error(msg)
  }

  init() {
    ipcRenderer.on('errorMsg', (event, msg) => {
      this.errorMsg(msg)
    })
    ipcRenderer.on('ipcManage:send', (event, eventName, ...args) => {
      const emitMap = this.emitList[eventName]
      if (emitMap) {
        Object.keys(emitMap).forEach(key => {
          emitMap[key](...args)
        })
      }
    })
  }

  register({ eventName, onEmit, vm }: Register) {
    const emitItem = this.emitList[eventName]
    const newId = ++this.setId
    if (emitItem) {
      emitItem[newId] = onEmit
    } else {
      this.emitList[eventName] = {
        [newId]: onEmit
      }
    }

    const unRegister = () => {
      this.unRegister(eventName, newId)
    }
    if (vm && vm instanceof Vue) {
      vm.$on('hook:beforeDestroy', () => {
        console.log('销毁')
        unRegister()
      })
    }

    return {
      id: newId,
      unRegister
    }
  }

  unRegister(eventName: string, eventId: number) {
    const emitItem = this.emitList[eventName]
    if (emitItem) {
      if (emitItem[eventId]) {
        delete emitItem[eventId]
      }
      if (Object.keys(emitItem).length === 0) {
        delete this.emitList[eventName]
      }
    }
  }

  send(eventName: string, ...args: any[]) {
    ipcRenderer.send(eventName, ...args)
  }

  async invoke(name: string, ...args: any[]) {
    try {
      return await ipcRenderer.invoke(name, ...args)
    } catch (err) {
      this.errorMsg(err)
      return { status: false }
    }
  }

  on({ eventName, onEmit, vm }: Register) {
    ipcRenderer.on(eventName, (event, data) => {
      onEmit(data, event)
    })
    const unRegister = () => {
      ipcRenderer.removeListener(eventName, onEmit)
    }
    if (vm && vm instanceof Vue) {
      vm.$on('hook:beforeDestroy', () => {
        unRegister()
      })
    }
    return {
      unRegister
    }
  }

  install(vue: typeof Vue) {
    vue.prototype.$command = this
  }
}

const command = new Command()

declare module 'vue/types/vue' {
  interface Vue {
    $command: Command
  }
}

export default command
