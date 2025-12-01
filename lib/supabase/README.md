# Supabase Integration

This directory contains all Supabase-related utilities and helpers for the Lead-Gun project.

## Structure

- `client.js` - Supabase client initialization
- `auth.js` - Authentication helpers
- `database.js` - Database operations (CRUD)
- `storage.js` - File storage operations
- `hooks.js` - React hooks for authentication
- `index.js` - Main export file

## Environment Variables

Make sure you have these in your `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Usage Examples

### Authentication

```javascript
import { signInWithEmail, signUpWithEmail, signOut, useAuth } from '@/lib/supabase';

// Sign in
const { user, session, error } = await signInWithEmail('user@example.com', 'password');

// Sign up
const { user, session, error } = await signUpWithEmail('user@example.com', 'password', {
  name: 'John Doe'
});

// Sign out
const { error } = await signOut();

// Use auth hook in component
function MyComponent() {
  const { user, loading, error } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!user) return <div>Not authenticated</div>;
  
  return <div>Welcome, {user.email}</div>;
}
```

### Database Operations

```javascript
import { fetchAll, fetchById, insert, updateById, deleteById } from '@/lib/supabase';

// Fetch all leads
const { data, error } = await fetchAll('leads');

// Fetch with filters
const { data, error } = await fetchAll('leads', '*', {
  status: 'active',
  city: 'Istanbul'
});

// Fetch single lead
const { data, error } = await fetchById('leads', '123');

// Insert new lead
const { data, error } = await insert('leads', {
  companyName: 'Example Corp',
  email: 'info@example.com',
  phone: '+90 212 555 0101'
});

// Update lead
const { data, error } = await updateById('leads', '123', {
  status: 'inactive'
});

// Delete lead
const { data, error } = await deleteById('leads', '123');
```

### Storage Operations

```javascript
import { uploadFile, getPublicUrl, deleteFile } from '@/lib/supabase';

// Upload file
const file = event.target.files[0];
const { data, error } = await uploadFile('avatars', 'user-123.jpg', file);

// Get public URL
const url = getPublicUrl('avatars', 'user-123.jpg');

// Delete file
const { data, error } = await deleteFile('avatars', 'user-123.jpg');
```

## Notes

- All functions return `{ data, error }` pattern
- Always check for `error` before using `data`
- Use `useAuth()` hook in client components only
- Database operations require proper RLS (Row Level Security) policies in Supabase

