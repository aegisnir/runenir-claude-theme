import type { Hook, Register, ThemeSetArgs } from 'claude-code'

import { buildPreset, DEFAULT_PRESET, PRESET_NAMES, PRESETS } from './presets.js'
import type { PresetName } from './presets.js'

// Runenir theme for the Claude desktop and mobile apps.
// Colours and the options live in presets.ts.  This file applies the chosen
// option, draws the corner glow, and adds the /runenir command to switch.

const STORE_KEY = 'preset' // $.store keeps the choice across sessions

// Runenir's corner glow (--runenir-page-glow): a soft light in the top-left
// corner over the ground colour.  The app's own gradient option can only
// centre a radial gradient, so the glow is a still SVG "scene" instead:
// no animation, nothing loaded, no script.
// Strength: 60% at the corner, gone at 75% of the radius.
// xMinYMin slice pins the corner to the top-left on any window shape.
function glowSvg(ground: string, glow: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMinYMin slice">
  <defs>
    <radialGradient id="glow" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="1100" gradientTransform="scale(1 0.6364)">
      <stop offset="0" stop-color="${glow}" stop-opacity="0.6"/>
      <stop offset="0.75" stop-color="${glow}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1600" height="1000" fill="${ground}"/>
  <rect width="1600" height="1000" fill="url(#glow)"/>
</svg>`
}

const isPreset = (v: unknown): v is PresetName => typeof v === 'string' && v in PRESETS

// "Rose Quartz", "rose-quartz" and "rosequartz" all mean rosequartz.
function toPreset(v: unknown): PresetName | undefined {
  if (typeof v !== 'string') {
    return undefined
  }
  const key = v.toLowerCase().replace(/[\s_-]+/g, '')
  return isPreset(key) ? key : undefined
}

// The scene name carries the option, so the Backdrop hook knows which glow to draw.
async function apply($: Parameters<Hook<'session.start'>>[0], name: PresetName) {
  const p = buildPreset(name)
  // If the desktop app would refuse the whole theme, say so instead of failing silently.
  const unpainted = p.problems.find(line => line.startsWith("Desktop won't paint"))

  if (unpainted !== undefined) {
    $.ui.toast(unpainted)
  }

  // Panels over the glow (the strip behind the message box) are painted solid
  // in the ground colour, so they match the page instead of showing as a
  // lighter box.  Solid and unblurred, as Runenir Plain does.
  const look: ThemeSetArgs = {
    colors: p.theme,
    backdrop: { scene: `runenir-${name}`, glass: { blur: 0, tint: p.ground, opacity: 1 } },
  }
  // No status line: at session start the app often isn't attached yet, so the
  // result says "not drawn" even though the theme appears a moment later.
  await $.theme.set(look)
  $.ui.status(undefined)
}

export const register: Register = on => {
  // Draws the corner glow for whichever option is on.  Terminal and editors have no backdrop.
  on('ui.render', { component: 'Backdrop' }, ($, e, next) => {
    if (e.surface !== 'desktop' && e.surface !== 'mobile') {
      return next(e)
    }

    const scene = String((e.props as { scene?: unknown }).scene ?? '')
    const name = scene.replace(/^runenir-/, '')

    if (!isPreset(name)) {
      return next(e)
    }

    const p = buildPreset(name)
    const { Svg } = $.ui.resolve(e)

    return <Svg source={glowSvg(p.ground, p.glow)} alt={`Soft ${p.label.toLowerCase()} glow in the top-left corner`} />
  })

  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'runenir',
      description: 'Change the Runenir theme colour',
      argumentHint: PRESET_NAMES.join(' | '),
    })

    const saved = toPreset(await $.store.get(STORE_KEY))
    await apply($, saved ?? DEFAULT_PRESET)

    return next(e)
  })

  // /runenir           -> lists the options, marks the current one
  // /runenir ruby      -> switches to Ruby and remembers it
  on('command.run', { command: 'runenir' }, async ($, e) => {
    const typed = e.args.trim()
    const wanted = toPreset(typed)
    const current = toPreset(await $.store.get(STORE_KEY)) ?? DEFAULT_PRESET

    if (typed === '') {
      const list = PRESET_NAMES.map(n => `${n === current ? '●' : '○'} ${PRESETS[n].label}`).join('\n')

      return { text: `Runenir colour\n${list}\n\n/runenir <name> to change` }
    }

    if (wanted === undefined) {
      return { text: `No colour "${typed}".  Options: ${PRESET_NAMES.map(n => PRESETS[n].label).join(', ')}` }
    }

    await $.store.set(STORE_KEY, wanted)
    await apply($, wanted)

    return { text: `Runenir colour: ${PRESETS[wanted].label}` }
  })
}
