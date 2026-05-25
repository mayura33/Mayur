# Order Prefix Insights

Offline single-page dashboard for analyzing shipment/order exports by site prefix.

The app is intentionally built as plain HTML, CSS, and JavaScript in `index.html`, with no backend, build step, framework, CDN, or internet dependency. Users can open it locally and upload their own export files.

## Current project files

- `index.html` - complete offline app and parser logic.
- `Requirement.txt` - original user requirement notes.
- `Input/` - sample input folder used during development.

## How to run

Open `index.html` directly in Chrome or Edge, or serve the folder locally:

```powershell
python -m http.server 8765
```

Then open:

```text
http://127.0.0.1:8765/index.html
```

The localhost option is useful for in-app browser verification because direct `file://` navigation may be blocked.

## Supported uploads

- `.csv`
- `.xlsx`
- `.zip` containing CSV or XLSX files

Legacy binary `.xls` files are not supported by the offline parser. The app shows an error asking the user to save those files as `.xlsx` or `.csv`.

## Required columns

The uploaded data must include these columns:

- `Reference No.`
- `Current Status`
- `Product Description`

Header matching is normalized, so minor casing and spacing differences are tolerated.

## Current business rules

### Site prefix

Site prefix is extracted from `Reference No.` as the full leading text before the first digit.

Examples:

- `The31281` becomes `THE`
- `N12345` becomes `N`
- blank reference becomes `Unknown`

### Summary table

The site prefix summary groups rows by site prefix and shows:

- Total record count
- Delivered count
- RTO count
- Cancelled count
- Shipped + OFD count
- Other count
- Delivery ratio

RTO count combines:

- `RETURNING_TO_ORIGIN`
- `RETURNED_TO_ORIGIN`

Cancelled count includes:

- `CANCELLED`
- `CANCELED`

Shipped + OFD count combines:

- `SHIPPED`
- `OUT_FOR_DELIVERY`

The delivery ratio is calculated as:

```text
DELIVERED / (DELIVERED + RTO) * 100
```

where `RTO` is the combined RTO count above.

### Product insight table

Clicking a site prefix row opens product-level insight for that prefix. Product rows are grouped by `Product Description` and show the same status buckets and ratio.

## UI features

- Drag-and-drop upload
- Upload file button
- Site prefix summary table
- Clickable prefix rows
- Product insight drilldown
- Prefix/status search
- Product search
- Status filter
- Sortable table headers
- Summary CSV export
- Product CSV export
- Reset button
- Light/dark theme toggle
- Theme preference saved in `localStorage`

The old `Load sample` button was removed by request.

## Verification notes

During development, the sample zip in `Input/` loaded successfully with:

- 114 rows
- 2 prefixes
- Full-prefix grouping, for example `The...` grouped as `THE`

Browser verification confirmed:

- The `Load sample` button is gone
- The theme toggle works
- The shipped bucket label appears as `Shipped + OFD`
- `SHIPPED` and `OUT_FOR_DELIVERY` are counted in the same bucket

## Maintenance instruction for future AI/code changes

Whenever the app code is changed, update this `README.md` in the same turn.

Keep this file aligned with:

- New or changed business rules
- New columns or parsing behavior
- UI feature additions/removals
- Supported file formats
- Known limitations
- Verification results

This README is the handoff document for resuming the task in a later session.
