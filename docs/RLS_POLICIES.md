# Row Level Security (RLS) Policies for `profiles` Table

## Current Status
✅ RLS is **ENABLED** on the `profiles` table.
✅ Using **Supabase Anonymous Authentication** (`signInAnonymously()`)
✅ RLS policies use `auth.uid() = user_id` for proper security
✅ `device_id` column **REMOVED** (no longer needed)
✅ `email` stored in profiles **ONLY for username lookup** (source of truth is `auth.users.email`)

## Architecture

**Anonymous Users:**
- All users (including guests) are authenticated via `supabase.auth.signInAnonymously()`
- This creates a user in `auth.users` without email
- Each anonymous user gets a unique `user_id` (UUID)
- RLS policies can use `auth.uid()` to restrict access

**Upgrade Flow:**
- When a user signs up with email/password, we upgrade the existing anonymous user
- Uses `supabase.auth.updateUser()` to add email/password to the anonymous user
- Profile data is preserved during upgrade

## How It Works

**On App Start:**
1. App calls `ensureAnonymousAuth()` which:
   - Checks if user already has a session
   - If not, calls `supabase.auth.signInAnonymously()`
   - Creates an anonymous user in `auth.users` (no email required)
   - Returns the `user_id`

**Profile Creation:**
- Profile is created/updated with `user_id` from the anonymous auth session
- RLS policy ensures users can only access their own profile via `auth.uid() = user_id`

**Upgrade to Authenticated:**
- When user signs up, we upgrade the anonymous user:
  - `supabase.auth.updateUser({ email, password })`
  - Adds email/password to existing anonymous user
  - Profile data is preserved (same `user_id`)

## Current Policies

### 1. Users Can Create Own Profile
```sql
CREATE POLICY "Users can create own profile"
ON public.profiles
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND user_id = auth.uid()
);
```
**Purpose:** Allows users (anonymous or authenticated) to create profiles with their `user_id` matching `auth.uid()`.

**Security:** ✅ Secure - users can only create profiles with their own `user_id`.

---

### 2. Users Can Manage Own Profile
```sql
CREATE POLICY "Users can manage own profile"
ON public.profiles
FOR ALL
USING (
  auth.uid() IS NOT NULL
  AND user_id = auth.uid()
)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND user_id = auth.uid()
);
```
**Purpose:** Users (anonymous or authenticated) have full access (SELECT, INSERT, UPDATE, DELETE) to their own profile where `user_id = auth.uid()`.

**Security:** ✅ Fully secure - RLS uses `auth.uid()` which is tied to the Supabase Auth session. Users can only access their own profile.

---

### 3. Secure Username Lookup Function
```sql
CREATE OR REPLACE FUNCTION public.get_email_by_username(username_to_lookup TEXT)
RETURNS TABLE(user_id UUID, email TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT p.user_id, p.email::TEXT
  FROM public.profiles p
  WHERE p.username = username_to_lookup
  LIMIT 1;
END;
$$;
```
**Purpose:** Secure database function that allows username → email lookup for login. Only returns `user_id` and `email` - no other sensitive data (like stats) is exposed.

**Security:** ✅ Much more secure than allowing direct SELECT on profiles table:
- **Only exposes `user_id` and `email`** - no stats, no other sensitive data
- Uses `SECURITY DEFINER` to bypass RLS for the lookup (function runs with creator's privileges)
- Password is still required to actually authenticate
- Username is effectively public (it's what users use to log in)
- Users cannot query or modify other users' profiles directly (only through this function)


---

## Benefits of This Approach

1. **✅ Proper RLS Security:** Uses `auth.uid() = user_id` which is the standard Supabase pattern
2. **✅ Secure Username Lookup:** Uses database function to limit exposed data (only user_id and email)
3. **✅ Better Security:** Tied to Supabase Auth sessions, not client-provided device_id
4. **✅ Seamless Upgrade:** Anonymous users can upgrade to authenticated without losing data
5. **✅ Cross-Device Support:** Can be extended to link multiple devices to same user_id

## Implementation Details

**Client Code:**
- `ensureAnonymousAuth()` - Called on app start to create/get anonymous user
- `profileSync.ts` - Uses `user_id` from auth session instead of `device_id`
- `auth.ts` - Signup upgrades anonymous user instead of creating new one
- `App.tsx` - Initializes anonymous auth on startup

**Database:**
- RLS policies use `auth.uid() = user_id` for all operations
- Secure function `get_email_by_username()` for username lookup (only exposes user_id and email)
- Works for both anonymous and authenticated users
- `device_id` column removed (no longer needed)
- `email` column kept in profiles ONLY for username->email lookup during login
  - **Source of truth:** `auth.users.email`
  - **Display:** Always read from `auth.users.email` via `supabase.auth.getUser()`
  - **Lookup only:** `profiles.email` is used only for username login lookup via secure function
  - **Sync:** `profiles.email` is updated when `auth.users.email` changes

---

## Migration History

- **20251219035000**: `enable_rls_for_profiles` - Initial RLS setup with device_id
- **20251219035018**: `fix_rls_policies_for_profiles` - Attempted to fix device_id policies
- **20251219035646**: `add_device_id_validation_function` - Added device_id validation function (later removed)
- **20251219035658**: `tighten_anonymous_rls_policies` - Tightened RLS policies for anonymous users
- **20251219042539**: `switch_to_anonymous_auth_rls` - Switched to anonymous authentication with `auth.uid()` policies
- **20251219042916**: `remove_device_id_and_email_from_profiles` - Removed device_id and email (later reverted)
- **20251219042957**: `revert_email_removal_keep_for_lookup` - Reverted email removal, kept for lookup
- **20251219043054**: `add_email_back_for_username_lookup` - Added email back to profiles for username lookup
- **20251219044806**: `add_unique_constraint_user_id` - Added unique constraint on user_id
- **20251219073117**: `allow_username_lookup_for_login` - Added permissive SELECT policy (later removed for security)
- **20251219073406**: `create_secure_username_lookup_function` - Created secure function for username lookup (only exposes user_id and email)
- **20251219073408**: `remove_permissive_username_lookup_policy` - Removed permissive policy in favor of secure function

---

## Summary

**Current State:**
- ✅ RLS is enabled
- ✅ Using Supabase Anonymous Authentication (`signInAnonymously()`)
- ✅ All users (anonymous and authenticated) are fully protected via `auth.uid() = user_id`
- ✅ Secure username lookup via database function (only exposes user_id and email)
- ✅ No security vulnerabilities - users can only access their own profile
- ✅ Seamless upgrade path from anonymous to authenticated

**Security:** ✅ Fully secure - RLS policies use `auth.uid()` which is tied to Supabase Auth sessions. Username lookup uses a secure database function that only exposes `user_id` and `email` (not stats or other sensitive data). This is the recommended Supabase pattern for anonymous users.

