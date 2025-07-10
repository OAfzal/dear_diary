// GitHub OAuth Configuration
// You'll need to create a GitHub OAuth app at: https://github.com/settings/applications/new
// 
// When creating the OAuth app:
// - Application name: Personal Tracker
// - Homepage URL: https://yourusername.github.io/personal_tracker
// - Authorization callback URL: https://yourusername.github.io/personal_tracker
//
// After creating the app, replace CLIENT_ID with your actual client ID
// Keep CLIENT_SECRET empty for security (we'll use the implicit flow)

const GITHUB_CONFIG = {
    CLIENT_ID: 'Ov23liKq9ieprLh4XlVu', // Replace with your GitHub OAuth app client ID
    REDIRECT_URI: window.location.origin + window.location.pathname,
    SCOPE: 'gist',
    AUTHORIZED_USER: 'oafzal', // Replace with your GitHub username
    GIST_FILENAME: 'personal-tracker-data.json'
};

// Instructions for setup:
// 1. Go to https://github.com/settings/applications/new
// 2. Create a new OAuth app with the URLs above
// 3. Replace YOUR_GITHUB_CLIENT_ID_HERE with your client ID
// 4. Replace YOUR_GITHUB_USERNAME_HERE with your GitHub username
// 5. Deploy to GitHub Pages