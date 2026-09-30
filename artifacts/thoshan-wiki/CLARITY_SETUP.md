# Microsoft Clarity Analytics Setup

## Overview
Microsoft Clarity has been installed on the portfolio website (lingadevaru.in) to track user interactions and behavior.

## Project Details
- **Project ID**: `sqliaml0ju`
- **Domain**: lingadevaru.in
- **Date Installed**: 2026-09-27

## Files Modified

### 1. `/artifacts/thoshan-wiki/index.html`
- Added Microsoft Clarity script tag in the `<head>` section
- The script automatically loads and initializes Clarity on all pages
- Script location: Before the closing `</head>` tag

### 2. `/artifacts/thoshan-wiki/src/lib/clarity.ts` (NEW)
- Created a TypeScript module for Clarity integration
- Provides programmatic control over Clarity tracking
- Exports:
  - `initClarity()` - Initializes Clarity
  - `trackEvent()` - Tracks custom events
  - `trackNewsletterSignup()` - Tracks newsletter form submissions
  - `trackClick()` - Tracks custom click events

### 3. `/artifacts/thoshan-wiki/src/main.tsx`
- Added import for `initClarity` from the clarity module
- Calls `initClarity()` when the application starts
- Ensures Clarity is initialized before React app mounts

### 4. `/artifacts/thoshan-wiki/src/components/Newsletter.tsx`
- Added imports for Clarity tracking functions
- Added tracking for:
  - Newsletter modal open events
  - Newsletter form submission success events
  - Custom newsletter signup tracking with form name

## What Clarity Tracks Automatically

The Microsoft Clarity script automatically tracks the following without any additional code:

1. **All Page Views** - Every page load and SPA route change
2. **All Clicks** - Every mouse click on the website
3. **All Form Submissions** - All form submissions including:
   - Newsletter signup forms
   - Any other forms on the site
4. **Session Recordings** - Records user sessions for playback
5. **Heatmaps** - Visual representation of where users click
6. **Scroll Depth** - How far users scroll on each page
7. **Mouse Movements** - For generating heatmaps
8. **Screen Resolutions** - Visitor device information
9. **Browser Information** - Browser type and version

## Custom Tracking Added

In addition to automatic tracking, custom events were added for:

1. **Newsletter Modal Open** (`newsletter_open`)
   - Tracks when users open the newsletter signup modal
   - Includes locale information

2. **Newsletter Submission Success** (`newsletter_submit_success`)
   - Tracks successful newsletter form submissions
   - Includes locale and submission kind (new/edited/again)

3. **Newsletter Signup** (custom event)
   - Tracks newsletter signups with form name
   - Respects user privacy (doesn't send actual email)

## Verification

Run the following checks to verify the installation:

```bash
# Check if Clarity script is in index.html
grep "sqliaml0ju" artifacts/thoshan-wiki/index.html

# Check if clarity.ts exists
ls -la artifacts/thoshan-wiki/src/lib/clarity.ts

# Check if main.tsx initializes Clarity
grep "initClarity" artifacts/thoshan-wiki/src/main.tsx

# Check if Newsletter component has Clarity tracking
grep "trackEvent\|trackNewsletterSignup" artifacts/thoshan-wiki/src/components/Newsletter.tsx
```

## Viewing Clarity Data

To view the analytics data:
1. Go to [https://clarity.microsoft.com](https://clarity.microsoft.com)
2. Sign in with your Microsoft account
3. Select project with ID: `sqliaml0ju`
4. View:
   - Dashboard with key metrics
   - Session recordings
   - Heatmaps
   - Click maps
   - Insights and suggestions

## Privacy Considerations

- Microsoft Clarity automatically anonymizes IP addresses
- No personally identifiable information (PII) is collected
- User emails from newsletter forms are NOT sent to Clarity
- Custom tracking respects privacy by not sending sensitive data

## Compatibility

- Works with the existing PostHog analytics (both can coexist)
- No conflicts with other tracking scripts
- SPA compatible (works with React Router/Wouter)

## Troubleshooting

If Clarity is not tracking:
1. Verify the project ID `sqliaml0ju` is correct
2. Check that the script tag is in the `<head>` section of index.html
3. Ensure there are no JavaScript errors preventing the script from loading
4. Wait up to 24 hours for data to appear in the Clarity dashboard
5. Test in an incognito window to avoid cached versions

## References

- [Microsoft Clarity Documentation](https://clarity.microsoft.com/docs)
- [Clarity Developer Docs](https://docs.microsoft.com/en-us/clarity/)
