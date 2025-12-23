# Frontend Migration Guide - Supabase to PocketBase

Complete guide to migrating the frontend from Supabase to PocketBase.

---

## Overview

This guide covers:
1. Installing PocketBase SDK
2. Creating PocketBase client configuration
3. Migrating authentication context
4. Updating data hooks
5. Replacing Supabase Edge Functions
6. Testing the migration

---

## Step 1: Install PocketBase SDK

```bash
cd lingua-spark-86
npm install pocketbase
```

---

## Step 2: Environment Variables

Update `.env` file:

```env
# Replace Supabase variables with PocketBase
VITE_POCKETBASE_URL=https://linguaspark-pb.fly.dev
VITE_OPENAI_API_KEY=sk-your-openai-key

# Remove these Supabase variables:
# VITE_SUPABASE_URL=...
# VITE_SUPABASE_ANON_KEY=...
```

---

## Step 3: File Structure Changes

### Files to Create:
```
src/
├── lib/
│   └── pocketbase.ts          # NEW: PocketBase client
├── api/
│   ├── translate.ts           # NEW: Translation API wrapper
│   ├── tts.ts                 # NEW: Text-to-speech wrapper
│   └── audio.ts               # NEW: Audio generation wrapper
└── contexts/
    └── AuthContext.tsx        # REPLACE: Update for PocketBase
```

### Files to Update:
```
src/hooks/
├── useLessons.ts             # Update queries/mutations
├── useVocabulary.ts          # Update queries/mutations
├── useSRS.ts                 # Update queries/mutations
└── useTextToSpeech.ts        # Update API calls

src/pages/
├── Stats.tsx                 # Update realtime subscriptions
├── Profile.tsx               # Update profile queries
└── Reader.tsx                # Update session tracking
```

### Files to Remove (after migration):
```
src/integrations/supabase/
├── client.ts
└── types.ts

supabase/                     # Entire directory can be archived
```

---

## Step 4: Code Migration Examples

### 4.1 Authentication

**Before (Supabase):**
```typescript
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: { data: { display_name: displayName } }
});
```

**After (PocketBase):**
```typescript
const user = await pb.collection('users').create({
  email,
  password,
  passwordConfirm: password,
  emailVisibility: true
});

// Create profile
await pb.collection('profiles').create({
  user: user.id,
  display_name: displayName
});
```

### 4.2 Queries

**Before (Supabase):**
```typescript
const { data } = await supabase
  .from('lessons')
  .select('*')
  .eq('language', targetLanguage)
  .eq('is_archived', false)
  .order('created_at', { ascending: false });
```

**After (PocketBase):**
```typescript
const lessons = await pb.collection('lessons').getFullList({
  filter: `language = "${targetLanguage}" && is_archived = false`,
  sort: '-created'
});
```

### 4.3 Create/Update

**Before (Supabase):**
```typescript
const { data, error } = await supabase
  .from('vocabulary')
  .insert(newWord)
  .select()
  .single();
```

**After (PocketBase):**
```typescript
const word = await pb.collection('vocabulary').create(newWord);
```

### 4.4 Realtime Subscriptions

**Before (Supabase):**
```typescript
const channel = supabase
  .channel('stats-realtime')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'vocabulary',
    filter: `user_id=eq.${user.id}`
  }, (payload) => {
    // Handle update
  })
  .subscribe();
```

**After (PocketBase):**
```typescript
pb.collection('vocabulary').subscribe('*', (e) => {
  // e.action: 'create' | 'update' | 'delete'
  // e.record: the changed record
  if (e.record.user === pb.authStore.model?.id) {
    // Handle update
  }
}, { filter: `user = "${pb.authStore.model?.id}"` });
```

### 4.5 File Uploads

**Before (Supabase):**
```typescript
const { data, error } = await supabase.storage
  .from('lesson-audio')
  .upload(fileName, audioBuffer);
  
const { data: urlData } = supabase.storage
  .from('lesson-audio')
  .getPublicUrl(fileName);
```

**After (PocketBase):**
```typescript
const formData = new FormData();
formData.append('audio_file', audioBlob);
formData.append('title', title);
// ... other fields

const lesson = await pb.collection('lessons').create(formData);
const audioUrl = pb.files.getUrl(lesson, lesson.audio_file);
```

---

## Step 5: API Wrappers for OpenAI

Since PocketBase doesn't have edge functions, create API wrappers:

### Option A: Direct Frontend Calls (Simplest)

**src/api/translate.ts:**
```typescript
export async function translateWord(
  word: string,
  targetLanguage: string,
  nativeLanguage: string
) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Translate: ${word}` }
      ]
    })
  });
  
  const data = await response.json();
  return parseTranslationResponse(data);
}
```

**⚠️ Security Note:** API key is exposed in frontend. For production, consider Option B (backend routes) or Option C (serverless functions).

### Option B: PocketBase Custom Routes (More Secure)

Create custom routes in PocketBase using hooks (requires custom PocketBase build or JS hooks extension).

### Option C: Separate Serverless Functions (Recommended for Production)

Deploy translation/TTS functions on Vercel/Cloudflare Workers, keep PocketBase for data only.

---

## Step 6: Migration Checklist

### Pre-Migration
- [ ] Deploy PocketBase to Fly.io
- [ ] Import schema and enable realtime
- [ ] Set OpenAI API key secrets
- [ ] Create test admin account
- [ ] Verify PocketBase API is accessible

### Code Migration
- [ ] Install `pocketbase` npm package
- [ ] Create `src/lib/pocketbase.ts`
- [ ] Create API wrappers (`src/api/*`)
- [ ] Update `AuthContext.tsx`
- [ ] Update `useLessons.ts`
- [ ] Update `useVocabulary.ts`
- [ ] Update `useSRS.ts`
- [ ] Update `useTextToSpeech.ts`
- [ ] Update `Stats.tsx` realtime
- [ ] Update `Profile.tsx`
- [ ] Update `Reader.tsx`
- [ ] Update environment variables

### Testing
- [ ] Test signup flow
- [ ] Test login flow
- [ ] Test logout
- [ ] Test lesson creation
- [ ] Test vocabulary add/update
- [ ] Test reading sessions
- [ ] Test stats realtime updates
- [ ] Test file upload (audio)
- [ ] Test translation API
- [ ] Test audio generation

### Cleanup
- [ ] Remove Supabase imports
- [ ] Delete `src/integrations/supabase/`
- [ ] Remove Supabase from package.json (optional)
- [ ] Archive `supabase/` directory
- [ ] Update README

---

## Step 7: Field Mapping Reference

### Authentication
| Supabase | PocketBase |
|----------|-----------|
| `user.id` | `pb.authStore.model.id` |
| `user.email` | `pb.authStore.model.email` |
| `user.user_metadata` | Profile collection |
| `session.access_token` | `pb.authStore.token` |

### Collections
| Supabase Table | PocketBase Collection |
|----------------|----------------------|
| `profiles.user_id` | `profiles.user` (relation) |
| `lessons.created_by` | `lessons.created_by` (relation) |
| `vocabulary.user_id` | `vocabulary.user` (relation) |
| `reading_sessions.user_id` | `reading_sessions.user` (relation) |
| `reading_sessions.lesson_id` | `reading_sessions.lesson` (relation) |

### Timestamps
| Supabase | PocketBase |
|----------|-----------|
| `created_at` | `created` (auto) |
| `updated_at` | `updated` (auto) |

### Files
| Supabase Storage | PocketBase |
|------------------|-----------|
| Bucket: `lesson-audio` | Field: `audio_file` on lessons |
| `storage.from().upload()` | `collection.create(formData)` |
| `storage.getPublicUrl()` | `pb.files.getUrl(record, field)` |

---

## Step 8: Query Filter Syntax

PocketBase uses different filter syntax than Supabase:

### Equality
```typescript
// Supabase
.eq('language', 'es')

// PocketBase
filter: 'language = "es"'
```

### Multiple Conditions
```typescript
// Supabase
.eq('language', 'es')
.eq('is_archived', false)

// PocketBase
filter: 'language = "es" && is_archived = false'
```

### Comparison
```typescript
// Supabase
.gte('created_at', date)

// PocketBase
filter: `created >= "${date}"`
```

### Like/Contains
```typescript
// Supabase
.ilike('title', '%search%')

// PocketBase
filter: 'title ~ "search"'
```

### Sorting
```typescript
// Supabase
.order('created_at', { ascending: false })

// PocketBase
sort: '-created'  // - for descending, + for ascending
```

---

## Step 9: Error Handling

### Supabase Error
```typescript
const { data, error } = await supabase.from('lessons').select();
if (error) {
  console.error(error);
}
```

### PocketBase Error
```typescript
try {
  const lessons = await pb.collection('lessons').getFullList();
} catch (error) {
  if (error.status === 404) {
    // Not found
  } else if (error.status === 403) {
    // Forbidden
  }
  console.error(error);
}
```

---

## Step 10: Common Pitfalls

### 1. Relation Fields
- **Issue:** PocketBase returns relation IDs by default
- **Solution:** Use `expand` parameter:
  ```typescript
  const sessions = await pb.collection('reading_sessions').getFullList({
    expand: 'lesson'
  });
  // Access: session.expand.lesson.title
  ```

### 2. User ID vs User Object
- **Issue:** Supabase uses `user_id`, PocketBase uses relation to `users`
- **Solution:** Always use `user` field name and pass user ID as string

### 3. Realtime Filters
- **Issue:** Realtime receives all events without server-side filtering
- **Solution:** Filter on client side:
  ```typescript
  pb.collection('vocabulary').subscribe('*', (e) => {
    if (e.record.user === pb.authStore.model?.id) {
      // Handle own records only
    }
  });
  ```

### 4. File URLs
- **Issue:** PocketBase file URLs need proper construction
- **Solution:** Always use `pb.files.getUrl(record, filename)`

### 5. Auth State Persistence
- **Issue:** Auth not persisting across page reloads
- **Solution:** PocketBase auto-persists to localStorage, but check:
  ```typescript
  useEffect(() => {
    if (pb.authStore.isValid) {
      setUser(pb.authStore.model);
    }
  }, []);
  ```

---

## Step 11: Testing Strategy

### Unit Tests
1. Test PocketBase client initialization
2. Test auth methods (signup, login, logout)
3. Test CRUD operations
4. Test query filters
5. Test file upload utilities

### Integration Tests
1. Full user flow (signup → create lesson → add vocab)
2. Realtime updates
3. File uploads
4. API integrations (translation, TTS)

### E2E Tests
1. Complete user journey
2. Cross-device sync (realtime)
3. Offline handling (if implemented)

---

## Step 12: Performance Optimization

### Caching
```typescript
// Cache lessons client-side
const [lessons, setLessons] = useState([]);
const [cacheTime, setCacheTime] = useState(0);

const fetchLessons = async (force = false) => {
  const now = Date.now();
  if (!force && lessons.length > 0 && now - cacheTime < 60000) {
    return lessons; // Use cache if < 1 min old
  }
  
  const data = await pb.collection('lessons').getFullList();
  setLessons(data);
  setCacheTime(now);
  return data;
};
```

### Pagination
```typescript
// For large collections, use pagination
const page1 = await pb.collection('vocabulary').getList(1, 50, {
  filter: `user = "${userId}"`
});
```

### Selective Queries
```typescript
// Only fetch needed fields
const lessons = await pb.collection('lessons').getFullList({
  fields: 'id,title,language' // Reduce payload
});
```

---

## Step 13: Rollback Plan

If issues occur during migration:

1. **Keep Supabase running** until migration is complete
2. **Feature flag**: Use environment variable to switch between backends
3. **Gradual migration**: Migrate one feature at a time
4. **Monitoring**: Watch for errors in production logs
5. **Rollback**: Switch environment variable to use Supabase if needed

---

## Step 14: Post-Migration

After successful migration:

1. **Monitor for 48 hours**
   - Check error rates
   - Monitor API usage
   - Verify realtime updates
   - Check file uploads

2. **Optimize**
   - Add caching where needed
   - Optimize query filters
   - Reduce API calls

3. **Document**
   - Update README with new setup
   - Document PocketBase-specific patterns
   - Update team wiki

4. **Decommission Supabase**
   - Export any needed data
   - Cancel subscription
   - Remove credentials
   - Archive old code

---

## Resources

- **PocketBase Docs**: https://pocketbase.io/docs/
- **PocketBase JS SDK**: https://github.com/pocketbase/js-sdk
- **Migration Helper**: See `src/lib/pocketbase.ts` for utilities
- **Support**: Create GitHub issues for questions

---

## Quick Reference

### Install Package
```bash
npm install pocketbase
```

### Initialize Client
```typescript
import PocketBase from 'pocketbase';
export const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL);
```

### Auth
```typescript
await pb.collection('users').authWithPassword(email, password);
pb.authStore.isValid; // check if logged in
pb.authStore.model; // current user
pb.authStore.clear(); // logout
```

### CRUD
```typescript
await pb.collection('name').getFullList();
await pb.collection('name').getOne(id);
await pb.collection('name').create(data);
await pb.collection('name').update(id, data);
await pb.collection('name').delete(id);
```

### Realtime
```typescript
pb.collection('name').subscribe('*', (e) => {
  console.log(e.action, e.record);
});
```

---

**Ready to migrate!** Start with authentication, then move to data layer, then realtime features. Test thoroughly at each step.
