# Backend Requirements - LinguaSpark Migration

## Application Overview
**LinguaSpark** - A language learning application similar to LingQ, focused on reading comprehension, vocabulary building, and spaced repetition learning.

---

## 1. AUTHENTICATION

### Required Methods
- ✅ **Email/Password Authentication**
  - Sign up with email, password, optional display name
  - Sign in with email/password
  - Email confirmation: optional
  - Password reset flow
  - Session management

### OAuth Providers
- ❌ **Not Required** - No OAuth detected in current implementation

### User Metadata
- `display_name` - User's display name
- `email` - Primary identifier

---

## 2. DATABASE COLLECTIONS

### 2.1 Profiles
**Purpose:** User profile and preferences

**Fields:**
- `user` - Relation to auth user (required, unique)
- `display_name` - Text
- `native_language` - Text (2-5 chars, e.g., "en", "tr")
- `target_language` - Text (2-5 chars, e.g., "es", "fr")
- `daily_lingq_goal` - Number (1-100, default: 20)
- `daily_reading_goal` - Number (minutes)
- `streak_count` - Number (min: 0)
- `last_activity_date` - Date
- `is_premium` - Boolean (default: false)
- `translation_preferences` - JSON object

**Access:**
- User can read/write own profile only
- One profile per user (enforced by unique index)

**Indexes:**
- Unique index on `user` field

---

### 2.2 Lessons
**Purpose:** Learning content (articles, stories, dialogues)

**Fields:**
- `title` - Text (required, 1-500 chars)
- `content` - Text (required, 1-100k chars)
- `description` - Text (0-1000 chars)
- `language` - Text (required, 2-5 chars)
- `difficulty_level` - Select (beginner | intermediate | advanced)
- `content_type` - Select (article | story | dialogue | news | podcast | other)
- `topic` - Text (0-100 chars)
- `audio_file` - File (MP3, max 50MB)
- `word_count` - Number
- `estimated_minutes` - Number
- `is_archived` - Boolean (default: false)
- `is_premium` - Boolean (default: false)
- `created_by` - Relation to user (optional)

**Access:**
- All authenticated users can read
- Authenticated users can create
- Creator can update/delete own lessons

**Indexes:**
- Index on `language`
- Index on `is_archived`

**File Storage:**
- Audio files stored in PocketBase file field
- Public access with signed URLs
- Max 50MB per file

---

### 2.3 Vocabulary
**Purpose:** User's learned words/phrases with SRS data

**Fields:**
- `user` - Relation to auth user (required)
- `word` - Text (required, 1-200 chars)
- `language` - Text (required, 2-5 chars)
- `translation` - Text (0-500 chars)
- `definition` - Text (0-1000 chars)
- `notes` - Text (0-2000 chars)
- `status` - Number (required, -1 to 5)
  - `-1` = Ignored
  - `0` = Known
  - `1-4` = Learning (SRS stages)
  - `5` = Mastered
- `is_phrase` - Boolean (true if word contains spaces)
- `ease_factor` - Number (1.3-2.5, default: 2.5) - SRS algorithm
- `interval_days` - Number (min: 0, default: 0) - SRS algorithm
- `repetitions` - Number (min: 0, default: 0) - SRS algorithm
- `next_review_date` - Date
- `last_reviewed_at` - Date
- `source_lesson` - Relation to lesson (optional)

**Access:**
- User can read/write own vocabulary only

**Indexes:**
- Compound index on `user` + `language`
- Index on `word` (for lookups)
- Index on `status` (for filtering)

**Realtime:**
- ✅ Enable realtime subscriptions (for live stats updates)

---

### 2.4 Reading Sessions
**Purpose:** Track reading/listening activity

**Fields:**
- `user` - Relation to auth user (required)
- `lesson` - Relation to lesson (required)
- `words_read` - Number (min: 0)
- `reading_time_seconds` - Number (min: 0)
- `listening_time_seconds` - Number (min: 0)
- `lingqs_created` - Number (min: 0)
- `completed_at` - Date

**Access:**
- User can read/write own sessions only

**Indexes:**
- Index on `user`
- Index on `created` (auto-created timestamp)

**Realtime:**
- ✅ Enable realtime subscriptions (for live stats updates)

---

### 2.5 Daily Stats
**Purpose:** Aggregated daily metrics for progress tracking

**Fields:**
- `user` - Relation to auth user (required)
- `date` - Date (required)
- `words_learned` - Number (min: 0)
- `lingqs_created` - Number (min: 0)
- `known_words_count` - Number (min: 0)
- `reading_time_seconds` - Number (min: 0)
- `listening_time_seconds` - Number (min: 0)

**Access:**
- User can read/write own stats only

**Indexes:**
- Unique compound index on `user` + `date`
- Index on `date`

---

## 3. FILE STORAGE

### Lesson Audio
- **Type:** MP3 audio files
- **Location:** PocketBase file field on `lessons` collection
- **Access:** Public URLs (authenticated access)
- **Size Limit:** 50MB per file
- **Naming:** Stored with PocketBase's automatic naming

---

## 4. REALTIME REQUIREMENTS

### Collections with Realtime
- ✅ **vocabulary** - Live updates for stats page
- ✅ **reading_sessions** - Live activity tracking
- ✅ **profiles** - Live profile updates

### Use Cases
- Stats page shows live updates when user adds words
- Streak counter updates in real-time
- Daily goal progress updates immediately

---

## 5. EXTERNAL API INTEGRATIONS

### 5.1 Translation API
**Purpose:** Translate words/phrases and get definitions

**Current Implementation:** Supabase Edge Function calling OpenAI GPT-4o-mini

**PocketBase Solution Options:**
1. **Frontend Direct** - Call OpenAI API from frontend (simplest)
2. **PocketBase Hooks** - Custom route in PocketBase
3. **Separate Service** - Deploy on Vercel/Cloudflare Workers

**API Requirements:**
- Input: `word`, `targetLanguage`, `nativeLanguage`
- Output: `translation`, `definition`, `examples[]`, `pronunciation`
- Rate limiting recommended
- Error handling for 429 (rate limit), 402 (credits exhausted)

---

### 5.2 Text-to-Speech API
**Purpose:** Generate pronunciation guides

**Current Implementation:** OpenAI GPT-4o-mini for IPA transcription

**PocketBase Solution:** Same as translation API

**API Requirements:**
- Input: `text`, `language`
- Output: `pronunciation` (IPA format)

---

### 5.3 Lesson Audio Generation
**Purpose:** Generate MP3 audio for lesson content

**Current Implementation:** OpenAI TTS-1 model

**PocketBase Solution:**
1. Call OpenAI TTS API
2. Upload MP3 to lesson's `audio_file` field
3. Update lesson record

**API Requirements:**
- Input: `lessonId`, `text`, `language`
- Output: MP3 audio file
- Max 4000 characters per request (OpenAI limit)
- Upload to PocketBase storage

---

## 6. ACCESS PATTERNS

### Public vs Private Data

**Public (Authenticated Users):**
- All lessons (read-only)

**Private (User-specific):**
- Profiles (own profile only)
- Vocabulary (own words only)
- Reading sessions (own sessions only)
- Daily stats (own stats only)

**Write Access:**
- Users can create lessons
- Creators can edit/delete own lessons
- Users fully control their own data

---

## 7. CRITICAL FEATURES

### Spaced Repetition System (SRS)
- Algorithm uses: `ease_factor`, `interval_days`, `repetitions`
- Calculated on frontend (no backend logic needed)
- Next review date stored in database

### Streak Calculation
- Based on daily activity (vocabulary + reading sessions)
- Calculated from historical data
- Stored in profile but recalculated on demand

### Multi-Language Support
- Languages: Spanish (es), French (fr), German (de), Italian (it), Portuguese (pt), English (en), Turkish (tr)
- Language codes stored as 2-character strings
- Frontend handles language-specific display

---

## 8. PERFORMANCE CONSIDERATIONS

### Indexes
- All collections indexed on `user` field (for user-specific queries)
- Vocabulary indexed on `word` and `status` (for fast lookups)
- Daily stats indexed on `date` (for historical queries)

### Query Patterns
- Lessons filtered by: `language`, `is_archived`, `difficulty_level`, `content_type`, `topic`
- Vocabulary filtered by: `language`, `status`
- Reading sessions sorted by: `created` (descending)
- Daily stats queried for last 400 days (for streak calculation)

---

## 9. SECURITY REQUIREMENTS

### API Key Management
- OpenAI API key stored as environment variable
- Not exposed to frontend (if using backend solution)
- Rate limiting to prevent abuse

### Data Isolation
- Strict user-level access control
- No cross-user data access
- Cascade delete on user deletion

### File Upload Security
- Only MP3 files allowed for audio
- Max 50MB file size
- Authenticated access only

---

## 10. MIGRATION NOTES

### Data Loss Acceptable
- No need to migrate existing data
- Fresh start for all users
- No backward compatibility required

### Supabase Features NOT Used
- Row Level Security (RLS) → PocketBase access rules
- Postgres triggers → Not needed (logic in frontend)
- Edge Functions → Frontend or custom routes
- Storage buckets → PocketBase file fields
- Realtime subscriptions → PocketBase realtime

---

## SUMMARY

**Total Collections:** 5 (profiles, lessons, vocabulary, reading_sessions, daily_stats)

**Auth:** Email/password only

**File Storage:** Lesson audio (MP3)

**Realtime:** 3 collections (vocabulary, reading_sessions, profiles)

**External APIs:** OpenAI (translation, TTS, audio generation)

**Access Model:** User-scoped data with public lesson library

**Deployment Target:** Fly.io (single region, persistent volume)

**Cost Target:** $2-6/month (vs $25/month Supabase Pro)
