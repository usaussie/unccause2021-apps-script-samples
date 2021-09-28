/*************************************************
*
* GOOGLE MEET ATTENDANCE TRACKER
* Author: Nick Young
* Email: nick@techupover.com
*
*
* ASSUMPTIONS:
* The CSV filename format used by Google (as of October 9th) is: "YYYY-MM-DD HH-MM Name of Meeting.csv"
* If the name format changes, the script may generate unexpected data for some of the derived columns (meeting name and date)
*
* INSTRUCTIONS: 
* (1) Update the variables below to point to your google sheet
* (2) Run the set_sheet_headers() function once, which will prompt for permissions and set the sheet column headers
* (3) Accept the permissions (asking for access for your script to read/write to google drive etc)
* (4) Run the process_all_pending_csv_files() function (once, or set a trigger)
* (5) Look in your google sheet as the function is running, and you should see results being inserted
*
* RECOMMENDATION:
* If you run this using a triggered schedule, then all you need to do, is move any CSVs into your pending folder, and they'll automatically get aggregated.
* This is then easy to add as a source to a Data Studio Dashboard. And...if you use the email/row permissions, people would only see their attendance and no one elses :-)
*
*
* UPDATE THESE VARIABLES
*
*************************************************/
// google sheet to store aggregate CSV info
const MEET_DATA_AGGREGATOR_SHEET_URL = "https://docs.google.com/spreadsheets/d/1Z8tTEfdiX9CMpKr423fdsfdst9TgA3CbszHv3SlX8/edit";
const MEET_DATA_AGGREGATOR_SHEET_TAB_NAME = "data";

// folder ID for where to look for CSV files to process
// IE: the last part of the folder URL, like: https://drive.google.com/drive/u/0/folders/1fzw_Vx8uoidshda_B6SOFjEI_Co
const MEET_DATA_AGGREGATOR_PENDING_CSV_DRIVE_FOLDER_ID = "1xLM1oaK4t4fdsfdseD3DycOF0VmOn";

// trash files after processing, or just move to another drive
const MEET_DATA_AGGREGATOR_TRASH_FILES_AFTER_MOVE = false;
// if TRASH_FILES_AFTER_MOVE  is false, then put them into this folder ID
const MEET_DATA_AGGREGATOR_PROCESSED_CSV_DRIVE_FOLDER_ID = "1ixQe6DL5g4fsfdsX9rF-8JtVeie";
// label to apply to email after its processed
const MEET_DATA_AGGREGATOR_LABEL_NAME = 'custom-label-meet_tracking';

/*************************************************
*
* DO NOT CHANGE ANYTHING BELOW THIS LINE
*
*************************************************/

/*
*
* ONLY RUN THIS ONCE TO SET THE HEADER ROWS FOR THE GOOGLE SHEETS
*/
function set_sheet_headers() {
  
  var sheet = SpreadsheetApp.openByUrl(SHEET_URL).getSheetByName(MEET_DATA_AGGREGATOR_SHEET_TAB_NAME);
  sheet.appendRow(["File_Name","File_Id","Meeting_Name","Meeting_Date","Name","Email","Duration","Time Joined","Time Exited","Date_Time_Joined","Date_Time_Exited","Duration_Seconds","Meeting_Owner_Email"]);
  
}

function process_all_pending_csv_files(){
  var ss = SpreadsheetApp.openByUrl(MEET_DATA_AGGREGATOR_SHEET_URL).getSheetByName(MEET_DATA_AGGREGATOR_SHEET_TAB_NAME);
  var folder = DriveApp.getFolderById(MEET_DATA_AGGREGATOR_PENDING_CSV_DRIVE_FOLDER_ID);
  var list = [];
  //list.push(['File_Name','File_Id']); // uncomment if you want to set a header row here
  var files = folder.getFilesByType('text/csv');
  while (files.hasNext()){
    var file = files.next();
    
    //import the CSV data into the sheet
    importCSVbyFileId(file.getId());

    // comment the next section out if you're testing and want to leave the files in place

    if(MEET_DATA_AGGREGATOR_TRASH_FILES_AFTER_MOVE) {

      // trash the file
      file.setTrashed(true);

    } else {
      
      var newFolder = DriveApp.getFolderById(MEET_DATA_AGGREGATOR_PROCESSED_CSV_DRIVE_FOLDER_ID);
      
      file.moveTo(newFolder);

    }
    
  } 

}

function importCSVbyFileId(file_id) {

  var ss = SpreadsheetApp.openByUrl(MEET_DATA_AGGREGATOR_SHEET_URL).getSheetByName(MEET_DATA_AGGREGATOR_SHEET_TAB_NAME);
  var file = DriveApp.getFileById(file_id);
  
  var owner = file.getOwner();
  try {
      var OWNER_EMAIL = owner.getEmail();
  } catch (e) {
    var OWNER_EMAIL = 'NULL';
    Logger.log('Error owner.getEmail() | CAUGHT EXCEPTION:' + e);
  }

  var csvData = Utilities.parseCsv(file.getBlob().getDataAsString());

  // loop through the CSV rows skipping the first row headers
  for (var i = 1; i < csvData.length; i++) {
    // build the row

    var AFTER_FIRST_SPACE = file.getName().substr(file.getName().indexOf(' ')+1);
    var MEETING_NAME = AFTER_FIRST_SPACE.substr(AFTER_FIRST_SPACE.indexOf(' ')+1).replace(" - Attendance Report.csv", "");
    var MEETING_DATE = file.getName().substring(0, 10);
    var JOINED = "=concatenate(text(\"" + MEETING_DATE + "\",\"mm/dd/yyyy\")&\" \"&text(\"" + csvData[i][3] + "\",\"hh:mm:ss\"))";
    var EXITED = "=concatenate(text(\"" + MEETING_DATE + "\",\"mm/dd/yyyy\")&\" \"&text(\"" + csvData[i][4] + "\",\"hh:mm:ss\"))";

    // explode the time column value so we can tell if it's a string of hours, mins, or secs (or combination)
    var TIME_ARRAY = csvData[i][2].split(' '); // split string on comma space
    if(TIME_ARRAY[1] == "hr") {
      var DURATION_MINS = parseInt(TIME_ARRAY[0]) * 60 * 60;
    } 
    if(TIME_ARRAY[1] == "hr" && TIME_ARRAY[3] == "min") {
      var DURATION_MINS = parseInt(TIME_ARRAY[0]) * 60 * 60 + parseInt(TIME_ARRAY[2]) * 60;
    } 
    if(TIME_ARRAY[1] == "min") {
      var DURATION_MINS = parseInt(csvData[i][2].substr(0, csvData[i][2].indexOf(' '))) * 60;
    } 
    if (TIME_ARRAY[1] == "sec") {
      var DURATION_MINS = parseInt(csvData[i][2]);
    }

    // append the data to the sheet
    ss.appendRow([file.getName(),file_id,MEETING_NAME,MEETING_DATE,csvData[i][0],csvData[i][1],csvData[i][2],csvData[i][3],csvData[i][4], JOINED, EXITED, DURATION_MINS,OWNER_EMAIL]);
  }
  
}
