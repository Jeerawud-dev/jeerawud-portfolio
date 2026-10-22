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
