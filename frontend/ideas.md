# WEST — Neon Transit: Design Brainstorm

## Design Approaches

<response>
<text>
## Approach A: "Cyberpunk Terminal" — Industrial Brutalism meets Neon Noir

**Design Movement:** Cyberpunk / Neo-Noir Industrial

**Core Principles:**
1. Raw data aesthetics — information is the hero, not decoration
2. Asymmetric tension — panels bleed off-screen, content fights for space
3. Neon-on-black contrast — maximum visual punch with zero compromise
4. Mechanical precision — sharp corners, monospaced numbers, grid-locked layouts

**Color Philosophy:**
Deep space black (#0A0A0F) as the void. Neon magenta (#D5006D) as the pulse of life — it signals urgency, action, and modernity. Teal (#00F0B5) as the counterpoint — the "all clear" signal. Purple (#B200FF) reserved for AI/machine intelligence. The palette evokes a night-ops command center.

**Layout Paradigm:**
Asymmetric split-screen: 70/30 or 60/40 splits dominate. Navigation is a vertical left rail with icon+label. Content panels overlap slightly, creating depth. The map always bleeds to the edge on desktop.

**Signature Elements:**
- Scanline overlay (subtle, 2% opacity) on dark panels for CRT texture
- Blinking cursor animation on active status indicators
- Gradient borders (magenta → purple) on cards instead of solid borders

**Interaction Philosophy:**
Every interaction has a "system response" feel — buttons confirm with a brief glow pulse, transitions feel like data loading. Hover states reveal hidden metadata.

**Animation:**
- Card entrance: slide-in from right with 40ms stagger, opacity 0→1 + translateX(20px→0)
- Swipe cards: physics-based rotation + translation, rubber-band on over-swipe
- Map markers: CSS pulse animation at 2s interval for congested ports
- Theme switch: radial wipe from toggle button position

**Typography System:**
- Logo: Orbitron 700 — the machine speaks
- H1-H2: Manrope 600 — authoritative but readable
- Body: Inter 400 — neutral, efficient
- Numbers/stats: JetBrains Mono 500 — data is sacred
</text>
<probability>0.08</probability>
</response>

<response>
<text>
## Approach B: "Holographic HUD" — Aerospace Dashboard

**Design Movement:** Aerospace UI / Holographic Interface

**Core Principles:**
1. Glass morphism with neon edge lighting
2. Circular/radial data visualization as primary language
3. Layered depth — foreground HUD elements float above map/content
4. Information density without clutter — progressive disclosure

**Color Philosophy:**
Near-black (#0A0A0F) base with translucent glass panels (rgba white at 4-8%). Neon pink (#D5006D) as the primary signal color. Teal as success/clear. The glass panels create a sense of floating holographic displays.

**Layout Paradigm:**
Full-bleed map as background layer. HUD panels float as glass cards. Navigation is a top bar that becomes a thin strip on scroll. Radial progress indicators replace linear bars.

**Signature Elements:**
- Glass panels with backdrop-blur and subtle neon border glow
- Radial/arc progress bars for port congestion
- Hexagonal grid pattern as subtle background texture

**Interaction Philosophy:**
Interactions feel like manipulating a holographic display — elements respond with depth shifts (subtle translateZ), glass panels ripple on click.

**Animation:**
- Panel entrance: scale(0.95)→1 + blur(4px)→0 + opacity 0→1
- Data updates: number counters animate with easing
- Map: smooth camera pan/zoom on selection

**Typography System:**
- Logo: Orbitron 700
- Headers: Manrope 600
- Body: Inter 400
- Data: JetBrains Mono
</text>
<probability>0.06</probability>
</response>

<response>
<text>
## Approach C: "Signal & Noise" — Brutalist Data Terminal

**Design Movement:** Brutalist Web + Data Journalism

**Core Principles:**
1. Content-first — no decorative chrome, every pixel earns its place
2. High contrast as the primary aesthetic tool
3. Typographic hierarchy as visual structure
4. Monochrome base with surgical neon accents

**Color Philosophy:**
Pure black base, white text, with neon magenta as the ONLY accent color. No gradients, no glass. The restraint makes every pink element scream for attention.

**Layout Paradigm:**
Newspaper-style grid. Dense information tables. Navigation is a horizontal rule with text links. Brutalist asymmetry — content blocks of different heights sit side by side.

**Signature Elements:**
- Thick horizontal rules as section dividers
- Oversized statistics (200px+ numbers) as visual anchors
- Monospaced type for all data

**Interaction Philosophy:**
Minimal animation — only functional feedback. Hover = underline. Active = background fill. No gratuitous motion.

**Animation:**
- Minimal: only opacity transitions at 150ms
- Number counters on dashboard load
- No card animations

**Typography System:**
- Everything: JetBrains Mono — pure data terminal
- Accents: Orbitron for the logo only
</text>
<probability>0.05</probability>
</response>

---

## Selected Approach: **A — "Cyberpunk Terminal"**

This approach best matches the WEST specification's vision of a "futuristic hub, night terminal, pulsing data." The asymmetric split-screen layout maximizes the map's visual impact while keeping data panels accessible. The neon-on-black palette with scanline texture creates the memorable "product of the future" feel described in the pitch.
