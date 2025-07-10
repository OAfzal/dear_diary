# Personal Tracker Dashboard

A simple, secure personal dashboard for tracking weight, calorie deficit adherence, and daily diary entries. Your data is stored privately in GitHub Gists and synchronized across devices.

## Features

- **Weight Tracking**: Log daily weight measurements with change tracking
- **Calorie Deficit Tracking**: Monitor daily calorie goals and adherence
- **Daily Diary**: Write and browse date-based diary entries
- **Data Persistence**: Secure storage using GitHub Gists (private and version-controlled)
- **Responsive Design**: Works on desktop and mobile devices

## Setup Instructions

### 1. Clone and Configure

1. Clone this repository to your GitHub account
2. Enable GitHub Pages in your repository settings
3. Edit `config.js` and update the following values:
   - `AUTHORIZED_USER`: Replace with your GitHub username
   - `CLIENT_ID`: You can leave this blank for the personal access token method

### 2. Create a GitHub Personal Access Token

1. Go to [GitHub Settings → Personal Access Tokens](https://github.com/settings/tokens)
2. Click "Generate new token" → "Generate new token (classic)"
3. Give it a descriptive name like "Personal Tracker"
4. Set expiration (recommend: No expiration for personal use)
5. **Important**: Select the `gist` scope (this is the only permission needed)
6. Click "Generate token"
7. **Copy the token immediately** - you won't be able to see it again

### 3. Deploy to GitHub Pages

1. Go to your repository settings
2. Navigate to "Pages" in the left sidebar
3. Under "Source", select "Deploy from a branch"
4. Select "main" branch and "/ (root)" folder
5. Click "Save"
6. Your site will be available at `https://yourusername.github.io/personal_tracker`

### 4. First Login

1. Visit your deployed site
2. You'll see a login page with setup instructions
3. Paste your personal access token in the login form
4. Click "Login"

The app will automatically create a private gist to store your data. This gist will be version-controlled, so you can see the history of your data changes.

## How It Works

- **Authentication**: Uses GitHub personal access tokens for secure authentication
- **Data Storage**: All data is stored in a private GitHub Gist as JSON
- **Privacy**: Only you can access your data (stored in your private gist)
- **Sync**: Data automatically syncs when you make changes
- **Offline**: Works offline after initial load (changes sync when you're back online)

## File Structure

```
personal_tracker/
├── index.html          # Main dashboard HTML
├── style.css           # All styling
├── script.js           # Main dashboard functionality
├── auth.js             # GitHub authentication
├── config.js           # Configuration (edit this)
└── README.md           # This file
```

## Data Format

Your data is stored as JSON in a private gist with this structure:

```json
{
  "weightData": {
    "2024-01-01": 150.5,
    "2024-01-02": 149.8
  },
  "calorieData": {
    "2024-01-01": { "goal": 1800, "consumed": 1750 },
    "2024-01-02": { "goal": 1800, "consumed": 1650 }
  },
  "diaryData": {
    "2024-01-01": "Had a great workout today...",
    "2024-01-02": "Feeling motivated to stick to the plan..."
  },
  "lastUpdated": "2024-01-02T10:30:00.000Z"
}
```

## Security Notes

- Your personal access token is stored in browser localStorage
- All data is stored in your private GitHub gist
- No data is sent to any third-party servers
- The app runs entirely in your browser

## Troubleshooting

**Login fails**: 
- Make sure your personal access token has the `gist` scope
- Verify the `AUTHORIZED_USER` in `config.js` matches your GitHub username exactly

**Data not saving**:
- Check browser console for error messages
- Verify your token hasn't expired
- Try logging out and logging back in

**Site not loading**:
- Check that GitHub Pages is enabled in your repository settings
- Verify the repository is public (required for GitHub Pages)
- Wait a few minutes after enabling GitHub Pages

## Privacy

This app is designed for personal use only. Your data:
- Is stored in your private GitHub gist
- Is never shared with third parties
- Is only accessible to you
- Is version-controlled (you can see edit history)

## License

MIT License - feel free to modify and customize for your needs.