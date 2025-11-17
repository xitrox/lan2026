// SURVEY DATA TEMPLATE
// Use this as a reference when updating survey results in index.html
// Just copy the structure and modify the values

const surveyData = {
  preferredDates: [
    { label: "Option A: March 14-16", percentage: 60 },
    { label: "Option B: April 11-13", percentage: 30 },
    { label: "Option C: May 2-4", percentage: 10 }
  ],
  
  gamePreferences: [
    { label: "Enemy Territory (Classic)", percentage: 90 },
    { label: "CS:GO / CS2", percentage: 70 },
    { label: "Age of Empires II", percentage: 50 }
  ],
  
  duration: [
    { label: "Weekend (2 nights)", percentage: 80 },
    { label: "Long weekend (3 nights)", percentage: 20 }
  ],
  
  budget: [
    { label: "€100-150", percentage: 40 },
    { label: "€150-200", percentage: 50 },
    { label: "€200+", percentage: 10 }
  ]
};

// INSTRUCTIONS FOR UPDATING SURVEY RESULTS:
// 
// 1. Find the survey section in index.html
// 2. Locate the card you want to update (e.g., "Preferred Dates")
// 3. Find each result-item block
// 4. Update TWO places for each option:
//    a. The width in style="width: XX%"
//    b. The result-value span
//
// Example:
// <div class="result-item">
//     <span class="result-label">Option A: March 14-16</span>
//     <div class="progress-bar">
//         <div class="progress-fill" style="width: 60%"></div>  <!-- UPDATE THIS -->
//     </div>
//     <span class="result-value">60%</span>  <!-- AND THIS -->
// </div>
//
// 5. Make sure percentages add up to 100% (approximately)
// 6. Save and redeploy!

// FUTURE ENHANCEMENT IDEA:
// If you want to make this REALLY easy to update, you could:
// 1. Move this data to a separate JSON file
// 2. Load it with JavaScript
// 3. Generate the HTML dynamically
// This would be a great task for a Claude Code session!
