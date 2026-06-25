# FitFlow Design System

The single source of truth for how FitFlow looks and feels. Read this before adding
any screen, component, color, or icon so the app stays visually consistent.

> Brand promise: **Train SMART. Move every day.**
> Personality: focused, energetic, encouraging — never clinical, never cute.

---

## 1. Color tokens

Defined in `tailwind.config.ts`. Always use the token, never a raw hex in components.

| Token | Hex | Use |
|---|---|---|
| `bgRoot` | `#111111` | App backdrop (outside the phone frame) |
| `bgPhone` | `#0A0A0A` | Phone canvas, nav bar |
| `bgCard` | `#141414` | Cards, inputs, chips (unselected) |
| `border` | `#1E1E1E` | Hairline borders |
| `borderStrong` | `#252525` | Input / chip borders, dividers |
| `accentGreen` | `#4ADE80` | **Primary brand green** — buttons, icons, highlights |
| `accentGreenDark` | `#22C55E` | Gradient end, pressed states |
| `deepGreen` | `#052E16` | Text/glyphs on green surfaces |
| `midDeepGreen` | `#166534` | Secondary text on mint cards |
| `mintBg` | `#F0FDF4` | Hero card background (light) |
| `textMuted` | `#B8B8B8` | Body text |
| `textFaint` | `#949494` | Captions, labels, inactive |

**Rules**
- The app is **dark-first**. Default surface is near-black; green is the one accent.
- Green is for emphasis only (CTAs, active states, icons, key numbers). Don't flood a
  screen with green — it loses its punch.
- The mint hero card is the single "light" moment per screen. Use sparingly.

---

## 2. Typography

Fonts loaded in `app/globals.css`.

- **Display** — `Bebas Neue` (`font-display`). Tall, condensed, uppercase energy.
  Use for: screen titles, the wordmark, big numbers/stats, workout names.
- **Body** — `DM Sans` (`font-body`, default). Use for everything else.

Scale guidance:
- Hero / wordmark: `text-7xl` display
- Screen title: `text-4xl` display
- Workout name on card: `text-[44px]` display, `leading-[0.95]`
- Stat numbers: `text-3xl`–`text-5xl` display
- Body: `text-[15px]`, captions `text-[13px]`, labels `text-[12px] uppercase tracking-wider`

---

## 3. Shape, spacing, motion

- Radius tokens: `chip` 12px, `card` 14px, `button` 14px, `hero` 22px.
- Screen horizontal padding: `px-6` to `px-7`.
- Vertical rhythm between sections: `mt-6`/`mt-7`.
- Buttons & tappable cards press in: `active:scale-[0.98] transition`.
- Entrance: `.ff-pop` (subtle scale-in). Keep animation quiet and quick (~250ms).

---

## 4. Core components (`components/ui.tsx`)

- `PrimaryButton` — green fill, deep-green text. The one main action per view.
- `GhostButton` — outlined, for secondary actions.
- `Card` — dark surface, hairline border. The default container.
- `Chip` — selectable pill; supports a leading `icon`. Selected = green fill.
- `SectionLabel` — uppercase faint label above a group.
- `ProgressBar`, `StatTile`.

Compose screens from these. Don't hand-roll one-off buttons/cards — extend `ui.tsx`.

---

## 5. Icon system (`components/icons.tsx`) — IMPORTANT

**All icons are flat, solid green, drawn on a 24×24 grid, inheriting `currentColor`.**

- Use `<Icon name="..." />`. Never use emoji for UI (emoji are inconsistent across
  platforms and look unprofessional). Emoji were removed in favor of this set.
- Icons inherit color: green on dark surfaces, deep-green when on a green chip/button.
- Visual weight: filled shapes preferred; stroked shapes use `strokeWidth ~2`,
  round caps/joins, to match the filled ones.
- Default size 22 in chips/tabs; 15 inline with text; 56–64 for hero/empty states.
- Add a new icon by adding a case to `paths()` and a name to `IconName`. Keep it
  geometric and simple — recognizable at 18px.

**Logo:** `<LogoMark />` — a green-gradient rounded-square badge with a dark
"rising progress + flow" glyph. Used on welcome, loading, and as the favicon
(`app/icon.svg`). Don't restyle it per-screen.

---

## 6. Voice & copy

- Short, active, motivating. "Start workout", "Build my plan", "Move every day."
- Title case for screen titles via display font; sentence case for body.
- Encourage, don't nag. Celebrate completion (check icons, "done" counts).

---

## 7. Do / Don't

- ✅ Use tokens + `ui.tsx` + `Icon`. ✅ Keep green as a scarce accent.
- ❌ No raw hex in components. ❌ No emoji in UI. ❌ No new font families.
- ❌ Don't put more than one PrimaryButton (one clear action) per view.

---

## Turning this into a Cowork skill (optional)

This doc is the portable spec. To make an agent auto-apply it, create a skill from
this file via **Settings → Capabilities → Skills** (skills can't be authored inside a
chat session). Point the skill's instructions at this `STYLE.md` and trigger it on
"add screen / component / icon / color to FitFlow".
