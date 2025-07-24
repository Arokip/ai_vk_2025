# Google Sheets Integration Setup for Volební kalkulačka 2025

This document explains how to set up Google Sheets tracking for your voting calculator survey.

## Overview

The tracking system will log **one record per user** and update it as they progress:
1. **Page Load**: Creates initial record when users visit
2. **Survey Start**: Updates record when users click "Začít anketu"
3. **Survey Complete**: Updates record with full results when finished
4. **Restart**: Creates NEW record only when users click "Zkusit znovu"

## Step-by-Step Setup

### Step 1: Create Google Apps Script Project

1. Go to [script.google.com](https://script.google.com)
2. Sign in with your Google account
3. Click "New Project"
4. Delete the default `myFunction()` code
5. Copy and paste the entire content from `google-apps-script.js` file
6. Save the project (Ctrl+S or Cmd+S)
7. Give it a meaningful name like "Volební kalkulačka 2025 - Tracking"

### Step 2: Deploy as Web App

1. In your Google Apps Script project, click "Deploy" → "New deployment"
2. Click the gear icon ⚙️ next to "Type" and select "Web app"
3. Fill in the deployment settings:
   - **Description**: "Survey tracking API"
   - **Execute as**: "Me (your email)"
   - **Who has access**: "Anyone"
4. Click "Deploy"
5. **Important**: Copy the Web App URL that appears (it looks like: `https://script.google.com/macros/s/[LONG_ID]/exec`)

### Step 3: Update Your Website

1. Open `app.js` in your project
2. Find this line near the top:
   ```javascript
   const TRACKING_API_URL = 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE';
   ```
3. Replace the placeholder with your actual Web App URL:
   ```javascript
   const TRACKING_API_URL = 'https://script.google.com/macros/s/[YOUR_ACTUAL_ID]/exec';
   ```

### Step 4: Test the Integration

1. Open your website in a browser
2. Check the browser console (F12 → Console tab)
3. You should see tracking messages like:
   - "Event tracked: page_load for user [user_id]"
   - "Event tracked: survey_start for user [user_id]" (when you start the survey)
   - "Event tracked: survey_complete for user [user_id]" (when you finish)
   - "Event tracked: restart for user [new_user_id]" (when you click restart)

### Step 5: Find Your Spreadsheet

The Google Apps Script will automatically create a spreadsheet in your Google Drive:

1. Go to [drive.google.com](https://drive.google.com)
2. Look for a file named "**Volební kalkulačka 2025 - Survey Data**"
3. Open it to see the tracking data

**Alternative way to find the spreadsheet:**
1. Go to your Web App URL directly in a browser
2. It will return a JSON response with the spreadsheet URL
3. Copy and paste that URL into a new browser tab

## Spreadsheet Structure

Your spreadsheet will have these columns (one row per user):

| Column | Description |
|--------|-------------|
| User ID | Unique identifier for each user session |
| First Visit | When the user first visited the page |
| Survey Started | When the user clicked "Začít anketu" |
| Survey Completed | When the user finished the survey |
| Browser Info | User's browser information |
| Final Results | Complete results JSON (when survey completed) |
| Top Party | Name of user's top matching party |
| Top Party Score | Percentage match with top party |
| All Parties Scores | JSON of all party matches |
| Session Duration (seconds) | How long the survey took |
| Total Questions | Number of questions in survey |
| Completion Rate (%) | Percentage of survey completed |
| Last Updated | When this record was last modified |

## Privacy & Data Handling

- Each user gets a unique ID that's stored in their browser
- No personal information is collected
- User IDs reset after 4 hours or on a new day
- **One record per user session** - data is updated in the same row as user progresses
- **New record only when user clicks "Zkusit znovu" (restart button)**
- All data is stored in your private Google Drive

## Troubleshooting

### "Tracking disabled - no API URL configured"
- You haven't updated the `TRACKING_API_URL` in `app.js`
- Make sure you replaced the placeholder with your actual Web App URL

### No data appearing in spreadsheet
1. Check the browser console for error messages
2. Make sure the Web App is deployed with "Anyone" access
3. Try visiting your Web App URL directly - you should see a JSON response
4. The spreadsheet might not be created until the first event is tracked

### "Script function not found" error
- Make sure you copied the complete Google Apps Script code
- Try redeploying the Web App

### Permission errors
- Make sure you deployed with "Execute as: Me" and "Who has access: Anyone"
- You might need to authorize the script the first time

## Advanced Features

### View Statistics
Your Google Apps Script includes a `getStats()` function. To use it:
1. In Google Apps Script, go to the editor
2. Select `getStats` from the function dropdown
3. Click "Run" to see statistics in the logs

### Export Data
The tracking data is automatically in Google Sheets format, but you can:
- Download as Excel: File → Download → Microsoft Excel
- Download as CSV: File → Download → Comma-separated values

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify all URLs are correct
3. Make sure the Google Apps Script is properly deployed
4. Test the Web App URL directly in a browser

The spreadsheet will be automatically created and formatted when the first user visits your site! 