import { SCHEME_ATTR } from './css.ts'

/** `system` follows the OS setting; `light` and `dark` force a mode. */
export type ColorScheme = 'light' | 'dark' | 'system'

export const DEFAULT_SCHEME_STORAGE_KEY = 'greese-scheme'

export interface SchemeScriptOptions {
  /** localStorage key holding the user's choice. Must match useColorScheme's. */
  storageKey?: string
}

/**
 * A tiny inline script that applies the user's saved color scheme before first
 * paint, so a dark-mode user never sees a flash of light. Put it in `<head>`:
 *
 * ```tsx
 * <script dangerouslySetInnerHTML={{ __html: getSchemeScript() }} />
 * ```
 */
export const getSchemeScript = ({
  storageKey = DEFAULT_SCHEME_STORAGE_KEY,
}: SchemeScriptOptions = {}): string =>
  `(function(){try{var s=localStorage.getItem(${JSON.stringify(storageKey)});` +
  `if(s==='light'||s==='dark'){document.documentElement.setAttribute('${SCHEME_ATTR}',s)}}` +
  `catch(e){}})();`
