# NAoya-style Hub

Clean-room UI recreation based on the layout and interaction pattern of the provided reference website.

Open `index.html` in a browser or run:
`python3 -m http.server 8000`

Then visit `http://localhost:8000`.

Customize the text in `index.html`, colors/layout in `style.css`, and behavior in `script.js`.


Gallery v8: the Gallery tab uses a vanilla JavaScript 3D depth carousel with drag/swipe, keyboard arrows, navigation buttons, auto-advance, dots, and click-to-preview.

## Dark Glitch Hover v11
Keeps the existing dark Naoya Hub design and replaces purple hover glow on interactive UI with a CSS-only cyan/red glitch effect. No Persona 1 restyle was applied.

## v12 — Video-inspired glass UI
Dark atmospheric background + translucent glass dashboard cards inspired by the supplied screen recording. Existing Discord status, Facebook link, Depth Carousel, full Notepad, AFK rolling counter, Elastic Sliders, audio player and glitch hover are retained.


## v13 — Video background + refined glitch
- Uses `assets/video/hu-tao-background.mp4` as a fullscreen looping background.
- Source video was converted to browser-friendly H.264 1080p/30fps for smoother web playback.
- Hover glitch now uses short RGB split/slice/scan bursts instead of constant shaking.
- Existing Discord, Facebook, Depth Carousel, Elastic Slider, AFK Counter and Notepad features remain unchanged.

Performance v14: background video is optimized to 720p/24fps, fullscreen CSS video filters are removed, glass blur is reduced, and the background video pauses while the tab is hidden.


V15: Added a draggable/clickable profile-sidebar handle. On desktop it collapses to a compact icon rail; on tablet/mobile it tucks the profile drawer away. Main page content is constrained and centered for better focus.

## v16 mobile/performance pass
- Mobile/data-saver/low-memory devices use the Hu Tao poster instead of decoding the background video.
- Desktop keeps the animated background.
- Heavy backdrop blur is reduced to 0–2px on content cards.
- Touch devices disable glitch hover animation.
- Gallery carousel autoplay runs only while Gallery/Artwork is actually visible, and is disabled on touch/mobile.
- Discord presence polling reduced to every 45 seconds.
- Mobile UI now uses a compact profile header, collapsible profile/BGM area, centered content, and fixed bottom navigation dock.


## v17 light-mode optimization
- Rebalanced light mode so the Hu Tao background remains visible instead of being washed out by white overlays.
- Replaced flat white surfaces with cool translucent gray glass using no additional backdrop blur.
- Improved typography, border, nested-card and social-link contrast.
- Reworked light-mode navigation/hover to use neutral surfaces plus the existing cyan/red glitch accent instead of purple wash.
- Added dedicated light-mode styling for the v16 mobile bottom navigation, topbar and compact profile/BGM header.
- Kept the v16 performance rules: no extra continuous animations or expensive blur passes.
