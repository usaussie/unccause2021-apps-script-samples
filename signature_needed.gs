/**
 * GET NOTIFICATIONS WHEN FILES ARE DROPPED IN A GOOGLE DRIVE FOLDER
 * 
 * EXAMPLE USAGE
 * 1. Files get dropped into a "needing signature" folder
 * 2. Script runs, which checks for files and if found, sends notifications
 * 3. Email contains link to tell the recipient where to go look
 * 4. Files are moved into a second folder, preventing duplicate notifications from being sent
 *  
 */

/**
 * CHANGE THESE VARIABLES 
 */

// Comma-separated Email addresses of owner and any additional recipients for notification when the audit completes
var SIGNATURE_NEEDED_NOTIFICATION_RECIPIENTS = "someone@yourdomain.edu"; // user@domain.com
// Drive folder to look for files first, for notifications to be sent about
var SIGNATURE_NEEDED_GOOGLE_DRIVE_FOLDER_ID_START = "1YhW9ZkNwr32fdfdsg5DXyMhioHE"; // 1QmyQlRk2lDymxIS3uXY2HpNbDg8UKq7f
// Drive folder to move files to after notification is sent
var SIGNATURE_NEEDED_GOOGLE_DRIVE_FOLDER_ID_FINISH = "1Jh0yLQAk35242iXG77s4_Pb"; // xIDg8UKq7fS3uXY21QmyQlRk2lDymHpNb
// URL to link to in email (might be the same as one of the folders above)
var SIGNATURE_NEEDED_EMAIL_LINK_URL = "https://drive.google.com/drive/folders/1Jh0yLQAk35242iXG77s4_Pb"; // "https://drive.google.com/drive/folders/xIDg8UKq7fS3uXY21QmyQlRk2lDymHpNb"
// email subject line
var SIGNATURE_NEEDED_EMAIL_SUBJECT = 'UNCCAUSE Signature Needed Notification (Google Drive)'; // Signature Needed Notification (Google Drive)
// email footer text
var SIGNATURE_NEEDED_EMAIL_FOOTER = 'Sent from UNCCAUSE Google Appscript'

/**
 * DO NOT CHANGE ANYTHING BELOW THIS LINE
 */

/*
* Check for files in the specified folder, then send the notification if things are found
*/
function check_and_notify() {
    
  var start_folder = DriveApp.getFolderById(SIGNATURE_NEEDED_GOOGLE_DRIVE_FOLDER_ID_START);
  var new_folder = DriveApp.getFolderById(SIGNATURE_NEEDED_GOOGLE_DRIVE_FOLDER_ID_FINISH);
  
  var file_array = get_file_array_from_google_drive_(start_folder);

  for(var i = 0; i < file_array.length; i++) {
  
    var this_file = DriveApp.getFileById(file_array[i].id);
    
    this_file.moveTo(new_folder);
    Logger.log('Moving file to folder: ' + file_array[i].name + ' --> ' + new_folder.getName());

  }
  
  if(file_array.length > 0) {
   
    var templ = HtmlService
      .createTemplateFromFile('3-signature_needed_email');
  
    templ.folderUrl = SIGNATURE_NEEDED_EMAIL_LINK_URL;
    templ.footerText = SIGNATURE_NEEDED_EMAIL_FOOTER;

    templ.fileArray = file_array;

    templ.emailSubject = SIGNATURE_NEEDED_EMAIL_SUBJECT;
    
    var message = templ.evaluate().getContent();
    
    GmailApp.sendEmail(SIGNATURE_NEEDED_NOTIFICATION_RECIPIENTS, SIGNATURE_NEEDED_EMAIL_SUBJECT, SIGNATURE_NEEDED_EMAIL_SUBJECT + ': ' + SIGNATURE_NEEDED_EMAIL_LINK_URL, {
      htmlBody: message
    });

    Logger.log('Sending Email');
    
  }
  
};
/**
 * Get files from specified google drive folder, create array to make things easier when sending the email later
 */
function get_file_array_from_google_drive_(folder_object) {
  
  var return_array = [];
  
  var files = folder_object.getFiles();
  
  while (files.hasNext()){
    var file = files.next();
    
    var this_file = {};
    
    this_file.id = file.getId();
    this_file.name = file.getName();
    this_file.url = file.getUrl();

    return_array.push(this_file);

  }

  return return_array;
}
