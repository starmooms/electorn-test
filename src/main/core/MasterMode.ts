import PortItem from './PortItem'

interface data {
  getU(s: string): string
}

export default class MasterMode implements data {
  portItem: PortItem

  constructor(portItem: PortItem) {
    this.portItem = portItem
  }

  setProtect(data: any) {
    this.portItem.port({})
  }
}
