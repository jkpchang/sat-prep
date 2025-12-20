# Anonymous Authentication Setup

## Enabling Anonymous Auth in Supabase

Anonymous authentication must be **enabled in your Supabase project settings** before it will work.

### Steps to Enable:

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Providers**
3. Find **Anonymous** in the list of providers
4. **Enable** the Anonymous provider
5. Save the changes

### Verification:

After enabling, when you:
- Open the app in a new incognito window
- The app calls `ensureAnonymousAuth()` on startup
- A new user should be created in `auth.users` table with:
  - `email` = `null`
  - `is_anonymous` = `true` (if this column exists)
  - A unique `id` (UUID)

## When Anonymous Users Are Created

**On App Start:**
- `App.tsx` calls `ensureAnonymousAuth()` in `useEffect` on mount
- This happens automatically when the app loads

**On Profile Sync:**
- If profile sync runs before anonymous auth is set up, it will also call `ensureAnonymousAuth()`

## Checking if Anonymous Auth is Working

1. **Check Browser Console:**
   - Look for "Anonymous user created: [uuid]" log message
   - Or any error messages about anonymous auth

2. **Check Supabase Dashboard:**
   - Go to **Authentication** → **Users**
   - **Important:** The Auth UI may filter or hide anonymous users by default
   - Try these steps:
     - **Refresh the page** (the UI may not update in real-time)
     - **Clear any search/filter** in the Users table
     - **Look for users with empty/null email** - these are anonymous users
     - **Check the total user count** - it should increase even if you don't see the user in the list
   - If you still don't see them, use the SQL Editor (see below)

3. **Check Database via SQL Editor:**
   - Go to **SQL Editor** in Supabase Dashboard
   - Run this query to see anonymous users:
   ```sql
   SELECT id, email, created_at, last_sign_in_at
   FROM auth.users 
   WHERE email IS NULL 
   ORDER BY created_at DESC
   LIMIT 10;
   ```
   - Or search for a specific user ID:
   ```sql
   SELECT id, email, created_at, last_sign_in_at
   FROM auth.users 
   WHERE id = 'e942d702-9047-4277-8818-31c6948c3c4a';
   ```
   - **Note:** The `auth.users` table is in the `auth` schema, not `public`

## Troubleshooting

**If anonymous users aren't being created:**

1. **Check if Anonymous provider is enabled** in Supabase Dashboard
2. **Check browser console** for errors
3. **Check network tab** - look for calls to `/auth/v1/token` with `grant_type=anon`
4. **Verify the code is running** - add console.log in `ensureAnonymousAuth()`

**Common Issues:**

- Anonymous provider not enabled → Error: "Anonymous sign-ins are disabled"
- Network issues → Check browser console for failed requests
- Session already exists → User won't be created if session already exists

**User Created but Not Visible in Auth UI:**

If you see "Anonymous user created: [uuid]" in console but don't see it in the Auth UI:
- ✅ **The user WAS created** - the console log confirms it
- The Supabase Auth UI may:
  - Filter out anonymous users by default
  - Require a page refresh to show new users
  - Have a delay in updating the user list
- **Solution:** Use the SQL Editor to query `auth.users` directly (see query above)
- The user exists in the database and will work correctly for RLS and profile sync

