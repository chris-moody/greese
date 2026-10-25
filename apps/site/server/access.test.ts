import { mkdtempSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { isLoopback, studioAccess, studioToken, TOKEN_PARAM } from './access.ts'

const TOKEN = 'a'.repeat(32)
const LAN = '192.168.1.20'

const request = ({
  from = '127.0.0.1',
  method = 'GET',
  url = '/api/theme',
  headers = {},
}: {
  from?: string
  method?: string
  url?: string
  headers?: Record<string, string>
}) =>
  ({
    method,
    url,
    headers: { host: '192.168.1.5:5180', ...headers },
    socket: { remoteAddress: from },
  }) as unknown as IncomingMessage

const response = () => {
  const headers: Record<string, string> = {}
  return {
    headers,
    statusCode: 200,
    setHeader: (name: string, value: string) => void (headers[name] = value),
    end: () => {},
  }
}

const sameOrigin = { origin: 'http://192.168.1.5:5180' }
const access = studioAccess(TOKEN)

describe('studio access', () => {
  it('trusts this machine, over IPv4 and IPv6', () => {
    for (const from of ['127.0.0.1', '::1', '::ffff:127.0.0.1'])
      expect(access.allowed(request({ from }))).toBe(true)
    expect(isLoopback('192.168.1.20')).toBe(false)
    expect(isLoopback(undefined)).toBe(false)
  })

  it('refuses another device, even with every header forged to match', () => {
    expect(access.allowed(request({ from: LAN }))).toBe(false)
    expect(
      access.allowed(
        request({ from: LAN, method: 'POST', url: '/api/import', headers: sameOrigin })
      )
    ).toBe(false)
  })

  it('lets a device in with the cookie the printed link sets', () => {
    const cookie = `other=1; greese-studio=${TOKEN}`
    expect(access.allowed(request({ from: LAN, headers: { cookie } }))).toBe(true)
    expect(
      access.allowed(
        request({ from: LAN, method: 'PUT', headers: { cookie, ...sameOrigin } })
      )
    ).toBe(true)
    expect(
      access.allowed(request({ from: LAN, headers: { cookie: 'greese-studio=nope' } }))
    ).toBe(false)
  })

  it('still refuses cross-site requests, even from this machine', () => {
    expect(
      access.allowed(
        request({ method: 'POST', headers: { origin: 'https://evil.example' } })
      )
    ).toBe(false)
    // A browser always sends Origin with a write; a write without one isn't the studio.
    expect(access.allowed(request({ method: 'PUT' }))).toBe(false)
  })

  it('trades the link’s token for the cookie and drops it from the URL', () => {
    const res = response()
    const handled = access.exchange(
      request({ from: LAN, url: `/studio?tab=colors&${TOKEN_PARAM}=${TOKEN}` }),
      res as unknown as ServerResponse
    )
    expect(handled).toBe(true)
    expect(res.statusCode).toBe(302)
    expect(res.headers.location).toBe('/studio?tab=colors')
    expect(res.headers['set-cookie']).toMatch(
      /^greese-studio=a+; Path=\/; HttpOnly; SameSite=Strict/
    )
  })

  it('ignores a wrong token and requests without one', () => {
    for (const url of [`/studio?${TOKEN_PARAM}=wrong`, '/studio', '/'])
      expect(
        access.exchange(
          request({ from: LAN, url }),
          response() as unknown as ServerResponse
        )
      ).toBe(false)
  })
})

describe('studioToken', () => {
  it('makes one, keeps it across restarts, and only the owner can read it', () => {
    const file = join(mkdtempSync(join(tmpdir(), 'studio-token-')), 'token')
    const first = studioToken(file)
    expect(first.length).toBeGreaterThanOrEqual(32)
    expect(studioToken(file)).toBe(first)
    expect(statSync(file).mode & 0o077).toBe(0)
    // A short or emptied file is replaced, never trusted.
    writeFileSync(file, 'short\n')
    expect(studioToken(file)).not.toBe('short')
    expect(readFileSync(file, 'utf8').trim().length).toBeGreaterThanOrEqual(32)
  })
})
