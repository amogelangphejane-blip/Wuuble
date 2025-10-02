# Debug Guide: Link Not Working in Classroom

## Quick Diagnosis Steps

### Step 1: Check Database Schema
Run this SQL query in your Supabase dashboard:

```sql
-- Check if link columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'community_posts'
AND column_name LIKE 'link%';
```

**Expected Result:**
```
column_name        | data_type
-------------------|-----------
link_url           | text
link_title         | text
link_description   | text
link_image_url     | text
link_domain        | text
```

**If columns are missing:** Run the `APPLY_LINK_FIX.sql` file in your database.

### Step 2: Check if Links are Being Saved
After posting a link, run this query:

```sql
-- Check recent posts with links
SELECT 
    id,
    content,
    link_url,
    link_title,
    link_domain,
    created_at
FROM community_posts 
WHERE link_url IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;
```

**What to look for:**
- ✅ `link_url` should have a value like `https://example.com`
- ✅ `link_title` should have the page title
- ⚠️  If `link_url` is NULL, the link isn't being saved

### Step 3: Browser Console Check
1. Open browser DevTools (F12)
2. Go to Console tab
3. Try clicking a link
4. Look for errors

**Common errors:**
- `Uncaught TypeError: Cannot read property 'startsWith'` - link_url is null
- `Blocked by CORS policy` - Browser blocking the navigation
- `Pop-up blocked` - Browser pop-up blocker is active

### Step 4: Test URL Format
Check what's actually in the database:

```sql
-- Show raw link URLs
SELECT 
    id,
    link_url,
    LENGTH(link_url) as url_length,
    link_url LIKE 'http%' as has_protocol
FROM community_posts 
WHERE link_url IS NOT NULL
LIMIT 5;
```

**What to check:**
- ✅ URL should start with `http://` or `https://`
- ⚠️  If `has_protocol` is false, URLs missing protocol
- ⚠️  Extra spaces or special characters

## Common Issues & Solutions

### Issue 1: Database Columns Don't Exist
**Symptom:** Links can't be saved, error in console

**Solution:**
```bash
# Apply the migration
cd /workspace
# Run APPLY_LINK_FIX.sql in your Supabase dashboard
```

### Issue 2: Links Saved Without Protocol
**Symptom:** Links in database like `example.com` instead of `https://example.com`

**Solution:** Already fixed in the code! The `LinkPreview.tsx` component now auto-adds `https://`.

**To fix existing data:**
```sql
-- Update existing posts without protocol
UPDATE community_posts 
SET link_url = 'https://' || link_url
WHERE link_url IS NOT NULL 
AND link_url NOT LIKE 'http%';
```

### Issue 3: Pop-up Blocker
**Symptom:** Nothing happens when clicking link

**Solution:**
1. Check if browser shows pop-up blocked icon in address bar
2. Allow pop-ups for your site
3. Try right-click → "Open in new tab"

### Issue 4: Click Event Not Firing
**Symptom:** No response when clicking link card

**Debugging:**
1. Add this temporarily to the onClick handler:

```tsx
onClick={(e) => {
  console.log('Link clicked!', post.link_url);
  e.stopPropagation();
}}
```

2. If you see the log but link doesn't open, it's a browser issue
3. If you don't see the log, there's a CSS or event blocking issue

### Issue 5: CSS Blocking Clicks
**Symptom:** Hover effects work but clicks don't

**Check for:**
- `pointer-events: none` in CSS
- Overlapping elements (z-index issues)
- Nested clickable elements

**Test:**
```tsx
// Temporarily remove all nested elements and test
<a href={normalizedUrl} target="_blank" rel="noopener noreferrer">
  CLICK ME - TEST
</a>
```

## Test Cases to Try

### Test 1: Simple Link
1. Create a new post
2. Add link: `google.com`
3. Post it
4. Click the link card
5. **Expected:** Opens Google in new tab

### Test 2: Full URL
1. Create a new post
2. Add link: `https://github.com`
3. Post it
4. Click the link card
5. **Expected:** Opens GitHub in new tab

### Test 3: Complex URL
1. Create a new post
2. Add link: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
3. Post it
4. Click the link card
5. **Expected:** Opens YouTube video in new tab

### Test 4: Right Click
1. Find a post with a link
2. Right-click on the link card
3. Select "Open link in new tab"
4. **Expected:** Opens the URL

## Browser-Specific Issues

### Chrome/Edge
- Check if pop-up blocker is enabled
- Check if site is in restricted mode
- Try incognito mode

### Firefox
- Check Enhanced Tracking Protection settings
- May block third-party requests
- Check about:config for popup restrictions

### Safari
- Very strict pop-up blocker
- Check Settings → Websites → Pop-up Windows
- May need to explicitly allow

## React DevTools Check

1. Install React DevTools extension
2. Select the link card component
3. Check props:
   - `post.link_url` should have a value
   - `href` attribute should be visible
   - `onClick` handler should be present

## Network Tab Check

1. Open DevTools → Network tab
2. Click a link
3. Look for any failed requests
4. Check if navigation is happening

## Still Not Working?

### Create a Minimal Test

Create this test in your app temporarily:

```tsx
// Add to CommunityPosts.tsx temporarily for testing
<div className="p-4 border-2 border-red-500">
  <h3>LINK TEST</h3>
  <p>Raw URL: {post.link_url}</p>
  <a 
    href={post.link_url} 
    target="_blank" 
    rel="noopener noreferrer"
    className="text-blue-500 underline"
  >
    Test Link (Simple)
  </a>
  <br />
  <button 
    onClick={() => {
      console.log('Trying to open:', post.link_url);
      window.open(post.link_url, '_blank');
    }}
    className="mt-2 px-4 py-2 bg-blue-500 text-white"
  >
    Test with window.open
  </button>
</div>
```

Test both the simple link and button. This will tell you:
- If simple anchor tags work → Issue is with styled component
- If window.open works → Issue is with click handler
- If neither works → Issue is with the URL itself

## Environment Checklist

- [ ] Node modules installed (`npm install`)
- [ ] Database migrations applied
- [ ] Link columns exist in `community_posts` table
- [ ] Code changes deployed/reloaded
- [ ] Browser cache cleared
- [ ] No console errors
- [ ] Pop-up blocker disabled for testing
- [ ] Testing in supported browser

## Get More Info

Add console logging to debug:

```tsx
// In CommunityPosts.tsx, add to the render section
{post.link_url && (
  <div>
    {console.log('Rendering link card:', {
      link_url: post.link_url,
      link_title: post.link_title,
      link_domain: post.link_domain
    })}
    <a href={...}>...</a>
  </div>
)}
```

## Contact Support

If none of these work, provide:
1. Browser console screenshot (with errors)
2. Database query result for link columns
3. Sample `link_url` value from database
4. Browser name and version
5. Any error messages

---

**Most Common Fix:** Apply the database migration and clear browser cache!
