/**
 * Google Apps Script for Volební kalkulačka 2025 - Survey Tracking
 * 
 * Instructions for setup:
 * 1. Go to script.google.com
 * 2. Create a new project
 * 3. Replace the default code with this code
 * 4. Save the project (give it a name like "Volební kalkulačka 2025 - Tracking")
 * 5. Deploy as Web App:
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 6. Copy the Web App URL and use it in your app.js file
 * 
 * The script will automatically create a spreadsheet in your Google Drive
 * named "Volební kalkulačka 2025 - Survey Data"
 */

const SPREADSHEET_NAME = "Volební kalkulačka 2025 - Survey Data";

/**
 * Get or create the tracking spreadsheet
 */
function getOrCreateSpreadsheet() {
  const files = DriveApp.getFilesByName(SPREADSHEET_NAME);
  
  if (files.hasNext()) {
    const file = files.next();
    return SpreadsheetApp.openById(file.getId());
  } else {
    // Create new spreadsheet
    const spreadsheet = SpreadsheetApp.create(SPREADSHEET_NAME);
    
    // Setup headers
    const sheet = spreadsheet.getActiveSheet();
    sheet.setName("Survey Tracking");
    
    const headers = [
      'User ID',
      'Timestamp',
      'Event Type',
      'Browser Info',
      'IP Address',
      'Question Number',
      'Agreement %',
      'Importance %',
      'Final Results',
      'Top Party',
      'Top Party Score',
      'All Parties Scores',
      'Session Duration',
      'Total Questions',
      'Completion Rate'
    ];
    
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    
    // Format headers
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#4285f4');
    headerRange.setFontColor('white');
    
    // Auto-resize columns
    sheet.autoResizeColumns(1, headers.length);
    
    return spreadsheet;
  }
}

/**
 * Main function to handle incoming requests
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const spreadsheet = getOrCreateSpreadsheet();
    const sheet = spreadsheet.getActiveSheet();
    
    const timestamp = new Date().toISOString();
    const userAgent = e.parameter.userAgent || 'Unknown';
    const userIP = getUserIP();
    
    let rowData = [
      data.userId,
      timestamp,
      data.eventType,
      userAgent,
      userIP
    ];
    
    // Add event-specific data
    switch (data.eventType) {
      case 'page_load':
        rowData = rowData.concat(['', '', '', '', '', '', '', '', '']);
        break;
        
      case 'survey_start':
        rowData = rowData.concat(['', '', '', '', '', '', data.sessionStart, data.totalQuestions, '']);
        break;
        
      case 'survey_complete':
        const results = data.results || [];
        const topParty = results.length > 0 ? results[0] : null;
        const completionRate = data.completionRate || 100;
        const sessionDuration = data.sessionDuration || 0;
        
        rowData = rowData.concat([
          '',
          '',
          '',
          JSON.stringify(results),
          topParty ? topParty.party.name : '',
          topParty ? topParty.percentage + '%' : '',
          JSON.stringify(results.map(r => ({ party: r.party.name, score: r.percentage }))),
          sessionDuration + ' seconds',
          data.totalQuestions,
          completionRate + '%'
        ]);
        break;
        
      case 'question_answer':
        rowData = rowData.concat([
          data.questionNumber,
          data.agreement,
          data.importance,
          '',
          '',
          '',
          '',
          '',
          '',
          ''
        ]);
        break;
        
      default:
        rowData = rowData.concat(['', '', '', '', '', '', '', '', '']);
    }
    
    // Add row to sheet
    sheet.appendRow(rowData);
    
    return ContentService
      .createTextOutput(JSON.stringify({ success: true, timestamp: timestamp }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    Logger.log('Error: ' + error.toString());
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handle GET requests (for testing)
 */
function doGet(e) {
  const spreadsheet = getOrCreateSpreadsheet();
  const url = spreadsheet.getUrl();
  
  return ContentService
    .createTextOutput(JSON.stringify({ 
      message: "Survey tracking API is running", 
      spreadsheetUrl: url,
      timestamp: new Date().toISOString()
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Get user IP address (basic implementation)
 */
function getUserIP() {
  try {
    // In Google Apps Script, we can't directly get the user's IP
    // This would need to be passed from the client
    return 'Unknown';
  } catch (e) {
    return 'Unknown';
  }
}

/**
 * Helper function to get spreadsheet statistics
 */
function getStats() {
  const spreadsheet = getOrCreateSpreadsheet();
  const sheet = spreadsheet.getActiveSheet();
  const lastRow = sheet.getLastRow();
  
  if (lastRow <= 1) {
    return { totalEntries: 0, lastUpdate: 'Never' };
  }
  
  const data = sheet.getRange(2, 1, lastRow - 1, 15).getValues();
  
  const stats = {
    totalEntries: lastRow - 1,
    uniqueUsers: new Set(data.map(row => row[0])).size,
    pageLoads: data.filter(row => row[2] === 'page_load').length,
    surveysStarted: data.filter(row => row[2] === 'survey_start').length,
    surveysCompleted: data.filter(row => row[2] === 'survey_complete').length,
    lastUpdate: new Date(Math.max(...data.map(row => new Date(row[1])))).toISOString()
  };
  
  stats.completionRate = stats.surveysStarted > 0 ? 
    Math.round((stats.surveysCompleted / stats.surveysStarted) * 100) + '%' : '0%';
  
  return stats;
} 