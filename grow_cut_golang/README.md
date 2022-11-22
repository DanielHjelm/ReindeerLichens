# Cellular Growth Algorithm

This algorithm utilizes local color norms and classified labels in order to decide if a pixel belongs to the background or foreground

To use: visit <a href=http://localhost:3000>Image overview (Localhost:3000)</a>. Thits site lists all available images, select an image by clicking on the corresponding file name. You will be redirected to another view where you can start marking foreground by either clicking left mouse button or by clicking and dragging. Start processing the image by clicking <div style='    -webkit-text-size-adjust: 100%;
    tab-size: 4;
    font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
    font-feature-settings: normal;
    line-height: inherit;
    box-sizing: border-box;
    border-style: solid;
    --tw-border-spacing-x: 0;
    --tw-border-spacing-y: 0;
    --tw-translate-x: 0;
    --tw-translate-y: 0;
    --tw-rotate: 0;
    --tw-skew-x: 0;
    --tw-skew-y: 0;
    --tw-scale-x: 1;
    --tw-scale-y: 1;
    --tw-pan-x: ;
    --tw-pan-y: ;
    --tw-pinch-zoom: ;
    --tw-scroll-snap-strictness: proximity;
    --tw-ordinal: ;
    --tw-slashed-zero: ;
    --tw-numeric-figure: ;
    --tw-numeric-spacing: ;
    --tw-numeric-fraction: ;
    --tw-ring-inset: ;
    --tw-ring-offset-width: 0px;
    --tw-ring-offset-color: #fff;
    --tw-ring-color: rgb(59 130 246 / 0.5);
    --tw-ring-offset-shadow: 0 0 #0000;
    --tw-ring-shadow: 0 0 #0000;
    --tw-shadow: 0 0 #0000;
    --tw-shadow-colored: 0 0 #0000;
    --tw-blur: ;
    --tw-brightness: ;
    --tw-contrast: ;
    --tw-grayscale: ;
    --tw-hue-rotate: ;
    --tw-invert: ;
    --tw-saturate: ;
    --tw-sepia: ;
    --tw-drop-shadow: ;
    --tw-backdrop-blur: ;
    --tw-backdrop-brightness: ;
    --tw-backdrop-contrast: ;
    --tw-backdrop-grayscale: ;
    --tw-backdrop-hue-rotate: ;
    --tw-backdrop-invert: ;
    --tw-backdrop-opacity: ;
    --tw-backdrop-saturate: ;
    --tw-backdrop-sepia: ;
    z-index: 20;
    max-height: 3rem;
    max-width: 8rem;
    cursor: pointer;
    border-radius: 0.25rem;
    border-width: 1px;
    --tw-border-opacity: 1;
    border-color: rgb(0 0 0 / var(--tw-border-opacity));
    --tw-bg-opacity: 1;
    background-color: rgb(29 78 216 / var(--tw-bg-opacity));
    padding-left: 1.5rem;
    padding-right: 1.5rem;
    font-weight: 700;
    --tw-text-opacity: 1;
    color: rgb(255 255 255 / var(--tw-text-opacity));'><p style="margin:10px">Send</p> </div>

> Note that the golang application must be running before clicking on send

To clear a drawing it is easiest to reload the page

# Setup

1. <a href="https://go.dev/doc/install">Install GO</a>

2. <a href="https://nodejs.org/en/">Install NodeJs</a>

3. Start web server

   - cd into web_server
   - RUN: npm ci
   - RUN: npm run dev

4. Start golang server
   - RUN: go run main.go
