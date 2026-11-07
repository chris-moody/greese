import { afterEach, describe, expect, it, vi } from 'vitest'
import { copyToClipboard } from './clipboard.ts'

const stubClipboard = (writeText: (text: string) => Promise<void>) =>
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText },
    configurable: true,
  })

// jsdom has no execCommand of its own.
const stubExecCommand = (result: boolean | Error) => {
  const execCommand = vi.fn(() => {
    if (result instanceof Error) throw result
    return result
  })
  Object.defineProperty(document, 'execCommand', {
    value: execCommand,
    configurable: true,
  })
  return execCommand
}

afterEach(() => {
  Reflect.deleteProperty(navigator, 'clipboard')
  Reflect.deleteProperty(document, 'execCommand')
  document.body.replaceChildren()
})

describe('copyToClipboard', () => {
  it('writes with the Clipboard API', async () => {
    const writeText = vi.fn(() => Promise.resolve())
    stubClipboard(writeText)
    const execCommand = stubExecCommand(true)
    await copyToClipboard('hello')
    expect(writeText).toHaveBeenCalledWith('hello')
    expect(execCommand).not.toHaveBeenCalled()
  })

  it('falls back to a selected textarea when the API is missing', async () => {
    let selected = ''
    const execCommand = stubExecCommand(true)
    execCommand.mockImplementation(() => {
      selected = document.querySelector('textarea')!.value
      return true
    })
    await copyToClipboard('no api')
    expect(execCommand).toHaveBeenCalledWith('copy')
    expect(selected).toBe('no api')
    expect(document.querySelector('textarea')).toBeNull()
  })

  it('falls back when the API refuses, and gives focus back', async () => {
    stubClipboard(() => Promise.reject(new Error('NotAllowedError')))
    stubExecCommand(true)
    const button = document.createElement('button')
    document.body.append(button)
    button.focus()
    await copyToClipboard('refused')
    expect(document.activeElement).toBe(button)
  })

  it('rejects with the API’s error when the fallback fails too', async () => {
    const refusal = new Error('NotAllowedError')
    stubClipboard(() => Promise.reject(refusal))
    stubExecCommand(false)
    await expect(copyToClipboard('x')).rejects.toBe(refusal)
    stubExecCommand(new Error('SecurityError'))
    await expect(copyToClipboard('x')).rejects.toBe(refusal)
  })
})
