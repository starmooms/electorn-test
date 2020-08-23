import {
  workSteps,
  WORKSTEPS,
  WORKSTEPS_MAP,
  workStepsInput,
  WORKSTEPSINPUT
} from '@/shared/config/port'

export function getStepsOpts() {
  return WORKSTEPS.map(item => {
    return {
      label: item.name,
      value: {
        name: item.name,
        type: item.type,
        input: item.input.worker.concat(item.input.limt),
        key: item.key
      }
    }
  })
}

export function getStepsInputMap() {
  return WORKSTEPSINPUT
}

// export function getPortSelectList() {
//   return typedKeys(workSteps).map(key => {
//     const step = workSteps[key]
//     return {
//       label: step.name,
//       value: key,
//       input: step.input || []
//     }
//   })
// }

// export function getPortSelectList() {
//   const result: StepsSelect[] = []
//   WORKSTEPS_MAP.forEach((value, key) => {
//     const step = WORKSTEPS[key]
//     result.push({
//       label: step.name,
//       value: key,
//       input: step.input || []
//     })
//   })
//   return result
// }

// export function getPortSelectList() {
//   const result: StepsSelect[] = []
//   WORKSTEPS_MAP.forEach((value, key) => {
//     const step = WORKSTEPS[key]
//     result.push({
//       label: step.name,
//       value: key,
//       input: step.input || []
//     })
//   })
//   return result
// }

// export function getPortInputList() {
//   const inputList = {}
//   typedKeys(workStepsInput).forEach(key => {
//     const item = workStepsInput[key]
//     inputList[key] = {
//       name: item.name,
//       key
//     }
//   })
//   return { inputList }
// }

// export function getChartsData() {
//   const Uy: number[] = []
//   const Iy: number[] = []
//   // const Timex: number[] = [
//   //   0,
//   //   0.9,
//   //   22.9,
//   //   44.9,
//   //   66.9,
//   //   88.9,
//   //   10,
//   //   11.7,
//   //   13.8,
//   //   16,
//   //   18,
//   //   19.5,
//   //   21.7,
//   //   23.7
//   // ]

//   let i = 0
//   while (i <= 5000) {
//     Uy.push(i)
//     i += 200
//   }

//   i = -6000
//   while (i <= 6000) {
//     console.log(i)
//     Iy.push(i)
//     i += 500
//   }

//   i = 0
//   while (i <= 40.1) {
//     Iy.push(i)
//     i += 0.9
//   }

//   return { Uy, Iy }
// }
