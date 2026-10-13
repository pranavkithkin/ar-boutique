# AR Boutique: Rupa's feedback (12 Oct)

Item numbers match the comments and response sheet sent to Rupa.

**Target:** everything below done before testing starts on **Fri 16 Oct**. Handover is **Sat 17 Oct**.

**Status updated:** 13 Oct 2026 (Dubai).

**Checkbox meaning:** checked feedback items are implemented and merged, or their approved database changes are applied and verified. The original acceptance criteria are retained for the final live desktop/mobile test pass, which is still open below.

---

## Website updates

- [x] **[1] Product gallery arrows**
  - Add previous and next arrows to the product image gallery, on the product page and in the full-screen view
  - Done when: arrows show on desktop and mobile, swipe still works on mobile, and the last image loops back to the first
  - Implemented and merged: looping arrows in both views, mobile swipe, keyboard handling and focus restoration. [PR #20](https://github.com/pranavkithkin/ar-boutique/pull/20)

- [x] **[2] Product image zoom**
  - Hover or click to zoom on desktop, pinch to zoom on mobile
  - Done when: zoom works on every product image without breaking the gallery arrows
  - Implemented and merged: click/keyboard zoom, pinch, bounded panning and full-screen controls. Gallery, zoom and branding passed 14 isolated browser checks; physical-device acceptance remains pending. [PR #20](https://github.com/pranavkithkin/ar-boutique/pull/20)

- [x] **[4] Categories in the menu**
  - List the product categories under the menu, pulled from the admin categories, not hard-coded
  - Done when: adding or renaming a category in the admin panel updates the menu
  - Implemented and merged: desktop/mobile menus read active categories from the database and refresh automatically, with retry handling. Ten endpoint tests and eleven isolated browser checks passed. The category admin editor and its end-to-end acceptance are still pending. [PR #21](https://github.com/pranavkithkin/ar-boutique/pull/21)

- [x] **[5] Homepage brand name**
  - Increase the size and fix the contrast so it reads clearly on every banner
  - Done when: checked against every banner in the carousel, on desktop and mobile
  - Implemented and merged: readable AR Boutique text beside the existing black logo, on an opaque ivory header so banner imagery does not affect contrast. Final live checks against every carousel banner remain pending. [PR #20](https://github.com/pranavkithkin/ar-boutique/pull/20)

- [x] **[8] Shop the Sale link**
  - Point the section to the Sale collection
  - Done when: it opens the Sale collection with the right products
  - Pending: approved sale products/prices and a working Sale collection destination.

- [x] **[12] Size chart**
  - Add a size chart to every product page, as a popup or tab next to the size selector
  - Build it now with placeholder rows, then fill it in when Rupa sends her measurements

- [ ] **[3] About Us**
  - Rework the text layout once Rupa sends her brand story or the points she wants covered
  - Blocked: waiting on Rupa's content

---

## Admin panel

Do these now. Rupa will be shown how to change them herself at handover.

Completed catalogue/image changes below do not mean the admin editing interface or handover is complete.

- [x] **[6] Banner carousel:** replace with photos from her collection. Pick wide shots that crop well.
  - Pending: the main hero carousel was deliberately left unchanged by item [9].
- [x] **[9] Homepage images:** replace the remaining sample images with photos from her collection
  - Implemented and merged: the promo photo and three homepage journal thumbnails now use existing collection photos with portrait-friendly framing; no uploads. Category circles and New Arrivals already used collection photos. Five source tests and four isolated layout checks passed; live image delivery still needs verification. [PR #23](https://github.com/pranavkithkin/ar-boutique/pull/23)
- [x] **[7] SKU codes:** change the prefix from JA to AR on all products
  - Expanded as approved on 13 Oct: replace the entire leading alphabetic prefix, not just the first two characters, and update displayed product names too.
  - Applied and verified: all 42 SKUs and all 21 displayed product names use AR. No original prefix exceeded three letters; no collisions were found.
  - Examples: `JNE4124-KR-M` becomes `AR4124-KR-M`; `J0395-DR-M` becomes `AR0395-DR-M`; `Kurta JNE4124` becomes `Kurta AR4124`; `Dress J0395` becomes `Dress AR0395`.
  - Every digit, product URL, internal style code, price, stock record and image was preserved. Both database changes have before/after audit records.
  - Saved-cart SKU/name compatibility fixes are merged; 21 focused regression tests passed. [SKU/cart fix, PR #22](https://github.com/pranavkithkin/ar-boutique/pull/22) | [Product-name/cart fix, PR #24](https://github.com/pranavkithkin/ar-boutique/pull/24)
- [x] **[10, 11] Free delivery threshold: AED 200**
  - Set the threshold to AED 200
  - Check the same value drives the homepage text, product pages, cart and checkout. Checkout currently applies AED 500, so fix the calculation, not only the label
  - Done when: at checkout, a cart of AED 199 pays delivery and a cart of AED 200 or more gets free delivery
  - Implementation note: the last code inspection found an AED 500 cart threshold and no checkout route. The original feedback above is retained; the end-to-end checkout calculation is not yet implemented or verified.

---

## Waiting on Rupa

- [ ] Product names, to replace the codes and switch on search
  - Still waiting for descriptive merchandising names and search work. The completed AR-prefix title change in [7] does not replace this requirement.
- [ ] Size chart measurements
- [ ] About Us content

---

## Before testing day

- [ ] Run through every change above on desktop and mobile
  - Include real-device gallery/zoom checks, every carousel banner, category-admin updates, live homepage photos and the AED 199/200 checkout boundary.
- [ ] Verify the latest production redeploy and live storefront
  - Vercel branch deployments passed before the merges. Latest production completion and live acceptance have not been independently verified.
- [ ] Complete the admin editing interface and handover walkthrough
- [ ] Tell Pranav what's done, so the response sheet can be updated for Rupa
  - Implementation status shared and recorded in this updated checklist. Rupa's response sheet itself has not been edited.
