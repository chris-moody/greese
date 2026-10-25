/**
 * The whole library's styles, after the first paint: main.tsx asks for it
 * as soon as it runs (without blocking the HTML's paint), and every lazy part
 * (the homepage's later sections, the routes, the search, the theme menu)
 * imports it, so its CSS has arrived before it renders.
 *
 * It repeats firstScreen.ts's blocks (about 12 kB): loaded whole, the
 * library's rules keep their own order, so the cascade is exactly the one a
 * single stylesheet gives.
 */
import '@greese/react/styles.css'
