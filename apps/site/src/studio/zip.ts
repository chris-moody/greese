/**
 * Files as a .zip, stored without compression: the hosted studio's download
 * of a theme's SCSS layout, which is a folder. A few dozen lines rather than
 * a dependency (the format is fixed: local headers, the files, a central
 * directory). UTF-8 names, no timestamps (1980-01-01).
 */

const CRC = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})

export const crc32 = (bytes: Uint8Array): number => {
  let c = 0xffffffff
  for (const b of bytes) c = CRC[(c ^ b) & 0xff]! ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

/** A zip of `files` (path → text), each under `folder/`. */
export const zip = (
  files: Record<string, string>,
  folder = ''
): Uint8Array<ArrayBuffer> => {
  const encode = new TextEncoder()
  const local: Uint8Array[] = []
  const central: Uint8Array[] = []
  let offset = 0
  const header = (size: number, write: (v: DataView) => void) => {
    const bytes = new Uint8Array(size)
    write(new DataView(bytes.buffer))
    return bytes
  }
  for (const [path, text] of Object.entries(files)) {
    const name = encode.encode(folder ? `${folder}/${path}` : path)
    const data = encode.encode(text)
    const crc = crc32(data)
    // The fields both headers share, from "version needed" on.
    const common = (v: DataView, at: number) => {
      v.setUint16(at, 20, true) // version needed: 2.0
      v.setUint16(at + 2, 0x0800, true) // flags: UTF-8 names
      v.setUint16(at + 4, 0, true) // stored
      v.setUint16(at + 6, 0, true) // time
      v.setUint16(at + 8, 0x21, true) // date: 1980-01-01
      v.setUint32(at + 10, crc, true)
      v.setUint32(at + 14, data.length, true)
      v.setUint32(at + 18, data.length, true)
      v.setUint16(at + 22, name.length, true)
    }
    local.push(
      header(30, (v) => {
        v.setUint32(0, 0x04034b50, true)
        common(v, 4)
      }),
      name,
      data
    )
    central.push(
      header(46, (v) => {
        v.setUint32(0, 0x02014b50, true)
        v.setUint16(4, 20, true) // made by
        common(v, 6)
        v.setUint32(42, offset, true)
      }),
      name
    )
    offset += 30 + name.length + data.length
  }
  const size = central.reduce((n, b) => n + b.length, 0)
  const count = Object.keys(files).length
  const end = header(22, (v) => {
    v.setUint32(0, 0x06054b50, true)
    v.setUint16(8, count, true)
    v.setUint16(10, count, true)
    v.setUint32(12, size, true)
    v.setUint32(16, offset, true)
  })
  const parts = [...local, ...central, end]
  const out = new Uint8Array(parts.reduce((n, b) => n + b.length, 0))
  let at = 0
  for (const part of parts) {
    out.set(part, at)
    at += part.length
  }
  return out
}
