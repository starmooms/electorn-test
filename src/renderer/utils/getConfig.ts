import { workSteps, workStepsInput } from '@/shared/config/port'
import { typedKeys } from '@/shared/utils'

export function getPortSelectList() {
  return typedKeys(workSteps).map(key => {
    const step = workSteps[key]
    return {
      label: step.name,
      value: key,
      input: step.input || []
    }
  })
}

export function getPortInputList() {
  const inputList = {}
  const stepList = {}
  typedKeys(workStepsInput).forEach(key => {
    const item = workStepsInput[key]
    inputList[key] = {
      name: item.name,
      key
    }
    stepList[key] = null
  })
  return { inputList, stepList }
}

export function getChartsData() {
  const Uy: number[] = []
  const Iy: number[] = []
  // const Timex: number[] = [
  //   0,
  //   0.9,
  //   22.9,
  //   44.9,
  //   66.9,
  //   88.9,
  //   10,
  //   11.7,
  //   13.8,
  //   16,
  //   18,
  //   19.5,
  //   21.7,
  //   23.7
  // ]

  let i = 0
  while (i <= 5000) {
    Uy.push(i)
    i += 200
  }

  i = -6000
  while (i <= 6000) {
    console.log(i)
    Iy.push(i)
    i += 500
  }

  i = 0
  while (i <= 40.1) {
    Iy.push(i)
    i += 0.9
  }

  return { Uy, Iy }
}
