# LAN Party 2026 - Operation Reunion 🎮

A retro Enemy Territory-inspired website for organizing your clan's LAN party reunion. Built with vanilla HTML/CSS/JS and designed for easy deployment on Vercel.

## Features

- 📊 **Survey Results Display** - Show voting results with animated progress bars
- ✉️ **RSVP System** - Collect attendee information with serverless backend
- ❓ **FAQ Section** - Collapsible accordion for common questions
- 🎨 **Retro Gaming Aesthetic** - Red/white color scheme inspired by Enemy Territory
- 📱 **Fully Responsive** - Works great on mobile, tablet, and desktop
- 🚀 **Serverless Backend** - Easy form handling with Vercel Functions

## Quick Start

### 1. Clone/Download the Project

```bash
# If you have this as a download, extract it to a folder
# Then navigate to that folder in your terminal
cd lan-party-2026
```

### 2. Initialize Git Repository

```bash
git init
git add .
git commit -m "Initial commit: LAN Party site"
```

### 3. Deploy to Vercel (Recommended)

**Option A: Using Vercel CLI**

```bash
# Install Vercel CLI (one-time setup)
npm install -g vercel

# Deploy (follow the prompts)
vercel

# For production deployment
vercel --prod
```

**Option B: Using GitHub + Vercel Dashboard**

1. Create a new repository on GitHub
2. Push your code:
   ```bash
   git remote add origin https://github.com/yourusername/lan-party-2026.git
   git branch -M main
   git push -u origin main
   ```
3. Go to [vercel.com](https://vercel.com)
4. Click "New Project"
5. Import your GitHub repository
6. Click "Deploy"

That's it! Your site will be live in ~30 seconds.

### 4. Alternative Hosting Options

**GitHub Pages** (No serverless functions)
```bash
# Just deploy the static files
git push origin main
# Enable GitHub Pages in repo settings
```

**Netlify** (Similar to Vercel)
- Drag and drop your folder on netlify.com
- Or connect your GitHub repo

## Updating Content

### Survey Results

Edit `index.html` and find the survey section. Update the percentage values and progress bar widths:

```html
<div class="result-item">
    <span class="result-label">Your Option</span>
    <div class="progress-bar">
        <!-- Change the width percentage here -->
        <div class="progress-fill" style="width: 75%"></div>
    </div>
    <span class="result-value">75%</span>
</div>
```

### FAQ Section

Add new questions by copying this block in `index.html`:

```html
<div class="faq-item">
    <button class="faq-question">
        <span>Your question here?</span>
        <span class="faq-icon">+</span>
    </button>
    <div class="faq-answer">
        <p>Your answer here.</p>
    </div>
</div>
```

### Colors

All colors are defined in `styles.css` at the top:

```css
:root {
    --color-primary: #C41E3A; /* Main red */
    --color-secondary: #8B0000; /* Dark red */
    /* ... change these to customize */
}
```

## Setting Up the RSVP Backend

The RSVP form currently shows a success message but doesn't store data. Here's how to add real storage:

### Option 1: Email Notifications (Easiest)

1. Sign up for [Resend](https://resend.com) (free tier: 100 emails/day)
2. Get your API key
3. Add to Vercel:
   - Go to your project settings → Environment Variables
   - Add: `RESEND_API_KEY` = your_key_here
4. Uncomment the email code in `api/rsvp.js`

### Option 2: Google Sheets Storage

1. Create a Google Sheet
2. Set up a service account (see [Google Sheets API docs](https://developers.google.com/sheets/api/quickstart/nodejs))
3. Add environment variables to Vercel:
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `GOOGLE_PRIVATE_KEY`
   - `SPREADSHEET_ID`
4. Uncomment the Google Sheets code in `api/rsvp.js`

### Option 3: Simple Database (Vercel KV)

1. Enable Vercel KV in your project dashboard
2. Update `api/rsvp.js` to use KV storage
3. View stored data in Vercel dashboard

## File Structure

```
lan-party-2026/
├── index.html          # Main HTML file
├── styles.css          # All styling
├── script.js           # Interactive features
├── api/
│   └── rsvp.js        # Serverless function for form handling
├── vercel.json        # Vercel configuration
├── .gitignore         # Git ignore rules
└── README.md          # This file
```

## Adding New Sections

Want to add accommodation details or finalized dates? Just add a new section in `index.html`:

```html
<section id="accommodation" class="section">
    <div class="container">
        <div class="section-header">
            <h2 class="section-title">
                <span class="title-icon">🏠</span>
                Accommodation
            </h2>
        </div>
        <!-- Your content here -->
    </div>
</section>
```

Update the navigation:

```html
<li><a href="#accommodation" class="nav-link">Accommodation</a></li>
```

## Customization Tips

### Change the Theme
- Edit the CSS variables in `styles.css`
- Update the military/gaming theme text in `index.html`

### Add Password Protection
Vercel makes this easy:
1. Go to your project settings
2. Navigate to "Deployment Protection"
3. Enable password protection
4. Share the password with your clan members

### Add More Interactive Features
- Edit `script.js` to add animations, counters, etc.
- The file is well-commented for easy understanding

## Browser Compatibility

Works on all modern browsers:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers

## Troubleshooting

**RSVP form not working?**
- Check browser console for errors
- Verify the API route exists at `/api/rsvp`
- Check Vercel function logs in your dashboard

**Styles not loading?**
- Clear browser cache
- Check that `styles.css` is in the same directory as `index.html`

**Serverless function errors?**
- Check Vercel logs in your project dashboard
- Verify environment variables are set correctly

## Future Enhancements

Ideas for Claude Code sessions:
- [ ] Participant list management page (admin only)
- [ ] Automated email confirmations
- [ ] Game voting system
- [ ] Photo gallery from previous LANs
- [ ] Schedule builder
- [ ] Real-time attendance counter

## Support

Need help? The code is straightforward and well-commented. For Vercel-specific questions, check their [documentation](https://vercel.com/docs).

## License

Free to use and modify for your LAN party! Have fun! 🎮

---

**Built with nostalgia and red pixels** ❤️
