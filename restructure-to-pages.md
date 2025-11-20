# Restructure Plan: From Tabs to Separate Pages

## Current Structure
- Home/Dashboard (Event Info + Message Board) - always visible
- Tab 1: Unterkünfte
- Tab 2: Spiele
- Tab 3: Profil
- Tab 4: Admin
- Separate: Einstellungen (already done ✅)

## New Structure
Each section becomes a full-screen page with:
- Page header with back/home button
- Page title
- Page content
- Navigation via burger menu

### Pages:
1. **home-screen** - Dashboard (Event Info + Message Board + Top Games)
2. **cabins-screen** - Unterkünfte listing & voting
3. **games-screen** - Spiele listing & voting
4. **profile-screen** - User profile editing
5. **admin-screen** - Admin panel
6. **settings-screen** - Settings (already exists ✅)

### Navigation Flow:
- Home is default
- Burger menu navigates to any page
- Each page has "← Home" button
- Settings via ⚙️ icon or burger menu

## Implementation Steps:
1. Convert tab-cabins → cabins-screen (fullscreen)
2. Convert tab-games → games-screen (fullscreen)
3. Convert tab-profile → profile-screen (fullscreen)
4. Convert tab-admin → admin-screen (fullscreen)
5. Keep event-info + message-board as home-screen
6. Remove tab navigation completely
7. Update burger menu to navigate between screens
8. Add page headers with back buttons
9. Update JavaScript to handle screen switching
10. Update CSS for fullscreen pages
