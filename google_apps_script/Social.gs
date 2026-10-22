/**
 * Anonymous portfolio reactions and moderated guestbook.
 * Standalone Google Apps Script web app bound to the existing Google Spreadsheet.
 *
 * Deploy > New deployment > Web app:
 *  Execute as: Me; Who has access: Anyone.
 *
 * This app only exposes APPROVED guestbook messages. Unapproved content and
 * visitor hashes never appear in the JSONP public response. GET is read-only.
 * Anonymous users can still attempt spam; moderation and quotas are essential.
 */
var PORTFOLIO_SOCIAL = {
  spreadsheetId: "1wM6Im1jnWEq8fujHW48mb-kTH_tvv5cQXkiNBGRSjKM",
  reactionsSheet: "VisitorReactions",
  messagesSheet: "GuestbookMessages",
  recentLimit: 5000,
  publicMessageCount: 24,
  messageMaxChars: 350,
  visitorDailyLimit: 5,
  globalDailyLimit: 80
};

function doGet(e) {
  var q = (e && e.parameter) || {};
  var action = String(q.action || "public");
  var result;
  try {
    if (action === "public" || action === "mine") {
      result = getPublicSocial_(action === "mine" ? String(q.visitor || "") : "");
    } else if (action === "status") {
      result = getMessageStatus_(String(q.id || ""));
    } else {
      result = {ok:false,error:"Unsupported action"};
    }
  } catch (err) {
    console.error(err);
    result = {ok:false,error:"Unable to read visitor feedback"};
  }
  return respond_(result, String(q.callback || ""));
}

function doPost(e) {
  var p = (e && e.parameter) || {};
  var lock = LockService.getScriptLock();
  var response;
  try {
    if (!lock.tryLock(10000)) throw new Error("Busy; try again");
    if (String(p.website || "").trim()) {
      response = {ok:true}; // Invisible honeypot. Do not provide feedback to spambots.
    } else if (p.action === "react") {
      response = saveReaction_(p);
    } else if (p.action === "message") {
      response = saveMessage_(p);
    } else {
      response = {ok:false,error:"Unsupported action"};
    }
  } catch (err) {
    console.error(err);
    response = {ok:false,error:"Request could not be saved"};
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

function sheet_(name) {
  var spreadsheet = SpreadsheetApp.openById(PORTFOLIO_SOCIAL.spreadsheetId);
  var sheet = spreadsheet.getSheetByName(name);
  if (!sheet) throw new Error("Missing sheet: " + name);
  return sheet;
}

function visitorHash_(raw) {
  raw = String(raw || "");
  if (!/^[A-Za-z0-9_-]{18,80}$/.test(raw)) throw new Error("Invalid visitor token");
  var props = PropertiesService.getScriptProperties();
  var salt = props.getProperty("GUESTBOOK_SALT");
  if (!salt) {
    salt = Utilities.getUuid() + Utilities.getUuid();
    props.setProperty("GUESTBOOK_SALT", salt);
  }
  var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, salt + ":" + raw);
  return digest.map(function(b) { return ("0" + ((b + 256) % 256).toString(16)).slice(-2); }).join("");
}

function cleanText_(text, max, multiline) {
  var value = String(text || "").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "");
  if (!multiline) value = value.replace(/[\r\n\t]+/g, " ");
  value = value.trim().slice(0, max);
  // Prevent spreadsheet-formula injection in user-provided cells.
  if (/^[=+\-@]/.test(value)) value = "'" + value;
  return value;
}

function recentRows_(sheet, columns, limit) {
  var count = Math.min(Math.max(sheet.getLastRow() - 1, 0), limit);
  return count ? sheet.getRange(sheet.getLastRow() - count + 1, 1, count, columns).getValues() : [];
}

function getPublicSocial_(visitor) {
  var reactionRows = recentRows_(sheet_(PORTFOLIO_SOCIAL.reactionsSheet), 5, PORTFOLIO_SOCIAL.recentLimit);
  var likes = 0, hearts = 0, mine = "";
  var hash = "";
  if (visitor) {
    try { hash = visitorHash_(visitor); } catch (_) { hash = ""; }
  }
  reactionRows.forEach(function(row) {
    if (row[2] === "Like") likes++;
    if (row[2] === "Heart") hearts++;
    if (hash && row[1] === hash) mine = row[2] === "Like" || row[2] === "Heart" ? row[2].toLowerCase() : "";
  });
  var rows = recentRows_(sheet_(PORTFOLIO_SOCIAL.messagesSheet), 7, PORTFOLIO_SOCIAL.recentLimit);
  var approved = [];
  for (var i = rows.length - 1; i >= 0 && approved.length < PORTFOLIO_SOCIAL.publicMessageCount; i--) {
    var row = rows[i];
    if (row[4] !== "Approved") continue;
    approved.push({
      id:String(row[0] || ""), at:String(row[1] || ""),
      name:String(row[2] || ""), text:String(row[3] || "")
    });
  }
  return {ok:true,likes:likes,hearts:hearts,mine:mine,messages:approved};
}

function getMessageStatus_(id) {
  if (!/^[A-Za-z0-9_-]{16,60}$/.test(id)) return {ok:false,status:"unknown"};
  var rows = recentRows_(sheet_(PORTFOLIO_SOCIAL.messagesSheet), 7, 1500);
  for (var i = rows.length - 1; i >= 0; i--) {
    if (String(rows[i][0]) === id) return {ok:true,status:String(rows[i][4] || "Pending")};
  }
  return {ok:false,status:"unknown"};
}

function saveReaction_(p) {
  var hash = visitorHash_(p.visitor);
  var choice = String(p.reaction || "").toLowerCase();
  if (["like","heart","none"].indexOf(choice) < 0) throw new Error("Unknown reaction");
  var formatted = choice === "like" ? "Like" : choice === "heart" ? "Heart" : "None";
  var sheet = sheet_(PORTFOLIO_SOCIAL.reactionsSheet);
  var rows = recentRows_(sheet, 5, PORTFOLIO_SOCIAL.recentLimit);
  var startRow = sheet.getLastRow() - rows.length + 1;
  var now = new Date().toISOString();
  for (var i = rows.length - 1; i >= 0; i--) {
    if (rows[i][1] !== hash) continue;
    sheet.getRange(startRow + i, 3).setValue(formatted);
    sheet.getRange(startRow + i, 5).setValue(now);
    return {ok:true};
  }
  if (sheet.getLastRow() > PORTFOLIO_SOCIAL.recentLimit) throw new Error("Reaction storage quota reached");
  sheet.appendRow([Utilities.getUuid(),hash,formatted,now,now]);
  return {ok:true};
}

function saveMessage_(p) {
  var hash = visitorHash_(p.visitor);
  var id = String(p.id || "");
  if (!/^[A-Za-z0-9_-]{16,60}$/.test(id)) throw new Error("Invalid message ID");
  var name = cleanText_(p.nickname, 24, false);
  var message = cleanText_(p.message, PORTFOLIO_SOCIAL.messageMaxChars, true);
  if (name.length < 2 || message.length < 3) throw new Error("Nickname or message too short");
  if (/https?:\/\/|www\./i.test(message)) throw new Error("Links are not accepted");

  var sheet = sheet_(PORTFOLIO_SOCIAL.messagesSheet);
  var rows = recentRows_(sheet, 7, PORTFOLIO_SOCIAL.recentLimit);
  var now = new Date();
  var dayAgo = now.getTime() - 86400000;
  var sameVisitorCount = 0, totalToday = 0;
  for (var i = rows.length - 1; i >= 0; i--) {
    var row = rows[i];
    if (String(row[0]) === id) return {ok:true,status:String(row[4] || "Pending")};
    var when = Date.parse(String(row[1] || ""));
    if (Number.isFinite(when) && when >= dayAgo) {
      totalToday++;
      if (row[5] === hash) {
        sameVisitorCount++;
        if (when >= now.getTime() - 90000) throw new Error("Please wait before another message");
      }
    }
  }
  if (totalToday >= PORTFOLIO_SOCIAL.globalDailyLimit ||
      sameVisitorCount >= PORTFOLIO_SOCIAL.visitorDailyLimit ||
      sheet.getLastRow() > PORTFOLIO_SOCIAL.recentLimit) {
    throw new Error("Daily message limit reached");
  }
  sheet.appendRow([id,now.toISOString(),name,message,"Pending",hash,""]);
  return {ok:true,status:"Pending"};
}

function respond_(payload, callback) {
  var serialized = JSON.stringify(payload).replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e").replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
  if (callback && /^__jjSocialCb_[A-Za-z0-9_]{1,30}$/.test(callback)) {
    return ContentService.createTextOutput(callback + "(" + serialized + ");")
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(serialized)
    .setMimeType(ContentService.MimeType.JSON);
}
