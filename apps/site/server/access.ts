/**
 * Who may use Theme Studio's API: this machine, or a device that opened the
 * studio link printed in the terminal.
 *
 * The API writes files, compiles SCSS that can load stylesheets from disk,
 * and runs imported modules. With `--host` (testing on a phone) the dev
 * server is on the network, where any request header can be forged, so the
 * check is the connection's address, which can't be: loopback is this
 * machine. Another device proves itself with a token it can only get from
 * the terminal, exchanged once for an HttpOnly, SameSite=Strict cookie, so
 * the studio's own requests carry it and no other site's or script's can.
 */
import { randomBytes, timingSafeEqual } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { dirname } from 'node:path'

/** The query parameter the printed link carries. */
export const TOKEN_PARAM = 'studio-token'
const COOKIE = 'greese-studio'

const LOOPBACK = /^(127\.\d+\.\d+\.\d+|::1|::ffff:127\.\d+\.\d+\.\d+)$/

/** A connection from this machine. */
export const isLoopback = (address: string | undefined): boolean =>
  !!address && LOOPBACK.test(address)

const same = (a: string, b: string): boolean =>
  a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b))

const cookieValue = (req: IncomingMessage): string | undefined =>
  req.headers.cookie
    ?.split(';')
    .map((part) => part.trim().split('='))
    .find(([name]) => name === COOKIE)?.[1]

/**
 * The token, kept in `file` so a phone stays signed in across restarts.
 * Delete the file to sign every device out.
 */
export const studioToken = (file: string): string => {
  if (existsSync(file)) {
    const saved = readFileSync(file, 'utf8').trim()
    if (saved.length >= 32) return saved
  }
  const token = randomBytes(24).toString('base64url')
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, `${token}\n`, { mode: 0o600 })
  return token
}

export interface StudioAccess {
  /** Whether this request may use the API. */
  allowed: (req: IncomingMessage) => boolean
  /**
   * Turns a valid `?studio-token=` into the cookie and redirects to the same
   * URL without it (so the token leaves the address bar). True when handled.
   */
  exchange: (req: IncomingMessage, res: ServerResponse) => boolean
}

export const studioAccess = (token: string): StudioAccess => ({
  allowed: (req) => {
    // Browsers send Origin with every write; a page on another site sends its
    // own, so this still stops cross-site requests.
    const origin = req.headers.origin
    const write = req.method !== 'GET' && req.method !== 'HEAD'
    if ((origin || write) && origin !== `http://${req.headers.host}`) return false
    if (isLoopback(req.socket.remoteAddress)) return true
    const cookie = cookieValue(req)
    return cookie !== undefined && same(cookie, token)
  },
  exchange: (req, res) => {
    const url = new URL(req.url ?? '/', 'http://studio')
    const given = url.searchParams.get(TOKEN_PARAM)
    if (given === null || !same(given, token)) return false
    url.searchParams.delete(TOKEN_PARAM)
    res.statusCode = 302
    res.setHeader(
      'set-cookie',
      `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=31536000`
    )
    res.setHeader('location', `${url.pathname}${url.search}`)
    res.end()
    return true
  },
})
