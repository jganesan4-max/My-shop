// Kadai Bill — Activation code backend.
// ⚠️ Change SECRET_KEY below to your own private value before deploying —
// this must match exactly what you enter in code-generator.html.
// Never share this value or paste it into the public Kadai Bill repo.
var SECRET_KEY = "RLgK81VYLmpwbSseqVK33NaU19ncgrMo";

// Plan → validity in days. Add more plans here if you introduce new
// pricing tiers later; the generator page's buttons must use the same keys.
var PLAN_DAYS = {
  "1m": 30,
  "3m": 90,
  "1y": 365
};
var DEFAULT_DAYS = 365; // used only as a fallback for codes generated
                          // before the "days" column existed

function doGet(e) {
  var action = e.parameter.action || "check";

  // Generating a new code requires the secret key — this keeps it
  // impossible for anyone using the public app to generate free codes,
  // since only your private generator page knows this value.
  if (action === "generate") {
    if (e.parameter.secret !== SECRET_KEY) {
      return respond({error: "unauthorized"});
    }
    var plan = e.parameter.plan || "1y";
    var days = PLAN_DAYS[plan] || DEFAULT_DAYS;
    return generateCode(days, plan);
  }

  return checkOrActivate(e.parameter.code, action);
}

function checkOrActivate(rawCode, action) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Codes");
    var code = (rawCode || "").trim();
    var data = sheet.getDataRange().getValues();

    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim() === code) {
        var used = data[i][1] === true || String(data[i][1]).toUpperCase() === "TRUE";
        if (used) return respond({valid:false, reason:"used"});
        // Column D holds validity days for this code; older rows generated
        // before this column existed fall back to DEFAULT_DAYS.
        var days = Number(data[i][3]) || DEFAULT_DAYS;
        if (action === "activate") {
          sheet.getRange(i+1, 2).setValue(true);
          sheet.getRange(i+1, 3).setValue(new Date());
        }
        return respond({valid:true, days:days});
      }
    }
    return respond({valid:false, reason:"notfound"});
  } finally {
    lock.releaseLock();
  }
}

function generateCode(days, plan){
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Codes");
    var data = sheet.getDataRange().getValues();
    var existing = {};
    for (var i = 1; i < data.length; i++) {
      existing[String(data[i][0]).trim()] = true;
    }
    var code, attempts = 0;
    do {
      var num = Math.floor(10000000 + Math.random()*90000000).toString();
      code = num.slice(0,4) + "-" + num.slice(4,8);
      attempts++;
    } while (existing[code] && attempts < 50);
    sheet.appendRow([code, false, "", days]);
    return respond({code: code, days: days, plan: plan});
  } finally {
    lock.releaseLock();
  }
}

function respond(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
