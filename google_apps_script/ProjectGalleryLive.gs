/**
 * Jeerawud Portfolio — READ-ONLY ProjectGallery feed.
 *
 * Standalone Apps Script Web App. Does not modify the existing portfolio
 * Google Apps Script or expose other spreadsheet tabs. Only columns A:F of
 * ProjectGallery are returned.
 *
 * Deploy as: Execute as Me / Who has access Anyone.
 * Test /exec?action=gallery in a browser first.
 */
const GALLERY_SPREADSHEET_ID = "1wM6Im1jnWEq8fujHW48mb-kTH_tvv5cQXkiNBGRSjKM";
const GALLERY_SHEET_NAME = "ProjectGallery";
const GALLERY_COLUMNS = 6;
const GALLERY_MAX_ROWS = 2000;

function doGet(e) {
  const params = (e && e.parameter) || {};
  const callback = String(params.callback || "");
  let response;
  try {
    if (params.action && params.action !== "gallery") {
      response = {ok:false,error:"Unknown action"};
    } else {
      response = {ok:true,projectGallery:readProjectGallery_()};
    }
  } catch (err) {
    console.error("ProjectGallery read failed",err);
    response = {ok:false,error:"ProjectGallery unavailable"};
  }
  return galleryResponse_(response,callback);
}

function readProjectGallery_() {
  const book = SpreadsheetApp.openById(GALLERY_SPREADSHEET_ID);
  const sheet = book.getSheetByName(GALLERY_SHEET_NAME);
  if (!sheet) throw new Error("ProjectGallery tab not found");
  const lastRow = sheet.getLastRow();
  if (lastRow < 1) throw new Error("Header row missing");
  if (lastRow > GALLERY_MAX_ROWS + 1) throw new Error("Gallery row limit exceeded");

  const values = sheet.getRange(1,1,lastRow,GALLERY_COLUMNS).getDisplayValues();
  const expected = [
    "Project Title","Gallery Heading","Image URL",
    "Short Detail","Display Order","Visible"
  ];
  const headers = values.shift().map(String);
  if (expected.some((name,index) => headers[index].trim() !== name)) {
    throw new Error("Unexpected ProjectGallery column layout");
  }

  return values.map(row => ({
    project: String(row[0] || "").trim().slice(0,180),
    title: String(row[1] || "").trim().slice(0,180),
    imageUrl: String(row[2] || "").trim().slice(0,1200),
    detail: String(row[3] || "").trim().slice(0,800),
    order: Number(row[4]) || 0,
    visible: !/^(no|false|0)$/i.test(String(row[5] || "").trim())
  })).filter(row => row.project && row.title && row.visible);
}

function galleryResponse_(value,callback) {
  // Escape HTML closing tags / Unicode separators before JSONP embedding.
  const json = JSON.stringify(value)
    .replace(/</g,"\\u003c")
    .replace(/>/g,"\\u003e")
    .replace(/&/g,"\\u0026")
    .replace(/\u2028/g,"\\u2028")
    .replace(/\u2029/g,"\\u2029");
  if (callback && /^__jjGalleryCb_[A-Za-z0-9_]{1,55}$/.test(callback)) {
    return ContentService.createTextOutput(callback+"("+json+");")
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}

/** Test from the Apps Script editor; read-only. */
function testGalleryFeed() {
  const rows = readProjectGallery_();
  console.log("Visible ProjectGallery records:", rows.length);
  console.log("Per project:", JSON.stringify(rows.reduce((counts, row) => {
    counts[row.project] = (counts[row.project] || 0) + 1;
    return counts;
  }, {})));
}
