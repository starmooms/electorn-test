interface ListItem {
  readonly id: number
  readonly name: string
}
interface ChannelNumItem {
  readonly num: number
  readonly name: string
}
interface ChannelNum {
  [key: string]: ChannelNumItem
}

/** 通道数量控制 */
export const CHANNEL_NUM: ChannelNum = {
  master: {
    num: 20,
    name: '机柜'
  },
  slaver: {
    num: 32,
    name: '丛控'
  },
  channel: {
    num: 8,
    name: '通道'
  }
}

/** 生成各列表 */
const getList = (numItem: ChannelNumItem) => {
  const list: ListItem[] = []
  for (let i = 0; i < numItem.num; i++) {
    list.push({
      name: `${numItem.name}${i + 1}`,
      id: i
    })
  }
  return list
}

/** 获取静态通道列表 */
export const getStaticChList = () => {
  return {
    master: getList(CHANNEL_NUM.master),
    slaver: getList(CHANNEL_NUM.slaver),
    channel: getList(CHANNEL_NUM.channel)
  }
}
