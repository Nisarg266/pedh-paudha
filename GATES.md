# Gates: Homepage Width and Card Carousels

OWNS: assets/pedhpaudha.css, assets/pedhpaudha.js, sections/pedhpaudha-*.liquid, layout/theme.liquid

Scope: Widen and align homepage sections, keep the product collection in a responsive four-column grid, retain arrow-controlled carousels where requested, and restore the equipment collage.

- [x] G1: Homepage sections use one consistent wider content width.
  EVIDENCE: Shared `--pp-container: 1480px`; sourcing wrapper explicitly uses the same token.
- [x] G2: Product cards form four columns on desktop (two rows for eight products) and show the original six products on phones; the equipment section uses the earlier asymmetric collage layout.
  EVIDENCE: `#pp-products-container` is a four-column grid above 1199px and two columns below; the two added coming-soon placeholders are hidden only below 600px; `pedhpaudha-machinery.liquid` restores editorial, lower-left, center and right image columns.
- [x] G3: Card sliders and phone product filters adapt to device widths without clipping content; growing goals retain the five-card mosaic layout.
  EVIDENCE: Kits, benefits, blog and testimonials show three complete cards on desktop, two on tablet and one on phone; phone filter pills scroll with arrow controls and reduced-motion support; the goals section uses its original responsive grid collage.
- [x] G4: Carousel controls remain keyboard accessible and respect reduced-motion preferences.
  EVIDENCE: Retained carousel tracks are focusable labeled regions; buttons have directional labels, disabled end states and focus rings; reduced motion switches smooth scrolling to auto.
- [x] G5: A new responsive, animated growing journey section is part of the homepage.
  EVIDENCE: Journey markup is included at the top of the existing `pedhpaudha-machinery.liquid` section, so `templates/index.json` references only section files already present; the linked growth path animates on scroll, ambient accents drift gently, and reduced-motion preferences disable movement.
