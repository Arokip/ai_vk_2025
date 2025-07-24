/**
 * Google Apps Script for Volební kalkulačka 2025 - Survey Tracking
 * 
 * Tracks complete survey lifecycle including early finishes and continues:
 * - Page loads and user sessions
 * - Survey starts and completions
 * - Early finishes with partial data
 * - Continue actions after early finish
 * - Detailed completion statistics
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
 * named "Volební kalkulačka 2025 - Survey Data" with detailed tracking columns
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
      'First Visit',
      'Survey Started',
      'Survey Completed', 
      'Browser Info',
      'Final Results',
      'Top Party',
      'Top Party Score',
      'All Parties Scores',
      'Session Duration (seconds)',
      'Total Questions',
      'Questions Answered',
      'Active Answers',
      'Completion Rate (%)',
      'Early Finish',
      'Continue Count',
      'Last Updated'
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
    const userAgent = data.userAgent || 'Unknown';
    
    // Find existing row for this user
    const existingRowIndex = findUserRow(sheet, data.userId);
    
    if (data.eventType === 'restart' || existingRowIndex === -1) {
      // Create new row for restart or first visit
      const newRowData = [
        data.userId,                    // User ID
        timestamp,                      // First Visit
        data.eventType === 'survey_start' ? timestamp : '',  // Survey Started
        '',                            // Survey Completed
        userAgent,                     // Browser Info
        '',                            // Final Results
        '',                            // Top Party
        '',                            // Top Party Score
        '',                            // All Parties Scores
        '',                            // Session Duration
        data.totalQuestions || '',     // Total Questions
        '',                            // Questions Answered
        '',                            // Active Answers
        '',                            // Completion Rate
        '',                            // Early Finish
        0,                             // Continue Count
        timestamp                      // Last Updated
      ];
      
      sheet.appendRow(newRowData);
      
    } else {
      // Update existing row
      updateUserRow(sheet, existingRowIndex, data, timestamp);
    }
    
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
 * Find the row index for a specific user ID
 */
function findUserRow(sheet, userId) {
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return -1;
  
  const userIds = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  
  for (let i = 0; i < userIds.length; i++) {
    if (userIds[i][0] === userId) {
      return i + 2; // +2 because getRange is 1-indexed and we started from row 2
    }
  }
  
  return -1;
}

/**
 * Update an existing user row with new data
 */
function updateUserRow(sheet, rowIndex, data, timestamp) {
  // Column indices (1-based)
  const COL_SURVEY_STARTED = 3;
  const COL_SURVEY_COMPLETED = 4;
  const COL_FINAL_RESULTS = 6;
  const COL_TOP_PARTY = 7;
  const COL_TOP_PARTY_SCORE = 8;
  const COL_ALL_PARTIES = 9;
  const COL_SESSION_DURATION = 10;
  const COL_TOTAL_QUESTIONS = 11;
  const COL_QUESTIONS_ANSWERED = 12;
  const COL_ACTIVE_ANSWERS = 13;
  const COL_COMPLETION_RATE = 14;
  const COL_EARLY_FINISH = 15;
  const COL_CONTINUE_COUNT = 16;
  const COL_LAST_UPDATED = 17;
  
  switch (data.eventType) {
    case 'survey_start':
      sheet.getRange(rowIndex, COL_SURVEY_STARTED).setValue(timestamp);
      if (data.totalQuestions) {
        sheet.getRange(rowIndex, COL_TOTAL_QUESTIONS).setValue(data.totalQuestions);
      }
      break;
      
    case 'survey_complete':
    case 'survey_early_finish':
      const results = data.results || [];
      const topParty = results.length > 0 ? results[0] : null;
      const completionRate = data.completionRate || 100;
      const sessionDuration = data.sessionDuration || 0;
      const questionsAnswered = data.questionsAnswered || 0;
      const activeAnswers = data.answeredQuestions || 0;
      const isEarlyFinish = data.eventType === 'survey_early_finish' || data.earlyFinish || false;
      
      sheet.getRange(rowIndex, COL_SURVEY_COMPLETED).setValue(timestamp);
      sheet.getRange(rowIndex, COL_FINAL_RESULTS).setValue(JSON.stringify(results));
      sheet.getRange(rowIndex, COL_TOP_PARTY).setValue(topParty ? topParty.party.name : '');
      sheet.getRange(rowIndex, COL_TOP_PARTY_SCORE).setValue(topParty ? topParty.percentage : '');
      sheet.getRange(rowIndex, COL_ALL_PARTIES).setValue(JSON.stringify(results.map(r => ({ party: r.party.name, score: r.percentage }))));
      sheet.getRange(rowIndex, COL_SESSION_DURATION).setValue(sessionDuration);
      sheet.getRange(rowIndex, COL_QUESTIONS_ANSWERED).setValue(questionsAnswered);
      sheet.getRange(rowIndex, COL_ACTIVE_ANSWERS).setValue(activeAnswers);
      sheet.getRange(rowIndex, COL_COMPLETION_RATE).setValue(completionRate);
      sheet.getRange(rowIndex, COL_EARLY_FINISH).setValue(isEarlyFinish);
      
      if (data.totalQuestions) {
        sheet.getRange(rowIndex, COL_TOTAL_QUESTIONS).setValue(data.totalQuestions);
      }
      break;
      
    case 'survey_continue':
      // Update continue count
      const currentContinueCount = sheet.getRange(rowIndex, COL_CONTINUE_COUNT).getValue() || 0;
      sheet.getRange(rowIndex, COL_CONTINUE_COUNT).setValue(currentContinueCount + 1);
      break;
  }
  
  // Always update last updated timestamp
  sheet.getRange(rowIndex, COL_LAST_UPDATED).setValue(timestamp);
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
  
  const data = sheet.getRange(2, 1, lastRow - 1, 17).getValues();
  
  const stats = {
    totalUsers: lastRow - 1,
    uniqueUsers: new Set(data.map(row => row[0])).size,
    surveysStarted: data.filter(row => row[2] && row[2] !== '').length, // Has Survey Started timestamp
    surveysCompleted: data.filter(row => row[3] && row[3] !== '').length, // Has Survey Completed timestamp
    earlyFinishes: data.filter(row => row[14] === true).length, // Early Finish column
    fullCompletions: data.filter(row => row[3] && row[3] !== '' && row[14] === false).length,
    totalContinues: data.reduce((sum, row) => sum + (row[15] || 0), 0), // Continue Count column
    averageQuestionsAnswered: 0,
    averageActiveAnswers: 0,
    lastUpdate: new Date(Math.max(...data.map(row => new Date(row[16])))).toISOString() // Last Updated column (now 17th, 0-indexed 16)
  };
  
  // Calculate averages for completed surveys
  const completedSurveys = data.filter(row => row[3] && row[3] !== '');
  if (completedSurveys.length > 0) {
    const totalQuestionsAnswered = completedSurveys.reduce((sum, row) => sum + (row[11] || 0), 0);
    const totalActiveAnswers = completedSurveys.reduce((sum, row) => sum + (row[12] || 0), 0);
    
    stats.averageQuestionsAnswered = Math.round(totalQuestionsAnswered / completedSurveys.length);
    stats.averageActiveAnswers = Math.round(totalActiveAnswers / completedSurveys.length);
  }
  
  stats.completionRate = stats.surveysStarted > 0 ? 
    Math.round((stats.surveysCompleted / stats.surveysStarted) * 100) + '%' : '0%';
    
  stats.earlyFinishRate = stats.surveysCompleted > 0 ?
    Math.round((stats.earlyFinishes / stats.surveysCompleted) * 100) + '%' : '0%';
  
  return stats;
} 