/**
 * BASED ON: 
 * http://www.googleappsscript.org/home/fetch-gmail-attachment-to-google-drive-using-google-apps-script
 */

// GLOBALS
//Array of file extension which you would like to extract to Drive
// var fileTypesToExtract = ['jpg', 'tif', 'png', 'gif', 'bmp', 'svg'];
var fileTypesToExtract = ['csv'];
//Name of the label which will be applied after processing the mail message
var labelName = MEET_DATA_AGGREGATOR_LABEL_NAME;

function job_Gmail_Meet_Attendance_CSV_To_Drive(){
  //build query to search emails
  var query = '';
  //filename:jpg OR filename:tif OR filename:gif OR fileName:png OR filename:bmp OR filename:svg'; //'after:'+formattedDate+
  for(var i in fileTypesToExtract){
 query += (query === '' ?('filename:'+fileTypesToExtract[i]) : (' OR filename:'+fileTypesToExtract[i]));
  }
  query = 'in:inbox from:meetings-noreply@google.com ' + query;
  Logger.log('Query:' + query);
  var threads = GmailApp.search(query);
  if(threads.length > 0){
    var destination_folder = DriveApp.getFolderById(MEET_DATA_AGGREGATOR_PENDING_CSV_DRIVE_FOLDER_ID);
  }
  for(var i in threads){
    var mesgs = threads[i].getMessages();
 for(var j in mesgs){
      //get attachments
      var attachments = mesgs[j].getAttachments();
      for(var k in attachments){
        var attachment = attachments[k];
        var isDefinedType = checkIfDefinedType_(attachment);
     if(!isDefinedType) continue;
     var attachmentBlob = attachment.copyBlob();
        var file = DriveApp.createFile(attachmentBlob);
        destination_folder.addFile(file);
        Logger.log('File added to destination folder:' + destination_folder.getUrl());
      }
 }
  threads[i].moveToTrash();
  Logger.log('Gmail thread moved to trash: ' + threads[i].getFirstMessageSubject());
  }
}

//getDate n days back
// n must be integer
function getDateNDaysBack_(n){
  n = parseInt(n);
  var date = new Date();
  date.setDate(date.getDate() - n);
  return Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy/MM/dd');
}

//this function will check for filextension type.
// and return boolean
function checkIfDefinedType_(attachment){
  var fileName = attachment.getName();
  var temp = fileName.split('.');
  var fileExtension = temp[temp.length-1].toLowerCase();
  if(fileTypesToExtract.indexOf(fileExtension) !== -1) return true;
  else return false;
}
