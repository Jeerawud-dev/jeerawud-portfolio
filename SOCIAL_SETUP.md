# Visitor reactions & anonymous guestbook — activation guide

The portfolio now includes two anonymous reaction buttons (Like / Love) and a moderated
visitor guestbook. Both use the existing Google Sheets file as storage:

**Spreadsheet:** `1wM6Im1jnWEq8fujHW48mb-kTH_tvv5cQXkiNBGRSjKM`

**Created tabs:**
- `VisitorReactions`: ReactionID | VisitorHash | Reaction | FirstAtUTC | UpdatedAtUTC
- `GuestbookMessages`: MessageID | SubmittedAtUTC | Nickname | Message | Status | VisitorHash | ReviewedAtUTC

The Google Sheet already contains the tabs and headers, and its existing Profile/Portfolio
data is preserved.

## One-time activation (required)

The GitHub update **does not** deploy a Google Apps Script by itself. Until you complete
these steps, the website correctly shows disabled controls instead of falsely claiming
to save a guestbook message.

1. Sign into the Google account that **can edit the spreadsheet**.
2. Open **https://script.google.com/home/projects/create** to create a **new standalone**
   Google Apps Script project. Do **not** overwrite the existing portfolio feed's
   doGet function: a separate deployment keeps both systems independent.
3. Copy the entire content of [google_apps_script/Social.gs](google_apps_script/Social.gs)
   from this repository into the new Apps Script editor (replace the default example
   in Code.gs). The script's `spreadsheetId` is already filled in.
4. Save the project with a recognizable name, e.g. `Portfolio Visitor Feedback`.
5. Select **Deploy > New deployment > Web app**.
6. Set **Execute as: Me** and **Who has access: Anyone** (anonymous visitors). If a
   managed Workspace account disallows anonymous apps, use a supported account
   or service with anonymous write access; do not turn the entire Sheet editable.
7. Deploy and approve only the permissions for this script to edit the target
   spreadsheet. Copy the deployed URL ending in `/exec`.
8. In repository root `config.js`, replace the empty value:
   `SOCIAL_API_URL: ""`
   with `SOCIAL_API_URL: "https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec"`.
9. Commit to `main` and allow GitHub Pages to publish. Hard-refresh once.
10. Test Like/Love and submit a message with a test nickname, then open
    `GuestbookMessages` in your spreadsheet. The message should appear as
    **Pending**; only messages you approve will be shown to site visitors.

A Web app `/dev` test URL is not suitable for anonymous public use.
If you later edit the Apps Script, use **Deploy > Manage deployments > Edit**
and select a **new version**. Changes to source alone do not update an older
Web app deployment.

## Moderation and public privacy

- **No login**, email address, or real name is required. Users pick a nickname.
- A random browser identifier allows a visitor to hold one Like or Love reaction;
  changing device or clearing browser storage permits another reaction. This is
  **not strong proof of unique users**.
- The server stores a salted hash of that identifier, not the raw browser token.
- New messages are **Pending by default**. To show a message, edit
  `GuestbookMessages!E` in its row from `Pending` to `Approved`.
- Set `Status` to `Rejected` to hide a previously approved message.
- Public reads expose **only** Approved nickname, message and timestamp. Do not
  write sensitive information in public comments.
- The script includes a hidden honeypot, short length limits, link rejection and
  basic visitor/global quotas. Anonymous endpoints can still be abused; review
  your Sheets periodically. Apps Script usage is subject to Google's quotas.
- This is a **moderated guestbook**, not a real-time direct messaging service.
  The page refreshes visible approved messages approximately every 45 seconds.
- Do not make the spreadsheet public/editable. The Web app runs under the
  owner's authorization and accesses only the two specific tabs via code.

## Diagnostics

- If the buttons remain disabled, check `config.js` has the deployed /exec URL
  and GitHub Pages has published the latest version.
- If the buttons enable but don't save, inspect Google Apps Script **Executions**
  and the browser developer console. For a test read, visit:
  `YOUR_EXEC_URL?action=public`
  which returns JSON containing likes, hearts, and approved messages.
- After a successful message submission, a new row should appear in
  `GuestbookMessages`; if it doesn't, verify the new script has Spreadsheet
  editing permission and the tabs have exactly the names above.
- Never place Google API keys, service-account secrets or Script owner tokens
  in `config.js`, `social.js`, or public GitHub files.

## Code ownership

- `index.html`: visitor section
- `social.css`: responsive controls for Light and Dark themes, gentler PCB
- `social.js`: read-only JSONP public feed and anonymous POST actions
- `google_apps_script/Social.gs`: App Script backend; dedicated /exec deployment
- `config.js`: existing portfolio URL + separate visitor feedback URL
