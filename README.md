# Runenir Claude theme

The Runenir look for the Claude desktop and mobile apps: deep, slightly tinted dark surfaces, one accent colour, and a soft glow in the top-left corner.  Dark mode only.

Nine colours, named after gemstones:

Amethyst (default), Sapphire, Turquoise, Emerald, Citrine, Sunstone, Ruby, Rose Quartz, Onyx.

Each one keeps the same lightness and contrast and only changes the hue, so text reads the same in all of them.

## Install

At the prompt of a Claude Code terminal session:

```
/plugin install runenir-theme --marketplace aegisnir/runenir-claude-theme
```

Or from a shell:

```bash
claude plugin install runenir-theme --marketplace aegisnir/runenir-claude-theme
```

In the desktop app: click **+** next to the prompt box, then **Plugins**, **Add marketplace** with `aegisnir/runenir-claude-theme`, then **Add plugin**.

## Change colour

| Command | Does |
| --- | --- |
| `/runenir` | Lists the colours, with a dot on the current one |
| `/runenir ruby` | Switches to Ruby and remembers it |

## What it can and can't change

A Claude theme sets colours and the background.  It can't change corner radius, layout, fonts or icons.  Permission prompts always keep the app's own look.  The terminal and editor extensions don't draw themes.

## Files

- `hooks/presets.ts`: the colours.  Change a hue there to make your own option.
- `hooks/register.tsx`: applies the colour, draws the corner glow, adds `/runenir`.
- `hooks/make-colors.js` and `make-colors.d.ts`: Claude Code's own colour helper, copied unchanged from its plugin-authoring skill.  It builds the app's full palette from a few colours.  It belongs to Anthropic and is not covered by this repository's licence.

## Licence

MIT, see `LICENSE`, except the two `make-colors` files above.
