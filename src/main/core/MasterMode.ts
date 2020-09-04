// import PortItem from './PortItem'
// import agreement, { CreateData } from './Agreement'
// import { BufWriteModel } from '../utils/ParsBuf'
// import {
//   PROTECT_ITEM_MODE,
//   PROTECT,
//   CONTROL_CODE
// } from '@/shared/config/master'
// import logger from './Logger'

// declare type CreateBuf = Omit<CreateData, 'slaverId' | 'type'>

// export default class MasterMode {
//   portItem: PortItem

//   constructor(portItem: PortItem) {
//     this.portItem = portItem
//   }

//   createBuf(data: CreateBuf) {
//     return agreement.createData({
//       slaverId: 0xff,
//       type: 0x01,
//       ...data
//     })
//   }

//   public async setProtect(data: any) {
//     const bufModel = new BufWriteModel(PROTECT_ITEM_MODE)
//     const bufWrite = bufModel.getWriteModel()
//     PROTECT.forEach(item => {
//       bufWrite.write(item.index, data.form[item.type])
//     })
//     const postData = this.createBuf({
//       code: CONTROL_CODE.protectSet,
//       masterId: 0xff,
//       data: Buffer.concat([Buffer.from([0x00, data.masterId]), bufModel.buf])
//     })
//     logger.info(postData)
//     await this.portItem.post({
//       data: postData
//     })
//   }
// }
