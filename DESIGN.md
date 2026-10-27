---
name: Columbia / KRYGA — admin extension
description: The implemented shared-site settings surface, within the existing Columbia and KRYGA visual world.
colors:
  admin-accent: "#06525c"
  admin-accent-hover: "#043e46"
  admin-ink: "#183b42"
  admin-muted: "#52696d"
  admin-line: "#dfe7e5"
  admin-frame: "#edf2f1"
  admin-sheet: "#fff"
  admin-live: "#f2f6f4"
  admin-nav: "#dfe8e5"
  admin-disabled: "#e9efec"
  admin-control-line: "#a5b5b1"
  admin-focus: "#1756a9"
  admin-status-dot: "#34745d"
  admin-status-text: "#32634f"
  admin-error: "#a13224"
  admin-success: "#226047"
  admin-configuration: "#815510"
  columbia-preview-ink: "#0e2341"
  columbia-preview-studio: "#ececec"
typography:
  headline:
    fontFamily: '"TikTok Sans", system-ui, sans-serif'
    fontSize: "28px"
    fontWeight: 650
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  title:
    fontFamily: '"TikTok Sans", system-ui, sans-serif'
    fontSize: "20px"
    fontWeight: 600
    lineHeight: 1.25
  live-title:
    fontFamily: '"TikTok Sans", system-ui, sans-serif'
    fontSize: "19px"
    fontWeight: 600
    lineHeight: 1.4
  section-title:
    fontFamily: '"TikTok Sans", system-ui, sans-serif'
    fontSize: "15px"
    fontWeight: 600
    lineHeight: 1.5
  body:
    fontFamily: '"TikTok Sans", system-ui, sans-serif'
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  control:
    fontFamily: '"TikTok Sans", system-ui, sans-serif'
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.5
  button:
    fontFamily: '"TikTok Sans", system-ui, sans-serif'
    fontSize: "13px"
    fontWeight: 550
    lineHeight: 1.5
  caption:
    fontFamily: '"TikTok Sans", system-ui, sans-serif'
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  input: "6px"
  control: "7px"
  status-strip: "10px"
  site-card: "12px"
  sheet: "16px"
  indicator: "50%"
spacing:
  caption-gap: "5px"
  status-gap: "6px"
  compact: "8px"
  control-gap: "12px"
  small: "16px"
  card-inset: "18px"
  grid-gap: "20px"
  section-inset: "24px"
  section-gap: "30px"
components:
  button-primary:
    backgroundColor: "{colors.admin-accent}"
    textColor: "{colors.admin-sheet}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "0 20px"
  button-primary-hover:
    backgroundColor: "{colors.admin-accent-hover}"
  button-primary-disabled:
    backgroundColor: "{colors.admin-disabled}"
    textColor: "{colors.admin-muted}"
  button-text:
    backgroundColor: "transparent"
    textColor: "{colors.admin-muted}"
    typography: "{typography.control}"
    padding: "10px 0 10px 12px"
  password-input:
    textColor: "{colors.admin-ink}"
    typography: "{typography.caption}"
    rounded: "{rounded.input}"
    padding: "0 12px"
    height: "40px"
  navigation-current:
    backgroundColor: "{colors.admin-nav}"
    textColor: "{colors.admin-ink}"
    rounded: "{rounded.control}"
    padding: "0 12px"
  site-card:
    textColor: "{colors.admin-ink}"
    rounded: "{rounded.site-card}"
  active-status:
    textColor: "{colors.admin-status-text}"
    typography: "{typography.caption}"
  live-strip:
    backgroundColor: "{colors.admin-live}"
    textColor: "{colors.admin-ink}"
    rounded: "{rounded.status-strip}"
    padding: "19px 22px"
---

# Design System: Columbia / KRYGA — admin extension

## Overview

**Creative North Star: "The Framed Working Sheet"**

A pale frame surrounds a white working sheet. TikTok Sans, teal ink, quiet borders, and recognizable product imagery extend the established Columbia / KRYGA visual world into a compact owner-facing interface. The hierarchy favors a clear current state, readable choices, and an explicit action.

This is a scan of the implemented `/admin` surface, not a redesign or a complete token inventory of either storefront. The frontmatter records admin values from `src/admin/admin.css`, including its final cascade overrides; component structure comes from `src/admin/Admin.jsx`. The existing storefronts retain their own visual authority in `src/styles.css` and `columbia-site/src/styles.css`. Their shared type family, cold-paper surfaces, and distinct teal / navy identities inform this extension. The framing metaphor describes the established admin brief; it does not establish a new brand identity.

**Key Characteristics:**

- A pale outer frame and white working sheet, separated by quiet borders.
- One type family with compact, sentence-case labels and restrained weight changes.
- Teal for selection and the primary action; blue for keyboard focus.
- Real storefront imagery that keeps Columbia and KRYGA recognizable.
- Flat surfaces and immediate state changes, without ornamental motion.

## Colors

The admin palette combines muted green-gray surfaces with dark teal text; Columbia navy remains visible in its preview.

### Primary

- **KRYGA Teal** (`admin-accent`) marks the selected site and enabled primary action. **Deep Teal** (`admin-accent-hover`) is its button hover state. These match the existing KRYGA accent and press colors.
- **Columbia Blue** (`admin-focus`) is the keyboard focus outline. It is distinct from the teal selection treatment and matches Columbia's existing accent.

### Neutral

- **Working Ink** (`admin-ink`) carries headings and primary content. **Muted Ink** (`admin-muted`) carries captions, explanatory text, and secondary controls.
- **Cold Frame** (`admin-frame`) surrounds **White Sheet** (`admin-sheet`). **Live Tint** (`admin-live`) groups the current server state. **Navigation Tint** (`admin-nav`) marks the current section.
- **Quiet Line** (`admin-line`) divides regions and outlines cards. **Control Line** (`admin-control-line`) outlines the password field and unselected radio indicator. **Disabled Tint** (`admin-disabled`) keeps unavailable actions legible.

### State and preview colors

- `admin-status-dot` and `admin-status-text` accompany the written active-state label. `admin-error`, `admin-success`, and `admin-configuration` distinguish feedback while the message text conveys the result.
- `columbia-preview-ink` and `columbia-preview-studio` preserve Columbia's navy wordmark and neutral product-photo ground inside its preview only.

The sidecar's tonal ramps are synthesized display aids for the design panel. They are not additional implemented colors or a proposed replacement palette.

## Typography

TikTok Sans is the existing display and body family. The admin uses the shorter system fallback stack recorded in frontmatter. The storefronts keep their existing variable display scale and expanded wordmarks; admin sizing does not replace those rules.

The admin heading uses the `headline` role, reducing to (25px) at the phone breakpoint. Site names use `title`; the current site uses `live-title`, reducing to (18px) on phones. Section labels and the apply-area title use `section-title`. Supporting paragraphs use the body/control range, while captions and state labels use `caption`. The page introduction is (15px), reducing to body size on phones.

Working links, refresh controls, and the current-state caption use (13px) after the final cascade overrides. At the phone breakpoint the refresh control and topbar link use (12px). Secondary captions remain compact; do not apply the smallest preview caption style to primary controls. Text stays in sentence case apart from existing brand lettering. Apply-area explanation has a (45ch) maximum width; the footer explanation has a (65ch) maximum width.

## Layout

The admin shell has a (220px) navigation rail and a flexible workspace. The topbar is (64px) tall. The main sheet starts below it, with top padding (38px), fluid horizontal padding `clamp(24px, 4vw, 64px)`, and bottom padding (24px). At widths from (1600px), horizontal sheet padding uses `max(64px, calc((100vw - 1450px) / 2))`.

The current-state strip precedes a two-column, equal-width site grid with the `grid-gap` spacing. Each card contains a radio selection header, an image preview, and a footer with a separate preview link. The apply area stays in document flow beneath the cards and is separated by a thin line. Its explanation and controls share a row on wider screens.

- At a maximum width of (1100px), the rail narrows to (180px); card footers stack; the panel caption and preview product caption disappear.
- At a maximum width of (800px), the rail becomes a horizontal header, the topbar becomes (48px) tall, the footer stacks, and sheet padding becomes (28px 24px 24px). The two-column site grid remains.
- At a maximum width of (560px), the site grid becomes one column with a (16px) gap; the apply area stacks and its controls fill the available width. Sheet padding becomes (26px 16px 24px); navigation remains visible. Breadcrumb context condenses to the current section, and the live strip may wrap.

Preview height is `clamp(180px, 19vw, 270px)` on larger screens, (210px) at the tablet breakpoint, and (200px) on phones. The storefronts' own mobile-first (900px) layout breakpoint is separate and remains defined in their stylesheets.

## Elevation & Depth

The admin has no box shadows, raised hover cards, blur, or surface gradients. Depth comes from the frame / sheet / live-strip tones, thin borders, and spacing. Selection changes the card border and checked indicator. Keyboard focus adds a (3px) solid blue outline with a (4px) offset on links, inputs, and buttons; the site card's focus container uses a (3px) offset.

The admin declares no transition or animation tokens. Its hover, selection, loading, and feedback changes are immediate. Existing storefront motion remains governed by the storefront stylesheets.

## Shapes

Controls have gently curved corners, with the input, action/navigation controls, live strip, site cards, and outer sheet using progressively larger radii from frontmatter. Cards clip their contents to the outer curve. The radio selection marker is a (23px) circle; the active-status dot is a (6px) circle. Other borders remain thin (1px). Icons are simple inline outlines with rounded caps and joins, using a (1.6px) stroke in a (24 × 24) viewBox.

## Components

### Buttons

The primary action is a compact teal rectangle with white text, a minimum height of (44px), centered content, and a (12px) icon gap. Hover uses the deeper teal; disabled state uses a pale fill and muted text. The primary icon is (17px). There is no distinct animated press state. Native disabled behavior prevents submission while loading, saving, unchanged, or unavailable.

Refresh is an underlined text button with no fill or border. It keeps the global focus treatment and becomes translucent (opacity 0.6) when disabled. Preview and open-site links reveal an underline on hover and use an arrow icon. Hover and focus are separate states.

### Inputs / Fields

The password field has a visible label, thin control-colored border, rounded input corners, horizontal inset, and the recorded input height. It appears only when a changed selection requires a password. Focus uses the shared blue outline. Feedback is written below the apply area; a rejected password returns focus to the field. No custom invalid-border style is implemented.

### Navigation

The current “Сайты” destination uses a tinted background, semibold text, an outline page icon, and a small count. It has a minimum height of (44px), no decorative hover transformation, and the shared keyboard focus outline. The desktop rail becomes a compact horizontal header at the tablet breakpoint.

### Site-selection cards

A native radio control drives each card. The selected card gets a teal border and a filled circular check indicator; selecting a card alone does not claim that the public site has changed. The separate active label reflects confirmed server state. Focus on the visually hidden native radio outlines the whole card. The preview link is a separate control outside the radio label.

The Columbia preview pairs the two existing product images on their studio ground with the navy brand name. The KRYGA preview combines its existing winter runner photograph with a teal ground and white wordmark. These compositions identify the existing storefronts rather than introduce new identity assets.

**Asset provenance:** Admin previews reuse existing `public/img/hero-runner-900.webp` and `columbia-site/public/img/columbia/men-front-640.webp` / `columbia-site/public/img/columbia/women-front-640.webp`. No new images were produced for this admin extension. Runtime references are `/img/hero-runner-900.webp` and `/img/columbia/{men,women}-front-640.webp`. The images are decorative within already labeled site choices and use empty alternative text. This note records repository reuse; it makes no new claim about upstream authorship or licensing.

### Current-state strip and feedback

The live strip combines an outline globe, the current-site caption, the confirmed site name, an active dot plus text, and the refresh action. The globe is omitted on phones. The dot never carries state alone. Success and error messages occupy the in-flow feedback region, with live-region semantics; loading text replaces the displayed current-site name while a refresh is pending.

## Do's and Don'ts

### Do:

- **Do** preserve the existing storefront identities and use their stylesheets as authority when changing their own surfaces.
- **Do** use the documented admin roles for new controls within the working sheet.
- **Do** keep keyboard focus visible and state labels readable alongside their color cues.
- **Do** distinguish a selected replacement from the currently active public site.
- **Do** retain each preview's association with the actual storefront and record provenance for any future image change.

### Don't:

- **Don't** apply this admin sizing or rounded control system as a redesign of either storefront.
- **Don't** add shadows or motion to the admin without an intentional design change.
- **Don't** treat synthesized tonal-ramp values as shipped application tokens.
- **Don't** show a selected site as active until the server confirms the change.
