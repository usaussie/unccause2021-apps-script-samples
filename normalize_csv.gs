const NORMALIZE_CSV_DRIVE_FOLDER_ID_PENDING = "13SYZit0M8mfdsadsaJDWW5RNBymAp";
// trash files after processing, or just move to another drive
const NORMALIZE_TRASH_FILES_AFTER_MOVE = false;
// if TRASH_FILES_AFTER_MOVE  is false, then put them into this folder ID
const NORMALIZE_CSV_DRIVE_FOLDER_ID_NORMALIZED = "1C8q20HGkfeqfdavUgGQH-DqdSjo77";
// folder to put the original file into after it has been parsed/normalized
const NORMALIZE_CSV_DRIVE_FOLDER_ID_PROCESSED_ORIGINAL = "1TCVQCGP43fdsfecY0Qg5OHt";
// prefix to use for the normalized file names
const NORMALIZE_NORMALIZED_FILE_PREFIX_STRING = 'normalized___';

/**
 * 
 * DEFINE DETECTION OF CSVs
 * 
 * You'll define the first column/first row information here for each CSV "type"
 * which tells the code which BQ table to a particular CSV into.
 * 
 */

function detect_csv_type_(csvHeaderArray) {
  
  var firstRowFirstColumn = csvHeaderArray[0].toString().trim();
  
  switch(firstRowFirstColumn)  {
        
        case "Name":
            Logger.log('CSV Type: Name, Country, Color');

            var thisTableFunction = 'table_namecountrycolor_';

            break;
        case "First Name":
            Logger.log('CSV Type: Activity and Name');

            var thisTableFunction = 'table_activity_';

            break;
                default:
        return false;
    }

    return thisTableFunction;

}

/**
 * 
 * Parse CSV data to de-identify, or normalize, or whatever you need.
 * 
 * param array result from the csvToArray() method
 * return array
 * 
 */
function table_namecountrycolor_(csvArrayData) {

  var returnArray = []

  // push the header row into the new array
  returnArray.push(csvArrayData[0]);

  for (i = 1; i < csvArrayData.length; i++) {

    // make sure there is data in this row, if not, go to next line
    if(csvArrayData[i][0] == '' || csvArrayData[i][0] == null) {
      continue;
    }

    var thisName = csvArrayData[i][0]; // Name
    var thisCountry = csvArrayData[i][1]; // Country
    var thisColor = csvArrayData[i][2]; // Color
    var parsedCountry = thisCountry;
    var parsedColor = thisColor;

    // normalize the country
    switch(thisCountry)  {
        
        case "USA":
        case "United States":
        case "America":
            Logger.log('Normalizing "' + thisCountry + '" to "United States of America"');

            parsedCountry = 'United States of America';

            break;
        
        default:
            parsedCountry = thisCountry;
    }

    // normalize the color
    switch(thisColor)  {
        
        case "Teal":
        case "Navy":
        case "Azul":
            Logger.log('Normalizing "' + thisColor + '" to "Blue"');

            parsedColor = 'Blue';

            break;
        
        default:
            false;
    }

    var thisArray = [
      thisName, // Name
      parsedCountry, // Country
      parsedColor, // Color
     ];

     returnArray.push(thisArray);

  }

  var csv = new csvWriter_();
  var csvFile = csv.arrayToCSV(returnArray)

  return csvFile;
  

}

function table_activity_(csvArrayData) {

  var returnArray = []

  // set up new header array because we want new fields
  returnArray.push(['Name','Original Activity','Normalized Activity']);

  for (i = 1; i < csvArrayData.length; i++) {

    // make sure there is data in this row, if not, go to next line
    if(csvArrayData[i][0] == '' || csvArrayData[i][0] == null) {  
      continue;
    }

    var thisName = csvArrayData[i][0]; // Name
    var thisActivity = csvArrayData[i][1]; // Activity
    var parsedActivity = thisActivity;

    // normalize the country
    switch(thisActivity)  {
        
        case "Football":
        case "Futbol":
            Logger.log('Normalizing "' + thisActivity + '" to "Soccer"');

            parsedActivity = 'Soccer';

            break;
        
        default:
            false;
    }

    var thisArray = [
      thisName, // Name
      thisActivity, // original Activity
      parsedActivity, // new activity
     ];

     returnArray.push(thisArray);

  }

  var csv = new csvWriter_();
  var csvFile = csv.arrayToCSV(returnArray)

  return csvFile;
  

}

/**
 * 
 * Run this to process all the CSV files in the pending directory.
 * 
*/

function job_process_all_pending_csv_files() {
  var folder = DriveApp.getFolderById(NORMALIZE_CSV_DRIVE_FOLDER_ID_PENDING);
  var files = folder.getFiles();
  while (files.hasNext()){
    var file = files.next();
    
    // need to figure out what kind of file it is using first column name in CSV
    var csv = file.getBlob().getDataAsString();
    var csvData = Utilities.parseCsv(csv);

    var detectedCSVFunction = detect_csv_type_(csvData[0])
    
    var doProcess = true;
    if(detectedCSVFunction === false) {
      Logger.log('CSV Type: Unknown File Type. Skipping File Name: ' + file.getName());
      doProcess = false;
    }
    
    // if we detected the file type correctly, go ahead and load the file, and then move it to the processed folder
    if(doProcess) {

      // generate correct function / table info from detected string
      var parseFunction;
      parseFunction = new Function('return ' + detectedCSVFunction);
      var normalizedCSVata = parseFunction()(csvData);

      Logger.log('Attempt to process CSV file. File ID: ' + file.getName());
      
      // process / normalize / de-identify the CSV
      //Logger.log(normalizedCSVata);
      var normalizedCSVFile = DriveApp.createFile(NORMALIZE_NORMALIZED_FILE_PREFIX_STRING + file.getName(), normalizedCSVata);
      
      var normalizedDestinationFolder = DriveApp.getFolderById(NORMALIZE_CSV_DRIVE_FOLDER_ID_NORMALIZED);
      normalizedCSVFile.moveTo(normalizedDestinationFolder);

      Logger.log('Parsed CSV file: ' + file.getName() + ' -> ' + normalizedDestinationFolder.getName());

      if(NORMALIZE_TRASH_FILES_AFTER_MOVE) {

        // trash the file
        file.setTrashed(true);

      } else {
        // add the removed CSV file to the "Processed" folder
        var originalDestinationFolder = DriveApp.getFolderById(NORMALIZE_CSV_DRIVE_FOLDER_ID_PROCESSED_ORIGINAL);
        file.moveTo(originalDestinationFolder);

        Logger.log('Moving CSV file for safekeeping to the "Original" folder. File ID: ' + file.getName() + ' -> ' + originalDestinationFolder.getName());
        
      }

    }

  } 

}


/**
 * Class for creating csv strings
 * Handles multiple data types
 * Objects are cast to Strings
 * Source: https://stackoverflow.com/questions/201724/easy-way-to-turn-javascript-array-into-comma-separated-list
 **/

function csvWriter_(del, enc) {
	this.del = del || ','; // CSV Delimiter
	this.enc = enc || '"'; // CSV Enclosure
	
	// Convert Object to CSV column
	this.escapeCol = function (col) {
		if(isNaN(col)) {
			// is not boolean or numeric
			if (!col) {
				// is null or undefined
				col = '';
			} else {
				// is string or object
				col = String(col);
				if (col.length > 0) {
					// use regex to test for del, enc, \r or \n
					// if(new RegExp( '[' + this.del + this.enc + '\r\n]' ).test(col)) {
					
					// escape inline enclosure
					col = col.split( this.enc ).join( this.enc + this.enc );
				
					// wrap with enclosure
					col = this.enc + col + this.enc;
				}
			}
		}
		return col;
	};
	
	// Convert an Array of columns into an escaped CSV row
	this.arrayToRow = function (arr) {
		var arr2 = arr.slice(0);
		
		var i, ii = arr2.length;
		for(i = 0; i < ii; i++) {
			arr2[i] = this.escapeCol(arr2[i]);
		}
		return arr2.join(this.del);
	};
	
	// Convert a two-dimensional Array into an escaped multi-row CSV 
	this.arrayToCSV = function (arr) {
		var arr2 = arr.slice(0);
		
		var i, ii = arr2.length;
		for(i = 0; i < ii; i++) {
			arr2[i] = this.arrayToRow(arr2[i]);
		}
		return arr2.join("\r\n");
	};
}
