---
name: web-asset-generator
description: Guidelines and directives for generating clean, modern, and production-ready visual assets, hero banners, and UI photography for web projects.
triggers:
  - image
  - banner
  - hero
  - photo
  - asset
  - graphic
  - illustration
  - visual
  - card-image
  - landing-page
---

# Web Visual Asset & Image Generation Standards

1. **Aspect Ratios for Web UI:**
   - **Hero Sections & Full Banners:** Always use `16:9` or ultrawide `21:9` to guarantee responsive viewport fit without unwanted letterboxing or cropping.
   - **Feature Cards, Testimonials & Avatars:** Use `1:1` (square) or `4:3` to ensure consistent card heights and clean grid alignment.
   - **Vertical Mobile Mockups & Story Cards:** Use `9:16` or `3:4` for mobile hero modules.

2. **Art Direction, Minimalist Composition & Negative Space:**
   - **Copy-Safe Breathing Room:** Provide intentional negative space (30%–45% clean, uncluttered background) on one side (left or right) so HTML headings and CTA buttons can sit over or beside the image without contrast clashing.
   - **Single Focal Subject:** Keep composition structured around a primary focal element; avoid chaotic multi-subject scenes that distract from the page purpose.
   - **Modern Lighting & Natural Aesthetic:** Emphasize natural soft lighting, commercial editorial photography, and balanced negative space.
   - **No Distorted Text or AI Artifacts:** Never generate embedded text inside images (to prevent AI text distortion); all typography belongs in HTML/CSS. Avoid cartoonish gloss, harsh lens flares, and hyper-saturated neon glows.

3. **UI Graphics & Framing Directives:**
   - **No Unrequested Device Frames:** When producing interface previews, render only the clean UI canvas or abstract application graphic; do not add bulky 3D laptops, angled smartphones, or stock hands holding devices unless explicitly requested.
   - **Vector & Minimalist 3D Aesthetic:** Favor clean claymorphism, isometric geometric minimalism, or modern flat editorial illustration over photorealistic stock clichés.

4. **Storage, Formats & Web Integration:**
   - **Target Directory:** Save generated images into the project's public static assets folder (e.g., `public/images/` or `assets/images/`).
   - **Semantic Kebab-Case Naming:** Use semantic, lowercase kebab-case filenames with modern web extensions (e.g., `hero-coffee-shop.webp`, `feature-analytics.webp`).
   - **Semantic Alt Text:** Always pair generated assets with descriptive, accessible `alt` text for screen readers.
