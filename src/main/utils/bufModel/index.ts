// import { deepClone } from '@/shared/utils'
// import logger from '../core/Logger'
// import { BufModelT } from '@/types/BufModel'

// // export interface Model {
// //   name: string
// //   bytLen?: number
// //   type?: 'list' | 'int' | 'float'
// //   model?: Model[]
// // }

// // interface BufModelOpts {
// //   model: Model[]
// //   listLen?: {
// //     [key: string]: number
// //   }
// // }

// // declare type BufWriteModelOpts = {
// //   model?: BufModelT.OrginModel
// //   listLen?: BufModelOpts['listLen']
// //   parent: {
// //     bufModel?: BufModel
// //     buf: Buffer
// //     start: number
// //   }
// // }

// // declare type ModelBaseItem = {
// //   offset: number
// // } & BufModelT.ModelOList

// // declare type ModelListItem<T = any> = {
// //   offset: number
// //   bufModel: BufModel
// //   listLength: number
// //   listAction: T[]
// // } & BufModelT.ModelOList

// // declare type ModelItem = ModelBaseItem | ModelListItem

// interface ModelTarget {
//   [key: string]: BufModelT.ModelItem
// }

// /** model */
// class BufModel<T = any> {
//   modelTarget: ModelTarget = {}
//   bufLength = 0
//   listModel: BufModelT.ModelListItem<T>[] = []

//   constructor({ model, listLen }: BufModelT.BufModelOpts) {
//     model.forEach(item => {
//       const target: BufModelT.ModelBaseItem = {
//         offset: this.bufLength,
//         ...deepClone(item)
//       }
//       this.modelTarget[item.name] = target
//       if (item.type === 'list') {
//         if (!item.model) {
//           throw new Error(`${target.name} list model undefined`)
//         }
//         if (!listLen || listLen[target.name] === void 0) {
//           throw new Error(`${target.name} listlen undefined`)
//         }
//         const listBufModel = new BufModel({
//           model: target.model
//         })
//         target.bufModel = listBufModel
//         ;(target as ModelListItem).listLength = listLen[target.name]
//         ;(target as ModelListItem).listAction = []
//         target.bytLen = listBufModel.bufLength
//         this.listModel.push(target as ModelListItem)
//         // logger.debug(
//         //   '列表添加',
//         //   target.name,
//         //   listBufModel.bufLength * listLen[target.name]
//         // )
//         this.bufLength += listBufModel.bufLength * listLen[target.name]
//       } else {
//         // logger.debug('单项添加', target.name, target.bytLen)
//         this.bufLength += target.bytLen
//       }
//     })
//   }
// }

// export class BufWriteModel {
//   buf: Buffer
//   parent?: BufWriteModel
//   bufModel: BufModel<BufWriteModel>
//   start = 0

//   constructor(opts: BufModelT.BufWriteOpts) {
//     if (opts.parent) {
//       this.bufModel = opts.parent.bufModel
//       this.start = opts.parent.start
//       this.buf = opts.parent.buf
//     } else {
//       if (!opts.model) {
//         throw new Error(`BufWriteModel model undefined`)
//       }
//       this.bufModel = new BufModel({
//         model: opts.model,
//         listLen: opts.listLen
//       })
//       this.buf = Buffer.alloc(this.bufModel.bufLength)
//     }
//     this.createListModel()
//   }

//   createListModel() {
//     if (this.bufModel.listModel.length > 0) {
//       this.bufModel.listModel.forEach(item => {
//         item.listAction = []
//         for (let i = 0; i < item.listLength; i++) {
//           const action = new BufWriteModel({
//             parent: {
//               bufModel: item.bufModel,
//               buf: this.buf,
//               start: item.bufModel.bufLength * i + item.offset
//             }
//           })
//           item.listAction.push(action)
//         }
//       })
//     }
//   }

//   getTarget(name: string) {
//     const target = this.bufModel.modelTarget[name]
//     if (!target) {
//       throw new Error(`BufModel write ${name} undefined`)
//     }
//     return target
//   }

//   /** 直接写数值 */
//   writer(name: string, value: number | string) {
//     const target = this.getTarget(name)
//     if (target.bytLen === void 0) throw new Error(`${name} bytLen undefined`)
//     const data = (value as unknown) as number
//     const offset = this.start + target.offset
//     if (target.type === 'float') {
//       // if (typeof data === 'number') {
//       //   data = Math.round((data + Number.EPSILON) * 100) / 100
//       // }
//       return this.buf.writeFloatBE(data, offset)
//     }
//     if (target.type === 'int') {
//       return this.buf.writeIntBE(data, offset, target.bytLen)
//     }
//     return this.buf.writeUIntBE(data, offset, target.bytLen)
//   }

//   /** 按位写 */
//   writerBit(name: string, data: number[], fillNum = 0) {
//     const target = this.getTarget(name)
//     if (target.bytLen === void 0) throw new Error(`${name} bytLen undefined`)
//     const bitArr = Array(target.bytLen * 8).fill(fillNum)
//     data.forEach(item => {
//       bitArr[item] = 1
//     })
//     return this.writer(name, parseInt(bitArr.reverse().join(''), 2))
//   }

//   ecahList(
//     name: string,
//     cb: (BufWriteModel: BufWriteModel, index: number) => any
//   ) {
//     const target = this.getTarget(name) as ModelListItem<BufWriteModel>
//     if (target.listAction) {
//       target.listAction.forEach((item, index) => {
//         cb(item, index)
//       })
//     }
//   }
// }
