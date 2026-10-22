# AR Boutique: End-to-End Product & Catalogue Manual Testing Guide

This guide walks you step-by-step through testing all product management features on your local environment (`http://localhost:3000`).

---

## 1. Overview of AR Boutique Catalogue Hierarchy (ADR-029)

Every garment follows this 3-tier hierarchy:
```
1. Product (Title, Slug, Category, Description, Status)
   └── 2. Colourway (Colour, Client Style Code, Garment Specs, Photos)
        └── 3. Variant / SKU (Client SKU, Size, Price in AED, Live Stock)
```

---

## 2. Step-by-Step: Adding Colourways, Photos & Variants

Navigate to your newly created product:
👉 `http://localhost:3000/admin/products/810cb4a2-9f6a-4686-99f7-ea36d51f5534`

### Step 2.1: Add a Product Colourway
1. Scroll down to the **"Variants, SKUs & Stock Management"** section.
2. Click **"+ Add Colourway"** (or "+ Add Another Colourway to Product").
3. A modal opens:
   - **Select Colour**: Choose from existing boutique colours (e.g. *Emerald Green*, *Cream*, *Midnight Black*, *Ruby Red*) or enter a new colour name.
   - **Client Style Code**: Enter the client's style code (e.g. `AR-101` or `J0478`).
   - Click **"Create Colourway"**.
4. A card will appear for that colourway with its Style Code and garment attribute fields.

### Step 2.2: Fill Garment Specifications (Optional)
Inside the colourway card:
1. You will see 13 client stock sheet specification inputs:
   - `Top Portal Fabric` (e.g. *Pure Organza Silk*)
   - `Top Neck Details` (e.g. *Round Neck*)
   - `Top Sleeve Details` (e.g. *Full Sleeves*)
   - `Top Pattern Type` (e.g. *Hand Embroidered*)
   - `BTM Fabric Type` (e.g. *Raw Silk*)
   - `DPT Fabric Type` (e.g. *Organza*)
   - `Package Contains` (e.g. *Top, Bottom & Dupatta*)
2. Click **"Save Colourway Specs"**. A green checkmark confirms it is saved.

### Step 2.3: Upload Garment Photos
1. In the **"Garment Photos & Media"** area inside the colourway card:
   - Drag & drop or click **"Browse Photos"** to upload 1 or more images (`.jpg`, `.png`, `.webp`).
   - The photo will upload directly to Cloudinary and index into `public.product_images`.
2. Notice:
   - The first photo automatically becomes the **Main Cover Photo**.
   - Hovering over a photo gives you a star to **Set as Main** or a trash icon to **Delete**.

### Step 2.4: Add Variant SKUs
In the **"Variant SKUs & Inventory Stock"** section at the bottom of the colourway card:
1. Click **"+ Add Variant / SKU"**.
2. An inline form opens with 5 fields:
   - **Client SKU**: Enter the exact SKU string (e.g. `AR-101-M`).
   - **Size**: Select from the dropdown (e.g. `M`, `L`, `XL`, `XXL`, or leave blank for Free Size).
   - **Price (AED)**: Enter the selling price (e.g. `850.00`).
   - **Compare-at Price (AED)**: (Optional) Strike-through retail price (e.g. `950.00`).
   - **Opening Stock Quantity**: Enter initial inventory (e.g. `10`).
3. Click **"Save Variant"**.
4. The variant appears in the table with its size, price, and on-hand stock.
5. Repeat for other sizes (e.g. SKU `AR-101-XL`, Size `XL`, Price `850.00`, Stock `5`).

---

## 3. Step-by-Step: Testing Inventory Adjustments & Stock Ledger

1. Next to any variant row, look at the **"Stock On Hand"** column.
2. Click **"Adjust Stock"** (pencil icon).
3. In the **Stock Adjustment Modal**:
   - Current stock is shown.
   - Enter a **New On-Hand Count** (e.g. change `10` to `8` or `15`).
   - Select an **Audit Reason** (`restock`, `correction`, `damaged`, `offline sale`, etc.).
   - (Optional) Add an internal note (e.g. *"Damaged in transit inspection"*).
   - Click **"Confirm Adjustment"**.
4. Notice:
   - The on-hand count immediately updates.
   - The **"Available to Sell"** counter updates in the top overview strip.
   - An immutable row is created in `public.inventory_adjustments` for compliance.

---

## 4. Step-by-Step: Testing the Publish Readiness Checklist (TASK-037)

On the right-hand sidebar of `/admin/products/[id]`:
1. Find the **"Publish Readiness Checklist"** card.
2. It evaluates 3 strict rules in real-time:
   - [x] **At least one visible colourway has photos**: Shows uploaded photo count.
   - [x] **At least one active SKU exists**: Shows active variant count.
   - [x] **All active SKUs have an AED selling price**: Warns if any price is missing or 0.
3. **Draft Guard**: If any rule fails, the **"Published"** status option is disabled and an alert explains why.
4. Once all 3 rules pass, select **"Published"** from the Catalogue Status dropdown and click **"Save Product Changes"**.

---

## 5. Step-by-Step: Testing Storefront PDP Experience (TASK-041)

Once published:
1. Click **"View in Store"** (top right) or visit `http://localhost:3000/collections/[your-slug]` (or via the Search modal `Cmd+K`).
2. Test the following features:
   - **Multi-colour Switcher**: If you added multiple colourways, circular swatches appear. Clicking a swatch swaps the gallery photos and updates the URL with `?colour=...`.
   - **Dynamic Size Availability**: Only sizes matching the selected colourway appear.
   - **Scarcity Badge**: If stock is $\le 3$, an *"Only N left in stock - order soon"* notice appears. If stock is 0, the size is struck-through and disabled.
   - **Mobile Sticky Add-to-Bag**: On mobile (or resize browser to < 768px), scroll past the primary buy button. A sticky bar slides in from the bottom with photo, title, price, and 1-click Add to Bag.

---

## 6. Step-by-Step: Testing Bulk Spreadsheet Export & Sample Template

1. Navigate to `/admin/products`.
2. **Download Current Catalogue**:
   - Click **"DOWNLOAD CATALOGUE"** in the top toolbar.
   - Verifies: downloads `AR-Boutique-Stock-YYYY-MM-DD.xlsx` with all 23 columns and all database variants.
3. **Bulk Edit / Import Modal**:
   - Click **"Bulk Edit / Import"**.
   - Notice the download bar: **"Need a sample sheet to fill and upload?"**.
   - Click **"Download Sample Template (.xlsx)"**.
   - Opens an Excel file with pre-filled sample rows and a dedicated **"Instructions & Guide"** tab.
   - Try modifying a sample SKU, price, or stock, then drag-and-drop the file into the upload zone to view the real-time **Diff Preview** before applying.

---

## 7. Quick Testing Checklist

| # | Test Case | Target URL | Expected Result | Pass? |
|---|---|---|---|:---:|
| 1 | Create Product | `/admin/products/new` | Saves as Draft, redirects to edit page | [ ] |
| 2 | Add Colourway | `/admin/products/[id]` | Colourway card created with style code | [ ] |
| 3 | Upload Photos | `/admin/products/[id]` | Uploads to Cloudinary, appears in gallery | [ ] |
| 4 | Add Variant SKU | `/admin/products/[id]` | Adds SKU with size, price, and initial stock | [ ] |
| 5 | Adjust Stock | `/admin/products/[id]` | Adjusts on-hand count with audit reason | [ ] |
| 6 | Publish Validation | `/admin/products/[id]` | "Published" locked until photo + priced SKU exist | [ ] |
| 7 | Storefront PDP | `/collections/[slug]` | Multi-colour gallery swaps, size selection works | [ ] |
| 8 | Scarcity Badge | `/collections/[slug]` | "Only N left" displays when stock $\le 3$ | [ ] |
| 9 | Mobile Sticky Bar | `/collections/[slug]` (mobile) | Bottom bar appears on scroll | [ ] |
| 10 | Download Template | `/admin/products` -> Bulk Edit | Downloads `.xlsx` with sample rows & guidelines | [ ] |
| 11 | Download Catalogue | `/admin/products` | Exports live 23-column stock sheet | [ ] |
