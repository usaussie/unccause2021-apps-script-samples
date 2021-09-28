
/**
 * SET YOUR VARIABLES HERE - IF THE ENDPOINT IS WORKING...THIS WOULD WORK :-)
 */
// Google Sheet URL that you have access to edit (should be blank to begin with)
const ANIMAL_FACTS_GOOGLE_SHEET_URL = "https://docs.google.com/spreadsheets/d/{your sheet ID here}/edit";
// tab/sheet name to house the list of File IDs for everything in your Google Drive
const ANIMAL_FACTS_GOOGLE_SHEET_RESULTS_TAB_NAME = "animal_facts";
// header row for the google sheet
const ANIMAL_FACTS_SHEET_HEADER_ROW = ["date","fact_text"];
// how many API calls should be made to the endpoint during each run
const ANIMAL_FACTS_PER_CALL = 10;

/**
 * DON'T CHANGE ANYTHING UNDERNEATH HERE
 */

function get_animal_facts() {

  var thisDate = new Date();

  var response = UrlFetchApp.fetch('https://dog-facts-api.herokuapp.com/api/v1/resources/dogs?number=' + ANIMAL_FACTS_PER_CALL);
  var data = JSON.parse(response.getContentText());

  if (!data.length) {
      return [];
  }

  var rows = [];
  var headers = Object.keys(data[0]);

  for (var i=0; i<data.length; i++) {
      
      var row = [];
      for (var j=0; j<headers.length; j++) {
          row.push(
            thisDate,
            data[i].fact,    
          );
      }
      rows.push(row);
  }

  //Logger.log(rows);

  write_data_to_google_sheet_(ANIMAL_FACTS_GOOGLE_SHEET_URL, ANIMAL_FACTS_GOOGLE_SHEET_RESULTS_TAB_NAME, rows);

  return true;

}

function set_sheet_headers_animal_facts() {
 
  var results_sheet = SpreadsheetApp.openByUrl(GOOGLE_SHEET_URL).getSheetByName(GOOGLE_SHEET_RESULTS_TAB_NAME_ANIMAL_FACTS);
  results_sheet.appendRow(ANIMAL_FACTS_SHEET_HEADER_ROW);

  results_sheet.setFrozenRows(1);

}

function write_data_to_google_sheet_(sheet_url, tab_name, data) {

  var newRow = [];
  var rowsToWrite = [];

  for (var i = 0; i < data.length; i++) {

    // define an array of all the object keys
    var headerRow = Object.keys(data[i]);

    // define an array of all the object values
    var newRow = headerRow.map(function(key){ return data[i][key]});

    // add to row array instead of append because append is SLOOOOOWWWWW
    rowsToWrite.push(newRow);

  }

  // select the range and set its values
  var ss = SpreadsheetApp.openByUrl(sheet_url).getSheetByName(tab_name);
  ss.getRange(ss.getLastRow() + 1, 1, rowsToWrite.length, rowsToWrite[0].length).setValues(rowsToWrite);

}
