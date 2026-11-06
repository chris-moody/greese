import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { crc32, zip } from '../src/studio/zip.ts'

const hasUnzip = (() => {
  try {
    execFileSync('unzip', ['-v'], { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
})()

describe('zip', () => {
  it('checksums as the format does', () => {
    expect(crc32(new TextEncoder().encode('123456789'))).toBe(0xcbf43926)
  })

  it('stores each file under the folder, with its central directory', () => {
    const bytes = zip(
      { 'main.scss': "@use 'settings';\n", 'tokens/_color.scss': '$tokens: ();\n' },
      'greese-theme'
    )
    const view = new DataView(bytes.buffer)
    expect(view.getUint32(0, true)).toBe(0x04034b50)
    const end = bytes.length - 22
    expect(view.getUint32(end, true)).toBe(0x06054b50)
    expect(view.getUint16(end + 10, true)).toBe(2)
    expect(new TextDecoder().decode(bytes)).toContain('greese-theme/tokens/_color.scss')
  })

  it.runIf(hasUnzip)('opens with unzip, every file intact', () => {
    const dir = mkdtempSync(join(tmpdir(), 'greese-zip-'))
    const files = {
      'main.scss': "@use 'settings'; // ✓\n",
      'components/_card.scss': 'a { b: c; }\n',
    }
    writeFileSync(join(dir, 'theme.zip'), zip(files, 'theme'))
    execFileSync('unzip', ['-q', 'theme.zip'], { cwd: dir })
    for (const [path, text] of Object.entries(files))
      expect(readFileSync(join(dir, 'theme', path), 'utf8')).toBe(text)
  })
})
