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
