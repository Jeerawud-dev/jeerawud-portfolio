> **Live auto-sync setup:** See [PROJECT_GALLERY_LIVE_SETUP.md](PROJECT_GALLERY_LIVE_SETUP.md).
  When a read-only Apps Script `/exec` URL is configured, the circle reads
  ProjectGallery on each page load, including deletion to 1 or 0 entries.
  Until the endpoint is deployed, the project-gallery.js snapshot remains.

# Project Gallery → Large Circular Visualization

When someone clicks **View diagram** in **03 / PROJECTS**, a **larger,
translucent floating circular visualization** opens over the current page.
The website remains visible behind a frosted-glass layer (no new page or
new project-card row). Close by pressing **X**, **Esc**, or clicking outside.

## Source of diagram pictures and captions

**Google Sheets → ProjectGallery** is the intended source:

https://docs.google.com/spreadsheets/d/1wM6Im1jnWEq8fujHW48mb-kTH_tvv5cQXkiNBGRSjKM/edit

| Column | Name | Meaning |
|---|---|---|
| A | Project Title | **Must match** the Portfolio project title |
| B | Gallery Heading | The name displayed beside each circular thumbnail |
| C | Image URL | GitHub Pages relative image path or public HTTPS photo URL |
| D | Short Detail | Short selected-image explanation |
| E | Display Order | Number controlling placement around the circle |
| F | Visible | Yes / No |

The Sheet has been seeded with **25 headings** grouped into the six current
projects, based on the *already-published* system components, so existing
work is not lost. **Only one genuine image exists in the current Portfolio
data:** `image/Coatingmachine.jpg` for **Automated Coating Machine**.
All other items have blank Image URL cells; they show a clean engineering
icon, not invented or AI-generated machine photos.

An image placed in column C becomes a circular image thumbnail; selecting
it also shows a larger crop in the center with its heading and short detail.
The outer ring follows the item order, up to **six gallery items per project**.
If a project has no gallery records, its previous conceptual technology map
remains the fallback.

## Important: live sync versus current deployed Apps Script

Your existing Google Apps Script endpoint supplies the main `Portfolio`
rows, but has **not been verified to return ProjectGallery** yet. To make the
new UI work immediately, the 25 source rows from ProjectGallery were copied
into `project-gallery.js` on GitHub as a **verified snapshot**.

The browser reads:
1. `data.projectGallery` when the deployed portfolio Google Apps Script
   includes this array, otherwise
2. `window.PORTFOLIO_PROJECT_GALLERY` in `project-gallery.js`.

**Editing ProjectGallery alone will not refresh the published diagram until
the deployed Apps Script includes it or project-gallery.js is synced again.**
The source-of-truth tab, field names and precedence are ready for this
future live connection.

If you maintain the existing Apps Script, you can add a helper like:

```javascript
// Add to your EXISTING portfolio Apps Script project.
// Call this helper while assembling its current doGet JSON response:
//   response.projectGallery = getProjectGallery_();
function getProjectGallery_() {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("ProjectGallery");
  if (!sh || sh.getLastRow() < 2) return [];
  const values = sh.getRange(2, 1, sh.getLastRow() - 1, 6).getDisplayValues();
  return values.filter(row => row[0] && row[1] && row[5] !== "No").map(row => ({
    project: row[0],
    title: row[1],
    imageUrl: row[2],
    detail: row[3],
    order: Number(row[4]) || 0,
    visible: true
  }));
}
```

Do not replace the existing `doGet` function: merge the additional array
into its existing JSON response, then **deploy a new Web App version**.
If the Apps Script is standalone (not bound to the Sheet), use
`SpreadsheetApp.openById("1wM6Im1jnWEq8fujHW48mb-kTH_tvv5cQXkiNBGRSjKM")`
instead of `getActiveSpreadsheet()`. This snippet is provided as a guide;
the existing deployment has **not** been changed in this update.

## Add real project images

1. Upload the approved image into the GitHub repo (e.g. `image/coating-editor.png`).
2. Add a `ProjectGallery` row using the *exact* project title in column A.
3. Fill Gallery Heading, Image URL, Short Detail and Display Order.
4. Set Visible to Yes.
5. Until live Apps Script gallery support is deployed, also sync the new row
   into GitHub `project-gallery.js`.

Use real screenshots of your WPF interface for software Gallery items,
and actual equipment/process photos for hardware Gallery items. Remove
sensitive customer, MES, serial number, internal IP, employee, or
proprietary data before publishing.

## Design

- Large ring with thumbnail + heading for each Gallery item.
- Center shows a larger photo if that item has an image.
- Small translucent panel on the right shows the selected Gallery Heading
  and Short Detail.
- Fallback icon appears when a Gallery Image URL is blank or broken.
- Up to six items to keep the circular layout readable.
- Light is still the default; Dark remains available.
- The floating layer respects reduced-motion preferences and keyboard use.


## Deleting Gallery entries

The number of Gallery circles is determined by the actual visible rows with
that project title in **ProjectGallery**, not by a fixed four-stage diagram.

- **1 row** → 1 large circular gallery item and its caption.
- **2–6 rows** → exactly that many clickable orbit nodes.
- **0 rows** → an empty-gallery notice, never four old workflow nodes.
- Rows marked **Visible = No** are excluded.

The deployed Google Apps Script currently has no confirmed live gallery feed.
The site uses `project-gallery.js`, a snapshot of the existing Sheet.
When you edit/delete Gallery rows, synchronize that file to the Sheet or
extend the Apps Script's JSON response with live `projectGallery` to make
changes update automatically.

For this fix, the snapshot was refreshed from the live Sheet (22 remaining
Gallery rows across six projects). Thermal Paste Dispensing Machine now has
one row instead of its former four. JavaScript and CSS asset links have
version query strings to bypass a stale browser cache.
