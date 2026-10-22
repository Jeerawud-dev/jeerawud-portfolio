# Project Case Study — Content & Image Guide

Click any project image or **View details** under `03 / PROJECTS` to open
a full-width case-study panel that supports both Light/Dark themes.

The panel includes:
- Title, category, short project summary, period and company (the existing Google Sheets feed).
- Scope and role fields (editable in `project-cases.js`).
- Four-stage simplified system/technology diagram.
- Technology tags from the main Portfolio sheet.
- Work areas and project highlights.
- **Machine / process photos** and **software UI screenshots** (image galleries).
- Optional external project link when provided.

## Where to edit each field

| Content | Source |
| --- | --- |
| Project title / category / description | Google Sheets → `Portfolio` |
| Period / company / tech / image URL / external link | Google Sheets → `Portfolio` |
| System diagram labels, scope, role and highlights | GitHub → `project-cases.js` |
| Machine gallery and UI screenshots | GitHub → `project-cases.js` |

The current live Google Apps Script endpoint is not confirmed to export an
independent ProjectDetails tab. Therefore these extra case-study fields
are stored in `project-cases.js` and **work immediately without deploying
another backend**. Do not assume editing a new Sheet tab alone would update
these extra fields. A future Apps Script update can serve a `projectDetails`
map and the frontend already accepts it as an override.

## Add an actual machine photo

1. Upload the photo to your GitHub repository, for example `image/Coatingmachine-02.jpg`.
2. Edit `project-cases.js`.
3. Find the entry with the **exact** project title used in Google Sheets.
4. Add the image URL and caption to its `machineImages` array:

```js
"Automated Coating Machine": {
  // Keep the existing scope, role, diagram and highlights.
  machineImages: [
    { url: "image/Coatingmachine-02.jpg", caption: "Machine overview" }
  ],
  uiImages: [
    { url: "image/coating-recipe-screen.png", caption: "Recipe setup" },
    { url: "image/coating-motion-editor.png", caption: "Motion path editor" }
  ]
}
```

The gallery only displays images that have valid file URLs. Invalid/missing
images are not presented as actual machine screenshots. The primary image
from the Portfolio sheet `Project Image URL` column is also automatically
included in the machine gallery.

For images that do not yet exist, leave the array empty:
`uiImages: []`. The case-study panel shows a clearly labeled empty slot.

## Edit the system diagram

Each project has a `diagram` array with stages:

```js
diagram: [
  { title: "Machine signals", detail: "Industrial I/O" },
  { title: "Motion control", detail: "Taught paths" },
  { title: "PC application", detail: "C# · WPF" },
  { title: "Factory links", detail: "MES · PQM · CFX+" }
]
```

Only describe hardware, signal flow, process parameters or UI features
that your project actually used. This is a **simplified conceptual diagram**,
not a control wiring diagram.

## Image recommendations

- Machine: 16:9 or 3:2 JPEG/WebP, ideally 1200–1800px wide.
- UI screenshots: clear PNG/WebP captured from your real software.
- Use descriptive captions; 1–4 images per category usually looks balanced.
- Remove employee, customer, production, company or security information
  that is confidential or not approved for public posting.
- Files must be pushed to GitHub to become visible on the portfolio.

## Design and behavior

- Clicking either the project image or **View details** opens the panel.
- **Close (X)**, **Escape**, outside dialog click and **Back to projects** close it.
- The panel is scrollable on desktop and mobile.
- The system map shows 4–6 responsive blocks with directional arrows.
- No invented performance figures, throughput, costs or ROI are displayed.
- PCB light-theme cursor opacity is intentionally **0.20** (reading: **0.012**)
  in the final-loaded `project-case.css`, overriding older more intense rules.

If you later change the existing Google Apps Script to provide
`data.projectDetails` as a title-keyed object, the frontend can merge it over
local `project-cases.js` data without changing the detail panel.
