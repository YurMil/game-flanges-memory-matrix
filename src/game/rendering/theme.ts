export const THEME = {
  bgDeep: 0x070b10,
  bgPanel: 0x121a24,
  // Brushed steel palette
  steelShadow: 0x141a22,
  steelDark: 0x2a343f,
  steelMid: 0x6a7888,
  steelLight: 0xb7c4d2,
  steelBright: 0xedf2f7,
  steelBlue: 0x8fa4b8,
  boltHead: 0x9aa8b6,
  boltShade: 0x3a4552,
  gasket: 0x1a222c,
  rim: 0x0e1319,
  amber: 0xf5c518,
  amberSoft: 0xffe27a,
  green: 0x3dd68c,
  greenSoft: 0x8ef0bc,
  red: 0xff4d4d,
  redSoft: 0xff8a8a,
  cyan: 0x5ec8ff,
  cyanSoft: 0xa8e2ff,
  text: '#d7e2ee',
  textDim: '#8fa0b3',
  textAmber: '#f5c518',
  // CSP-safe on cadautoscript.com (font-src 'self' data: — no Google Fonts)
  fontDisplay: "Segoe UI, Helvetica Neue, Arial, sans-serif",
  fontMono: "Consolas, Cascadia Mono, Lucida Console, ui-monospace, monospace",
} as const;

export type GameTheme = typeof THEME;
