# 📘 Soundswoop Future Feature Specification
## 🧩 Blog & Vibe Threads Integration Plan

### 🎯 Overview

This document defines how to integrate two new community-driven features into Soundswoop:

1️⃣ **📝 Blog System** – for updates, announcements, and featured content.
2️⃣ **🧵 Vibe Threads** – for creative collaboration and remixing between users.

These features are designed to:
- Increase user engagement and retention
- Support SEO and community discovery
- Deepen the creative experience through collaboration

---

## 🧱 TECH STACK

- **Frontend**: Next.js 15+, TailwindCSS
- **Backend**: Supabase (Database + Auth + Realtime)
- **Deployment**: Vercel
- **Database**: Supabase PostgreSQL

All authentication and data access use Supabase Row-Level Security (RLS) with `auth.uid()` checks.

---

## 📝 BLOG SYSTEM

### 🧩 Purpose

Create a `/blog` section for posting:
- Product updates
- Feature announcements
- Tips, tutorials, or featured user content

This will serve as both marketing and community hub content.

### 🗃️ Database Schema: `posts`

```sql
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  image_url TEXT,
  tags TEXT[],
  published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read published posts" ON posts
  FOR SELECT USING (published = true);

CREATE POLICY "Authors can insert/update own posts" ON posts
  FOR ALL USING (auth.uid() = author_id);
```

### 🧠 Page Structure

#### `/blog`
- Lists all published posts
- Sort by `created_at DESC`
- Each card shows: title, thumbnail, date, short excerpt, and "Read more" link

#### `/blog/[slug]`
- Full article view
- Styled markdown renderer (use `react-markdown`)
- Show related posts below

### ⚙️ API Routes

#### `/api/posts`
- **GET**: Returns all published posts
- **POST** (admin only): Create new post

### 🧩 Frontend Components

#### `BlogList.tsx`
- Fetch posts from `/api/posts`
- Display grid cards

#### `BlogPost.tsx`
- Renders markdown content with title and metadata

#### `BlogEditor.tsx` (optional for Pro/Admin)
- Form for creating new posts (title, content, image, tags)
- Saves to Supabase via `/api/posts`

### 🧠 Future Enhancements

- Add tags/filters (AI, Music, Art, Product Updates)
- Enable comments (via new `comments` table)
- SEO metadata for OpenGraph previews

---

## 🧵 VIBE THREADS SYSTEM

### 🧩 Purpose

Allow users to remix, respond, or build on each other's generated tracks, creating creative "threads" or "chains" of related vibes.

This becomes a unique Soundswoop social layer — collaborative, artistic, and on-brand.

### 🗃️ Database Schema

```sql
CREATE TABLE IF NOT EXISTS vibe_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_track_id UUID REFERENCES tracks(id) ON DELETE CASCADE,
  child_track_id UUID REFERENCES tracks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE vibe_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own threads" ON vibe_threads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public can read threads" ON vibe_threads
  FOR SELECT USING (true);
```

### 🧠 Flow Logic

#### 1️⃣ User clicks "Add to this vibe" on a track

Opens modal:
- "Generate your remix or visual continuation of Ethereal Horizons"
- Calls `/api/music` with prompt based on original track's metadata
- Stores new `child_track_id` in `vibe_threads`

#### 2️⃣ Display under each track:
```tsx
<VibeThreadList parentTrackId={track.id} />
```

Shows all remixes / responses visually:
- Album art + user name + short prompt snippet
- Clicking a thread item loads its track in the player

### ⚙️ API Routes

#### `/api/threads`
- **GET**: Return all threads for a given `parent_track_id`
- **POST**: Create a new thread (link between two tracks)

**Example:**
```json
POST /api/threads
{
  "parent_track_id": "123",
  "child_track_id": "456",
  "comment": "A darker continuation of the original vibe"
}
```

### 🧩 Components

#### `VibeThreadList.tsx`
- Fetch and display all replies for a parent track
- Each card shows the child track's title, image, and play button

#### `VibeThreadModal.tsx`
- Popup when a user clicks "Add to this vibe"
- Shows track preview + input for comment + "Generate Remix" button

### 🧠 Future Enhancements

- Thread upvoting / liking
- Follow threads
- Collaborative playlists
- "Trending Threads" section on homepage

---

## 🔒 SECURITY NOTES

### Blog:
- Only admins can publish new posts
- Public can read published posts

### Vibe Threads:
- Authenticated users only
- Threads link existing tracks by their `user_id`
- Row-level security ensures isolation and safe ownership

---

## 🧭 DEPLOYMENT CHECKLIST

### ✅ Database Setup
- [ ] Add both tables (`posts`, `vibe_threads`) via Supabase SQL Editor
- [ ] Test RLS policies with different user roles
- [ ] Create indexes for performance (`posts.slug`, `vibe_threads.parent_track_id`)

### ✅ File Structure
Create new folders:
```
src/app/blog/
src/app/api/posts/
src/app/api/threads/
src/components/blog/
src/components/threads/
```

### ✅ Feature Flags
Keep both features behind feature flags:
```env
NEXT_PUBLIC_ENABLE_BLOG=false
NEXT_PUBLIC_ENABLE_THREADS=false
```

Enable once ready to launch by setting flags to `true`

### ✅ Testing
- [ ] Test blog creation and publishing workflow
- [ ] Test vibe thread creation and display
- [ ] Verify RLS policies work correctly
- [ ] Test responsive design on mobile

---

## 📊 IMPLEMENTATION PRIORITY

| Feature | Effort | Timeline | Priority |
|---------|--------|----------|----------|
| 📝 Blog | ★☆☆☆☆ | 1–2 days | Medium |
| 🧵 Vibe Threads | ★★★☆☆ | 3–5 days | High (unique value) |

Both can be developed independently and toggled on when stable.
The database design and route structure are future-proof for scaling.

---

## 🚀 NEXT STEPS

1. **Phase 1**: Implement Blog System
   - Create database schema
   - Build basic CRUD operations
   - Add markdown rendering
   - Test with sample content

2. **Phase 2**: Implement Vibe Threads
   - Create database schema
   - Build thread creation flow
   - Add thread display components
   - Test collaborative features

3. **Phase 3**: Polish & Launch
   - Add SEO optimization
   - Implement feature flags
   - Create admin interfaces
   - Deploy to production

---

## 📝 NOTES

- Both features leverage existing Supabase infrastructure
- Authentication system already in place
- Database design follows established patterns
- Components can reuse existing UI patterns from TrackCard, etc.
- Feature flags allow safe rollout and easy rollback if needed

This specification provides a solid foundation for implementing these community features while maintaining the existing Soundswoop architecture and user experience.
