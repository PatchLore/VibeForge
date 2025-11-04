# 🧹 Archive Tracks Without Images - Implementation Guide

## Overview
This implementation archives incomplete tracks (missing `image_url`) instead of deleting them, keeping the live trending feed clean while preserving data for potential restoration.

## ✅ Changes Made

### 1. SQL Migration Script
**File**: `archive-tracks-without-images.sql`

This script:
- Marks all completed tracks without images as `status = 'archived'`
- Creates an index for faster queries on status + image_url
- Includes verification queries to see archived count
- Provides optional restore commands

**To Run**:
1. Open your Supabase SQL Editor
2. Copy and paste the contents of `archive-tracks-without-images.sql`
3. Execute the script
4. Review the verification query results

### 2. Updated API Endpoints

All public-facing track endpoints now exclude archived tracks and require valid images:

#### `/api/tracks/trending`
- ✅ Filters: `status = 'completed'` AND `status != 'archived'` AND `image_url IS NOT NULL` AND `image_url != ''`
- Used by: `/app/trending` page

#### `/api/tracks/popular`
- ✅ Same filters as trending
- Used by: Homepage trending vibes component

#### `/api/tracks/latest`
- ✅ Same filters as trending
- Used for: Recent tracks displays

#### `/api/tracks/random`
- ✅ Same filters as trending
- Used by: Live radio player

### 3. User Tracks Endpoint (Unchanged)
**File**: `/api/tracks/user/route.ts`

- Shows **all** user tracks (including archived)
- Allows users to see their full history, even incomplete tracks
- Users can identify which tracks need repair

## 🔄 Status Values

The `status` column uses these values:
- `'processing'` - Track is still being generated
- `'completed'` - Track is complete with audio AND image
- `'archived'` - Track is complete but missing image (not shown in public feeds)

## 🛠️ Restoring Archived Tracks

If you want to restore a specific archived track after fixing its image:

```sql
UPDATE tracks 
SET status = 'completed' 
WHERE id = '<track_id>';
```

Or restore multiple tracks:
```sql
UPDATE tracks 
SET status = 'completed' 
WHERE status = 'archived' 
AND image_url IS NOT NULL 
AND image_url != '';
```

## 📊 Verification

After running the migration, check the distribution:

```sql
SELECT 
  status,
  COUNT(*) as count,
  COUNT(*) FILTER (WHERE image_url IS NOT NULL AND image_url != '') as with_images,
  COUNT(*) FILTER (WHERE image_url IS NULL OR image_url = '') as without_images
FROM tracks
GROUP BY status
ORDER BY status;
```

## ✅ Expected Result

- ✅ Live trending feed only shows complete tracks with valid images
- ✅ Incomplete/broken records are safely archived (not deleted)
- ✅ Users can still see all their tracks in "My Tracks" (including archived)
- ✅ Easy restoration via SQL if needed later


