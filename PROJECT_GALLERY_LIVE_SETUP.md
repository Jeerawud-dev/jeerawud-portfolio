# Live ProjectGallery from Google Sheets (one-time activation)

This integration removes the need to keep editing `project-gallery.js` every
time you add, edit, hide or delete a project Gallery item.

## Current implementation

GitHub Pages now supports an **independent read-only Apps Script endpoint**
configured as `PROJECT_GALLERY_API_URL` in `config.js`.

- Source Sheet: `ProjectGallery` inside your existing portfolio spreadsheet.
- Source ID: `1wM6Im1jnWEq8fujHW48mb-kTH_tvv5cQXkiNBGRSjKM`.
- Live endpoint source: `google_apps_script/ProjectGalleryLive.gs`.
- Browser: `showcase.js` fetches current Gallery rows once per page load.
- Project cards: still use the **existing** profile/portfolio Apps Script URL.
- No Google API key, service-account JSON or login required from visitors.
- A delete that leaves **zero** rows produces **zero** Gallery circles; a
  delete that leaves **one** row produces **one** circle.

**Important: the new backend is not live until you deploy it.**
The `PROJECT_GALLERY_API_URL` setting is intentionally empty, so the current
site continues to use the previously synchronized `project-gallery.js`
snapshot until activation.

## Deploy — one time only

1. Open https://script.google.com/home/projects/create under the Google
   account that has access to the portfolio Google Sheet.
2. Give it a name such as `Jeerawud ProjectGallery Live`.
3. Replace the default `Code.gs` contents with the **full** content from:
   https://github.com/Jeerawud-dev/jeerawud-portfolio/blob/main/google_apps_script/ProjectGalleryLive.gs
4. Save the project.
5. Run the `testGalleryFeed` function in the Apps Script editor to authorize
   access. The logs should show visible ProjectGallery rows grouped by project.
6. Click **Deploy → New deployment**, choose **Web app**, and set:
   - **Execute as:** Me
   - **Who has access:** Anyone (including anonymous visitors)
7. Click Deploy, authorize if requested, and copy the new `/exec` URL.
8. In GitHub, edit `config.js` at repository root, setting:

   `PROJECT_GALLERY_API_URL: "https://script.google.com/macros/s/<deployment-id>/exec"`

   Do **not** change `GOOGLE_APPS_SCRIPT_URL`, used for the rest of the
   portfolio.
9. Commit the change to `main`, allow GitHub Pages to publish, and reload.

For convenience, you can send the new `/exec` URL in ChatGPT and have the
repository configuration updated for you.

## Verify

First open the new Apps Script URL with `?action=gallery` appended. It should
return JSON like:

```json
{
  "ok": true,
  "projectGallery": [
    {
      "project": "Thermal Paste Dispensing Machine",
      "title": "Machine setup",
      "imageUrl": "",
      "detail": "Parameters · Settings",
      "order": 1,
      "visible": true
    }
  ]
}
```

This is just an illustration. The live response will reflect the Sheet's
current rows and can be an **empty array** when everything is deleted.

Then open the Portfolio, select a project, and test:

- 1 visible row in the Sheet → 1 circular item in the floating chart.
- Add one more → 2 items after reloading the website.
- Set `Visible` to `No` → the item is hidden after reloading.
- Delete both → the chart shows `No gallery items` instead of old nodes.

The network request includes a unique timestamp to avoid caching. There is
no Apps Script `CacheService` for this endpoint.

## Failure behavior

If `PROJECT_GALLERY_API_URL` is set but the service is unreachable or
returns invalid JSONP, the chart shows **Gallery temporarily unavailable**
rather than displaying removed items from an outdated snapshot.

The browser logs the error to Developer Tools Console. If the original
Portfolio Apps Script independently returns its own `projectGallery` field,
that live array remains available as a fallback.

If the URL is blank, the gallery continues using the last known
`project-gallery.js` snapshot. It is **not automatically synchronized**.

## Editing after deployment

Only edit the `ProjectGallery` sheet:

| Column | Meaning |
| --- | --- |
| A · Project Title | Must match a Portfolio project title |
| B · Gallery Heading | Label around the circle |
| C · Image URL | Real image URL or relative `image/filename.jpg` |
| D · Short Detail | Short text inside the floating viewer |
| E · Display Order | Numerical sort order |
| F · Visible | Yes / No |

Changes will be seen the next time the visitor loads the site; no GitHub
commits needed after the one-time endpoint setup.

For changes to the Apps Script **source code**, use **Deploy → Manage
deployments → Edit → Version: New version → Deploy**. Editing the source alone
does not update a versioned public deployment. Your URL can stay the same.

## Privacy

This web app is **read-only** and returns only the explicitly public
ProjectGallery headings, captions and image links. It does not expose Profile,
other tabs, editor permissions or the spreadsheet's private data. Keep the
original spreadsheet unshared for public editing. Remember that anything you
place in ProjectGallery is intended to become publicly readable after
deployment, so avoid proprietary/internal machine screenshots and data.

## Architecture

```
Visitor opens GitHub Pages
    │
    ├── Existing Apps Script URL → portfolio project cards, profile settings
    │
    └── New read-only Gallery /exec endpoint → ProjectGallery!A:F
                  │
                  └── Current visible rows → gallery chart
                      (including exactly 0 or 1 item)
```
