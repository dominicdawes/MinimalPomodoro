
## Color Palette & CSS Variables

- `--bg`: `#0F0F0F`  
  - Window background and inner circle background.

- `--fg`: `#E0E0E0`  
  - Primary text and icon color.

- `--accent`: `#ff5722`  
  - Orange used for progress fill, active dots, primary button highlights.

- `--accent-light`: `rgba(255,87,34,0.3)`  
  - Semi-transparent orange for unfilled status dots.

- `--borders`: `#aaaaaa`  
  - Default border color for icon wrappers and adjustment squares.

- `--start-btn-bg`: `#4A4A4A`  
  - Background color for Start/Pause button.

- `--start-btn-fg`: `#1E1E1E`  
  - Text color for Start/Pause button.

- `--start-btn-border`: `#4A4A4A`  
  - Border color for Start/Pause button (same as background to create a flat look).

- `--shadow`: `0 2px 8px rgba(0,0,0,0.3)`  
  - Subtle drop shadow for primary buttons (if any).

## Global Layout & Sizing

- **Popup Container**  
  - Width & Height: 340 px (fixed).  
  - Border-radius on `<body>`: 8 px; inner `#app`: 30 px.  
  - Background: `var(--bg)`.  
  - Text color: `var(--fg)`; font family: `'Helvetica Neue', Helvetica, Arial, sans-serif`.

- **Icon Wrapper (`.icon-border-wrapper`)**  
  - Width & Height: 48 px.  
  - Border: 1 px solid `var(--borders)`.  
  - Border-radius: 50% (circle).  
  - Padding: 3 px (var(`--icon-breathing-room`)).  
  - Hover:  
    - Border-color: `#888888`.  
    - Background-color: `rgba(255,255,255,0.05)`.

- **Icon Buttons (`.icon-btn`)**  
  - Display: inline-block; width & height: 40 px.  
  - Background-color: `var(--fg)`.  
  - Mask-image: var(`--icon-…`) (SVG/PNG references defined in `:root`).  
  - Mask-repeat: no-repeat; mask-position: center; mask-size: contain.  
  - No border by default.

- **Primary Button (`.primary-btn`)**  
  - Background: `var(--start-btn-bg)`; color: `var(--start-btn-fg)`.  
  - Border: 1 px solid `var(--start-btn-border)`.  
  - Border-radius: 24 px.  
  - Padding: 0.75 rem top/bottom, 30 px left/right.  
  - Font-size: 1 rem; font-weight: 500.  
  - Cursor: pointer; transition: background 0.2s.

- **Skip Button (`.skip-fwd-btn`)**  
  - Font-size: 0.9 rem; font-weight: 500; color: `var(--fg)`.  
  - Padding: 0.5 rem top/bottom, 1 rem left/right.  
  - Opacity: 0.7 (enabled); hover → opacity: 1.  
  - Disabled state: `opacity: 0.4`; `pointer-events: none`.

## Donut Timer Styling

- **Wrapper (`.donut`)**  
  - Width & Height: 200 px; position: relative; margin: auto;  
  - Display: flex; align-items: center; justify-content: center.

- **Base Ring (`.donut::before`)**  
  - Content: ''; position: absolute; inset: 0;  
  - Background-color: `#333`; border-radius: 50%.

- **Progress Overlay (`.progress`)**  
  - Position: absolute; inset: 0; border-radius: 50%.  
  - Background: `conic-gradient(
      transparent 0deg,
      var(--accent) 0deg calc(var(--deg)),
      rgba(255,87,34,0.3) calc(var(--deg)) calc(var(--deg) + 10deg),
      transparent calc(var(--deg) + 10deg) 360deg
    )`.  
  - Transition: `all 0.45s ease-in`.

- **Head Dot (`.progress::before`)**  
  - Content: ''; position: absolute; width & height: 12 px;  
  - Background-color: `var(--accent)`; border-radius: 50%;  
  - Top & left: 50%; transform-origin: center;  
  - Transform: `rotate(calc(var(--deg) - 90deg)) translate(0, -94px)`.  
  - Opacity: controlled via `--progress-opacity` (0 when `var(--deg) ≤ 5deg`, 1 otherwise).

- **Inner Circle (`.inner`)**  
  - Position: absolute; inset: 12 px; background: `var(--bg)`; border-radius: 50%;  
  - Display: flex; flex-direction: column; align-items: center; justify-content: center.

- **Time Display (`#time-display`)**  
  - Font-size: 2.5 rem; font-weight: 300; color: `var(--fg)`.

- **Session Label (`#session-label`)**  
  - Font-size: 0.9 rem; letter-spacing: 1 px; margin-top: 0.25 rem; text-transform: uppercase; color: `var(--fg)`.

- **Status Dots (`.dot`)**  
  - Width & Height: 8 px; border-radius: 50%; margin: 0 2 px;  
  - Default `background-color: var(--accent-light)`;  
  - `.dot.filled` → `background-color: var(--accent)`.

## Completed View Styling

- **“COMPLETE” Text (`.completed-text`)**  
  - Font-size: 2.2 rem; color: `#FFFFFF`; margin-top: 30 px; margin-bottom: 10 px; text-align: center.

- **Clap Icons Container (`.clap-icons`)**  
  - Display: flex; gap: 2 px; justify-content: center;  
  - Each `.icon-btn.clap`: mask-image: `var(--icon-clap)`; `background-color: var(--fg)`; width & height: 48 px; mask-size: 48 px 48 px.

## Settings & Adjust View Styling

- **Header Title (`.title`)**  
  - Flex: 1; text-align: center; font-weight: 500; color: `var(--fg)`.

- **Tabs (`.tab`)**  
  - Flex: 1; padding: 0.5 rem top/bottom; background: none; border: none;  
  - Color: `var(--fg)`; font-weight: 500; cursor: pointer; opacity: 0.6;  
  - `.tab.active`: opacity: 1; border-bottom: 2 px solid `var(--accent)`.

- **Settings Item (`.setting-item`)**  
  - Display: flex; align-items: center; justify-content: space-between;  
  - Padding: 0.75 rem 1 rem; cursor: pointer; transition: background 0.2s;  
  - On hover: `background: rgba(255,255,255,0.05)`.

- **Arrow Icon (`.arrow`)**  
  - Width & Height: 16 px; mask-image: `var(--icon-forward)`; `background-color: var(--fg)`; opacity: 0.6.

- **Adjust View Container (`.adjust-body`)**  
  - Flex: 1; display: flex; align-items: center; justify-content: center; padding: 1 rem.

- **Adjust Content Wrapper (`.adjust-content-wrapper`)**  
  - Display: flex; flex-direction: column; align-items: center; gap: 2 rem; width: 100%.

- **Adjust Title (`.adjust-title`)**  
  - Font-size: 1.5 rem; font-weight: 500; color: `var(--fg)`; text-align: center.

- **Icon Square Wrapper (`.icon-square-wrapper`)**  
  - Width & Height: 36 px; border: 1 px solid `var(--borders)`; border-radius: 8 px;  
  - Box-sizing: border-box; display: flex; align-items: center; justify-content: center;  
  - On hover: `border-color: #888888`, `background: rgba(255,255,255,0.05)`.

- **Number Input (`.number-input`)**  
  - Width: 80 px; background: none; border: none except bottom 1 px solid `var(--fg)`;  
  - Font-size: 3 rem; text-align: center; color: `var(--fg)`; padding-bottom: 0.25 rem; outline: none;  
  - Hide native spinner controls.

- **Adjust Unit (`.adjust-unit`)**  
  - Font-size: 1 rem; color: `var(--fg)`; opacity: 0.8; text-align: center; padding-top: 0.25 rem.

## Icon Variables

- `--icon-clock16`: `url('/icons/clock-16.png')`  
- `--icon-clock48`: `url('/icons/clock-48.png')`  
- `--icon-eye`: `url('/icons/fluent-eye-16-reg.svg')`  
- `--icon-coffee`: `url('/icons/fluent-coffee-16-regular.svg')`  
- `--icon-reset`: `url('/icons/fluent-arrow-counterclockwise-16-reg.svg')`  
- `--icon-back`: `url('/icons/fluent-chevron-left-16-regular.svg')`  
- `--icon-forward`: `url('/icons/fluent-chevron-right-16-regular.svg')`  
- `--icon-plus`: `url('/icons/fluent-add-16-regular.svg')`  
- `--icon-minus`: `url('/icons/fluent-subtract-16-regular.svg')`  
- `--icon-settings`: `url('/icons/fluent-settings-16-regular.svg')`  
- `--icon-close`: `url('/icons/fluent-dismiss-16-regular.svg')`  
- `--icon-clap`: `url('/icons/clap-48.svg')` 

## Border Radii & Spacing

- **Global Border-Radius**  
  - `<body>`: 8 px  
  - `#app`: 30 px  
  - Icon wrappers: 50% (circle)  
  - Buttons: 24 px (pill shape)

- **Spacing & Padding**  
  - Popup padding is handled via individual containers (no global padding).  
  - Footer `.bottom-bar`: 0.75 rem top/bottom, 0.5 rem left/right.  
  - Icon-breathing-room: 3 px padding inside `.icon-border-wrapper`.  
  - Adjust view: 1 rem padding around `.adjust-body`.  
  - Settings items: 0.75 rem top/bottom, 1 rem left/right.  
  - Tabs: 0.5 rem top/bottom padding.

## Transitions & Hover States

- **Button Hover (Icon Wrappers)**  
  - Transition: `border-color 0.2s, background 0.2s`.  
  - On hover: border-color: `#888888`; background: `rgba(255,255,255,0.05)`.

- **Primary Button Hover**  
  - (Optional) Slight background darken, e.g., `background: rgba(74,74,74,0.8)`.

- **Adjust Item Hover**  
  - Background: `rgba(255,255,255,0.05)` on hover.

- **Donut Animation**  
  - Progress overlay transition: `all 0.45s ease-in`.

Use these variables and rules to ensure consistent styling across Timer, Completed, Settings, and Adjust views. Copy and paste as needed into `popup.css` or equivalent style files.
