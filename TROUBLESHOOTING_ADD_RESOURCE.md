# Add Resource - Troubleshooting Guide

## 🔧 Quick Fixes

### Issue 1: Foreign Key Constraint Error

**Error:**
```
violates foreign key constraint "community_resources_user_id_fkey"
```

**Quick Fix:**
1. Log out of the application
2. Clear browser cache and local storage
3. Log back in
4. Try creating resource again

**Why This Works:**
- Refreshes authentication session
- Ensures user ID is properly synchronized with auth.users table
- Clears any stale session data

---

### Issue 2: "Authentication Session Expired"

**Solution:**
1. Close the form dialog
2. Refresh the page
3. Log out and log back in if still issues
4. Try creating resource again

**Prevention:**
- Don't leave the page open for extended periods
- If you see this error, refresh immediately

---

### Issue 3: Button Does Nothing

**Checklist:**
- ✅ Are you logged in?
- ✅ Are you a member of the community?
- ✅ Is JavaScript enabled?
- ✅ Do you have network connection?

**Solution:**
1. Open browser console (F12)
2. Check for JavaScript errors
3. Refresh the page
4. Try again

---

### Issue 4: Form Validation Errors

**Common Issues:**

| Error | Cause | Solution |
|-------|-------|----------|
| "Please enter a title" | Title is empty | Fill in resource title |
| "Please enter a description" | Description is empty | Fill in description |
| Form won't submit | Required fields missing | Check all required fields marked with * |

---

### Issue 5: "Database Constraint Error"

**Possible Causes:**
- Missing required field
- Invalid resource type
- Community ID not found
- Price constraint violation (free resource with price)

**Solution:**
1. Check all form fields are filled correctly
2. Ensure resource type is selected from dropdown
3. If setting paid resource, enter a price > 0
4. If free resource, leave price empty

---

## 🧪 Test Scenarios

### Test 1: Create Simple Resource

1. Navigate to Classroom
2. Click "Add Resource"
3. Fill in:
   - Title: "Test Resource"
   - Description: "This is a test"
   - Type: "Article"
   - Leave URL blank
   - Keep "Free" toggled on
4. Click "Create Resource"
5. **Expected**: Success toast + resource appears

---

### Test 2: Create Resource with URL

1. Click "Add Resource"
2. Fill in:
   - Title: "External Tutorial"
   - Description: "Great tutorial website"
   - Type: "Link"
   - URL: "https://example.com"
   - Free: Yes
3. Click "Create Resource"
4. **Expected**: Success toast + resource appears

---

### Test 3: Create Paid Resource

1. Click "Add Resource"
2. Fill in:
   - Title: "Premium Course"
   - Description: "Advanced course content"
   - Type: "Course"
   - URL: "https://course.com"
   - Toggle "Free" OFF
3. Click "Create Resource"
4. **Expected**: Success toast + resource appears

---

## 🔍 Debug Mode

### Enable Console Logging

1. Open browser console (F12)
2. Look for these messages:

**Success:**
```
Resource created successfully
```

**Errors:**
```
Error creating resource: <error details>
Database error: <error message>
```

### Check Network Tab

1. Open DevTools → Network tab
2. Filter by "Fetch/XHR"
3. Look for POST request to Supabase
4. Check response status:
   - 201 = Success
   - 400 = Bad request
   - 401 = Unauthorized
   - 403 = Forbidden
   - 500 = Server error

---

## 🗄️ Database Checks

### Verify User Exists in auth.users

If you have database access:

```sql
SELECT id, email, created_at 
FROM auth.users 
WHERE id = '<your_user_id>';
```

Should return 1 row with your user info.

### Check Community Membership

```sql
SELECT * 
FROM community_members 
WHERE user_id = '<your_user_id>' 
AND community_id = '<community_id>';
```

Should return 1 row if you're a member.

### Check Created Resources

```sql
SELECT id, title, resource_type, created_at 
FROM community_resources 
WHERE user_id = '<your_user_id>'
ORDER BY created_at DESC 
LIMIT 5;
```

Shows your recent resources.

---

## 🚨 Common Error Messages

### "Please log in to create resources"

**Cause**: Not authenticated
**Fix**: Log in to your account

### "Authentication session expired. Please log in again."

**Cause**: Session timed out
**Fix**: Refresh page and log in again

### "Authentication error. Please log out and log back in."

**Cause**: Foreign key constraint or stale session
**Fix**: 
1. Log out completely
2. Clear browser data
3. Log back in
4. Try again

### "Database constraint error. Please check your input."

**Cause**: Data validation failed
**Fix**: 
- Check all fields are valid
- Ensure resource type is selected
- Verify price constraints (free = no price, paid = price > 0)

### "Failed to create resource"

**Cause**: Generic error
**Fix**:
1. Check console for detailed error
2. Verify network connection
3. Try refreshing the page
4. Contact support if persists

---

## 📱 Browser-Specific Issues

### Chrome/Edge
- Clear cache: Ctrl+Shift+Delete
- Hard refresh: Ctrl+F5
- Check extensions aren't blocking requests

### Firefox
- Clear cache: Ctrl+Shift+Delete
- Hard refresh: Ctrl+F5
- Check tracking protection settings

### Safari
- Clear cache: Safari → Preferences → Privacy → Manage Website Data
- Hard refresh: Cmd+Option+R
- Check "Prevent cross-site tracking" setting

---

## 🔄 Session Management

### How Long Do Sessions Last?

- **Default**: 1 hour of inactivity
- **Maximum**: 24 hours total

### Keeping Session Active

- Interact with the app periodically
- Refresh page before creating important resources
- Log out/in if you've been idle

### Session Storage

Sessions are stored in:
- Browser localStorage
- Supabase auth cookies
- In-memory state

**To Clear:**
1. Log out
2. Clear browser storage
3. Close all tabs
4. Reopen and log in

---

## 🛠️ Advanced Troubleshooting

### Check RLS Policies

If you have database access:

```sql
-- Check if you can insert resources
SELECT policy_name, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'community_resources'
AND cmd = 'INSERT';
```

### Verify Community Access

```sql
-- Check if community exists and is accessible
SELECT c.id, c.name, cm.role
FROM communities c
LEFT JOIN community_members cm ON cm.community_id = c.id AND cm.user_id = auth.uid()
WHERE c.id = '<community_id>';
```

### Test Auth Connection

```javascript
// In browser console
const { data: { session } } = await supabase.auth.getSession();
console.log('Session:', session);
console.log('User ID:', session?.user?.id);
console.log('Email:', session?.user?.email);
```

---

## 📞 When to Contact Support

Contact support if:

- ✅ You've tried all troubleshooting steps
- ✅ Error persists after log out/in
- ✅ Multiple users experiencing same issue
- ✅ Console shows server errors (500)
- ✅ Network requests are failing

**Include in Support Request:**
1. Error message (exact text)
2. Browser console screenshot
3. Network tab screenshot
4. Steps to reproduce
5. Browser/OS version
6. When the issue started

---

## ✅ Prevention Checklist

Before creating resources:

- [ ] Logged in with valid account
- [ ] Member of the community
- [ ] Browser is up to date
- [ ] JavaScript enabled
- [ ] Network connection stable
- [ ] No console errors on page load
- [ ] Session hasn't expired (logged in recently)

---

## 📊 Success Indicators

**Resource Creation Succeeded When:**

1. ✅ Success toast appears: "Resource created successfully"
2. ✅ Dialog closes automatically
3. ✅ Resource appears in list (SkoolClassroom)
4. ✅ Resource has correct icon and color
5. ✅ No error in browser console
6. ✅ Network request returns 201 status

---

## 🎯 Quick Reference

| Symptom | Quick Fix |
|---------|-----------|
| Foreign key error | Log out + Log in |
| Session expired | Refresh page |
| Button not working | Check console for errors |
| Form won't submit | Fill required fields |
| Resource not appearing | Refresh page manually |
| Generic error | Clear cache + retry |

---

**Last Updated**: September 30, 2025
**Version**: 1.0
**Status**: Current
