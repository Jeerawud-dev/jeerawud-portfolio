# Skills, Certificates and Project Gallery Images

## Fixed: Skills edits were not showing up

The page previously assigned `skills: resume.skills` even after it received
a live Google Sheets response. That suppressed all Skills tab changes.

The fix is:
- **Now:** site displays the synchronized `sheet-content.js` snapshot of the
  seven Skills and five Certificates rows from the current spreadsheet.
  The extra `Design Layer` row and GitHub entry in Platforms are included.
- **If the existing portfolio feed returns `skills` and `certificates`:**
  those current arrays take precedence over the snapshot.
- **After the existing ProjectGallery Live Web App is redeployed:**
  it returns `projectGallery`, `skills`, and `certificates` in one
  response; the page immediately updates Skills and Certificates from Sheets.
- Editing the Sheet before that redeployment will not immediately update the
  site unless `sheet-content.js` is refreshed.

## Enable live Skills and Certificates (one-time redeployment)

The GitHub repo file `google_apps_script/ProjectGalleryLive.gs` is now updated
to include Skills and Certificates in its response. **Editing the GitHub
file does not redeploy Apps Script.** Update the same existing Apps Script
project that owns the already-connected `/exec` URL.

1. Open https://script.google.com/ and open your **existing ProjectGallery
   Live** Apps Script project.
2. Replace its script source with the latest
   [ProjectGalleryLive.gs](google_apps_script/ProjectGalleryLive.gs) contents.
   Save.
3. Use **Deploy → Manage deployments → Edit (pencil) → Version: New version
   → Deploy**. Preserve the Web App permissions `Execute as: Me`,
   `Who has access: Anyone`.
4. Open the current `/exec?action=gallery` address.
5. Confirm JSON now includes all three keys:
   `projectGallery`, `skills`, `certificates`.
6. Refresh the Portfolio (Ctrl + Shift + R). Now Skills and Certificates
   changes from their tabs are visible after reloading the website.

The website keeps the same configured URL. Do not create a different
deployment URL unless the previous deployment is inaccessible.

## Adding a Certificate image

Google Sheets → **Certificates**:
- Column A: Certificate / Course
- Column B: Provider
- Column C: Year
- Column D: Credential URL (optional)
- Column E: Notes (optional)
- **Column F: Image URL** (new)

For each certificate you can:
1. Upload an approved photo or scanned certificate to the GitHub repository
   under an `image/` directory, e.g. `image/abb-robotics-certificate.jpg`.
2. Enter `image/abb-robotics-certificate.jpg` into that certificate's
   **Image URL** column F.
3. After redeploying the backend, reload the website.
4. The page displays a thumbnail. Visitors can click it to open the full
   certificate image.

Only use images you have permission to publish. Remove certificate IDs,
sensitive personal data or private signatures if necessary.
A Google Drive **sharing page link** is generally not a raw image URL and may
not render inside an HTML image; use an actual public HTTPS image URL or an
image file in the site's `image/` folder.

An empty Image URL displays a neutral icon, not a fabricated certificate.

## Larger Project Gallery images

When a ProjectGallery item has an Image URL, the selected photo is displayed
unobscured in a wider preview panel to the right of the circular infographic.
The central ring photo no longer has text printed over the picture, and a
Project with only one Gallery item displays its actual image in a large,
uncropped wide frame.

Images use `object-fit: contain` in these primary preview areas, so
landscape or UI screenshots remain legible rather than being cut into a
circle. The small outer thumbnails remain circular for visual navigation.

The **ProjectGallery** tab remains the image/title source. Changes go live
after reloading through the existing Gallery Live Apps Script endpoint.


## 2026-10-27: Fixed gallery, certificate photo and first-paint loading

- Corrected `Certificates!F5` to `image/ABB Robot Studio training course.jpg`
  (the old text ended with `,jpg`, which was not an existing filename).
- `Certificates!F6` references an existing file at `image/Advance PLC.png`.
- When the older portfolio feed omits certificate image URLs, the page
  supplements them from `sheet-content.js` by certificate name.
- `project-gallery.js` is synchronized with the **14 current visible rows**
  in `ProjectGallery`. It is only a recovery snapshot, not a replacement
  for the Google Sheets database. The site's live feed takes priority,
  including a successful empty gallery if all rows are deliberately removed.
- If the Live Gallery endpoint fails or times out, the current snapshot is
  shown instead of an error-only empty dialog (unless the primary feed itself
  returned an authoritative gallery).
- The first-paint loading screen waits for the primary portfolio render
  and the Gallery render, with a safety timeout so visitors cannot become
  trapped behind the loading overlay.

**Important:** GitHub updates do not deploy Google Apps Script automatically.
To have every new row/photo edit appear live (without updating a snapshot),
redeploy `google_apps_script/ProjectGalleryLive.gs` in the *existing* Apps
Script project, using **Deploy → Manage deployments → Edit → New version**.

To add ProjectGallery photos, use the **Image URL** column C. A blank cell
shows an illustrative system icon/heading, not a machine photo. At the time
of this snapshot, only the Automated Coating Machine's `Machine overview`
row had a nonempty photo URL. A filename must match the case, spaces and
extension of a real public image file. In the browser, use Ctrl + Shift + R
after deployment to refresh the new versioned scripts.

## Latest image update (2026-10-27)

The live Google Sheets database remains in place. The current verified data is
synchronized to GitHub as **recovery-only snapshots** to handle old, unavailable,
or CORS-blocked Apps Script deployments:

- **Portfolio**: 10 Google Sheets project rows, all 10 with existing
  `image/...` file paths in this GitHub repository.
- **ProjectGallery**: 14 visible Google Sheets rows, 5 with currently populated
  image URLs. The 4 Smart Screw photos and the Coating Machine photo exist.
- **Certificates**: 5 records; all 5 have nonempty image URLs matching existing
  GitHub media files.

The website now supplements missing project-card and certificate photo fields
from the verified sheet snapshot. For older gallery deployments missing image
fields, it supplements only **matching live gallery rows**, not rows deleted
from Google Sheets. Updated JS script URLs use new version queries to bypass
browser-cached copies.

### To get future Google Sheets changes live automatically

You need to deploy the latest `google_apps_script/ProjectGalleryLive.gs` source
in the **same Apps Script project** serving `PROJECT_GALLERY_API_URL`:

1. Open the linked Apps Script project in the Google Apps Script editor.
2. Replace its source with the current `ProjectGalleryLive.gs`, save it.
3. Click **Deploy → Manage deployments → Edit → New version → Deploy**.
4. Open your existing `/exec?action=gallery` endpoint in a browser.
   A healthy response contains `ok:true`, `schemaVersion:2`,
   `projectGallery`, `skills`, and `certificates`. It should include
   `projectGallery` rows with nonempty `imageUrl`, as well as
   `certificates` rows with nonempty `imageUrl`.
5. Reload the Portfolio. Subsequent Sheet changes should now be reflected
   without new GitHub snapshot updates.

**Note:** GitHub file edits do **not** deploy Google Apps Script. We cannot
confirm the actual currently deployed Apps Script response from the GitHub
source alone. If `/exec` still emits the previous schema, perform the steps
above. Keep the original Apps Script deployment URL to avoid changing the
frontend configuration.
