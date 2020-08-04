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
