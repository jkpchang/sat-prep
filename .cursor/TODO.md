## Supabase Integration TODOs

- [x] Add and tighten RLS policies for `profiles` table once basic integration is working.
- [ ] Persist and restore auth state on app startup using `supabase.auth.getSession()` and hydrate the local `authProfile`.
- [ ] Implement “Forgot password?” flow using Supabase password reset (email-based).
- [ ] Decide and implement a strategy for merging progress when a user has multiple anonymous device profiles before account creation.

