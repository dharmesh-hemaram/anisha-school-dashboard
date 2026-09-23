import { defineConfig } from "@vite-pwa/assets-generator/config"

// public/favicon.svg is already full-bleed (a solid navy background square
// with the notebook glyph centered well inside Android's maskable safe
// zone) -- the source for the browser-tab favicon and for every generated
// install icon below, so there's exactly one place to redraw the icon.
//
// minimal2023Preset's own defaults pad every category with extra margin
// filled white (0.3 padding for maskable/apple, 0.05 for the plain icons) --
// meant for a source image that's just the glyph with a transparent
// background. Ours already includes its own background and margin, so that
// default padding would just shrink the navy square inside an added white
// border. padding: 0 keeps every generated size exactly what's drawn.
export default defineConfig({
  headLinkOptions: {
    preset: "2023",
  },
  preset: {
    transparent: {
      sizes: [64, 192, 512],
      favicons: [[48, "favicon.ico"]],
      padding: 0,
    },
    maskable: {
      sizes: [512],
      padding: 0,
    },
    apple: {
      sizes: [180],
      padding: 0,
    },
  },
  images: ["public/favicon.svg"],
})
