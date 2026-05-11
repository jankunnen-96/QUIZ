// =============================================================
// Google Apps Script — paste this into script.google.com
// =============================================================
//
// SETUP:
// 1. Create a new Google Sheet
// 2. Add a header row: Name | Score | Date
// 3. Open Extensions > Apps Script
// 4. Replace the code with this file's contents
// 5. Click Deploy > New deployment
//    - Type: Web app
//    - Execute as: Me
//    - Who has access: Anyone
// 6. Copy the web app URL and paste it into app.js (CHAMPIONS_SHEET_URL)
// =============================================================

function doGet() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var rows = sheet.getDataRange().getValues();
  var champions = [];

  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0]) {
      champions.push({
        name: String(rows[i][0]),
        score: Number(rows[i][1]),
        date: String(rows[i][2])
      });
    }
  }

  return ContentService.createTextOutput(JSON.stringify(champions))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = JSON.parse(e.postData.contents);
  var name = String(data.name).trim();
  var score = Number(data.score);

  if (!name) {
    return ContentService.createTextOutput(JSON.stringify({ status: "empty" }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // Check for duplicate name
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]).toLowerCase() === name.toLowerCase()) {
      return ContentService.createTextOutput(JSON.stringify({ status: "duplicate" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }

  sheet.appendRow([name, score, new Date().toISOString()]);

  return ContentService.createTextOutput(JSON.stringify({ status: "ok" }))
    .setMimeType(ContentService.MimeType.JSON);
}
