# Media Upload — Frontend Implementation Guide

## Overview

The backend exposes two distinct media systems. They differ in storage strategy and frontend contract.

| System | Model | Storage | Upload method |
|--------|-------|---------|---------------|
| Feed posts | `PostMedia` (dedicated) | Private `feed` disk, served via proxy | Binary file upload |
| Machine gallery | `Media` (polymorphic) | External URL (CDN / S3 public) | URL reference only |

Neither system has a UI yet. This doc covers the API contract so the frontend can be wired up.

---

## 1. Feed Media (Posts)

### How it works

Two-step flow. File is uploaded first, independently of the post. The returned `storage_key` is then passed when creating the post.

```
Step 1 — Upload file
POST /feed/media
Content-Type: multipart/form-data
Body: file=<binary>
→ { storage_key, media_type, mime_type, size }

Step 2 — Create post with media
POST /feed/posts
Body: { body, media: [{ storage_key, mime_type, size, order }] }
```

This two-step pattern lets you show an upload progress bar before the user submits.

### Upload endpoint

```
POST /api/v1/feed/media
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Field:** `file` — required

**Constraints:**
- Allowed types: `jpg`, `jpeg`, `png`, `webp` (no SVG)
- Max size: 10 MB
- File is converted to `webp` server-side before storage

**Response `201`:**
```typescript
{
  storage_key: string   // e.g. "academies/{id}/feed/{uuid}.webp"
  media_type: "image"
  mime_type: string     // always "image/webp" after conversion
  size: number          // bytes after conversion
}
```

**Rate limit:** 20 uploads / hour / user.

**Error `422`:** file too large, wrong type, or read error.

### Create post with media

```
POST /api/v1/feed/posts
Authorization: Bearer <token>
Content-Type: application/json
```

```typescript
{
  body?: string           // required if no media, max 1000 chars
  pinned?: boolean        // admin only
  media?: Array<{
    storage_key: string   // from step 1
    mime_type?: string
    size?: number
    order?: number        // 0-based display order
    media_type?: "image"  // currently only "image" for uploads
  }>
}
```

**Constraints:** max 5 media items per post. At least one of `body` or `media` must be present.

Staff (admin/instructor) can also attach via external URL instead of `storage_key`:
```typescript
{ url: string, media_type: "image" | "video", order?: number }
```

### Serving media

Media files are private (not publicly accessible by URL). Serve them through the proxy endpoint:

```
GET /api/v1/feed/media/{mediaId}
Authorization: Bearer <token>
```

The server validates academy scope before streaming the file. The `url` field on `PostEntry.media[]` already contains this path — use it directly in `<img src>` with the axios base URL.

```typescript
// FeedItemCard.tsx — media grid already renders this correctly:
entry.media.map(m => <img src={m.url} />)
// m.url is /api/v1/feed/media/{id} — the auth header is NOT sent for <img> tags.
```

> **Note:** `<img src>` does not attach the Bearer token. If media returns 401 in production,
> you'll need a cookie-based auth token or signed URLs. This is a known gap for private feed media.

### Frontend changes needed

**`src/api/feed.ts`** — add upload call:
```typescript
export const uploadFeedMedia = (file: File) => {
  const form = new FormData()
  form.append('file', file)
  return api.post<{
    storage_key: string
    media_type: string
    mime_type: string
    size: number
  }>('/feed/media', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}
```

**`src/features/feed/PostComposer.tsx`** — attach a file input, call `uploadFeedMedia` on change, collect `storage_key` values, pass them in the `createPost` body.

---

## 2. Machine Media

### How it works

No binary upload. The caller provides a public URL (from S3, Cloudinary, or any CDN). The backend stores the URL reference and manages ordering.

```
POST /api/v1/machines/{machineId}/media
Body: { url, collection?, caption?, filename?, mime_type?, size?, metadata? }
→ 201 Media object
```

### Endpoints

All require `Authorization: Bearer <token>` and `admin` or `instructor` role (write operations).

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/machines/{id}/media` | List all media for a machine (ordered) |
| `POST` | `/machines/{id}/media` | Add a media item |
| `PUT` | `/machines/{id}/media/{mediaId}` | Update caption, collection, or order |
| `POST` | `/machines/{id}/media/reorder` | Bulk reorder |
| `DELETE` | `/machines/{id}/media/{mediaId}` | Remove |

### Add media

```typescript
// POST /machines/{id}/media
{
  url: string           // required, valid URL, max 1000 chars
  collection?: "gallery" | "thumbnail" | "video"  // defaults to "gallery"
  caption?: string      // max 500 chars
  filename?: string     // original filename, max 255 chars
  mime_type?: string    // e.g. "image/jpeg"
  size?: number         // bytes
  metadata?: object     // free-form JSON
}
```

`order` is assigned automatically (current max + 1). No need to send it on creation.

**Response `201`:**
```typescript
{
  id: string
  collection: string
  url: string
  caption: string | null
  filename: string | null
  mime_type: string | null
  size: number | null
  order: number
  metadata: object | null
  created_at: string
  updated_at: string
}
```

### Update

```typescript
// PUT /machines/{id}/media/{mediaId}
{
  caption?: string | null
  collection?: "gallery" | "thumbnail" | "video"
  order?: number
  metadata?: object
}
```

### Reorder

```typescript
// POST /machines/{id}/media/reorder
{
  media: Array<{ id: string, order: number }>
}
```

All `id` values must belong to the machine — otherwise `422`. Returns the full updated list.

### The `show` endpoint response

`GET /machines/{id}` now returns the machine with its media collection embedded:

```typescript
{
  id: string
  name: string
  // ...other fields...
  media: Array<{
    id: string
    collection: "gallery" | "thumbnail" | "video"
    url: string
    caption: string | null
    order: number
    // ...
  }>
}
```

### Frontend changes needed

**`src/api/exercises.ts`** — add machine media calls:
```typescript
export const getMachineMedia = (machineId: string) =>
  api.get(`/machines/${machineId}/media`)

export const addMachineMedia = (machineId: string, data: {
  url: string
  collection?: 'gallery' | 'thumbnail' | 'video'
  caption?: string
  filename?: string
  mime_type?: string
  size?: number
}) => api.post(`/machines/${machineId}/media`, data)

export const updateMachineMedia = (machineId: string, mediaId: string, data: {
  caption?: string | null
  collection?: string
  order?: number
}) => api.put(`/machines/${machineId}/media/${mediaId}`, data)

export const reorderMachineMedia = (machineId: string, items: { id: string; order: number }[]) =>
  api.post(`/machines/${machineId}/media/reorder`, { media: items })

export const deleteMachineMedia = (machineId: string, mediaId: string) =>
  api.delete(`/machines/${machineId}/media/${mediaId}`)
```

**`src/features/admin/MachineDetail.tsx`** — render the `machine.media` gallery returned by `getMachine`, add a form to submit a URL for new media items.

---

## Architecture notes

### Why machine media uses URLs, not file uploads

`StoreMachineMediaRequest` validates `url` as required. There is no `UploadFeedMediaAction` equivalent for machines. The intended flow is:
1. Admin uploads the image to an external service (S3, Cloudinary, etc.)
2. Admin pastes the resulting public URL into the machine media form

If server-side upload is ever added for machines, the backend will need an `UploadMachineMediaAction` similar to `UploadFeedMediaAction`, plus a storage disk config entry.

### Morph map (backend — already fixed)

`Machine` uses a polymorphic `media()` relationship (`morphMany`). All polymorphic models must be registered in `AppServiceProvider::enforceMorphMap`. `Machine` was missing, causing 500 on `GET /machines/{id}`. Fixed in `AppServiceProvider.php`:

```php
Relation::enforceMorphMap([
    // ...existing entries...
    'machine' => Machine::class,
]);
```

If you add `HasMedia` to any new model in the future, add it to this map too.

### Feed media serving gap

`FeedItemCard` renders `<img src={m.url}>` where `m.url` is `/api/v1/feed/media/{id}`. Browser `<img>` tags do not send the `Authorization` header, so this only works in development where the backend doesn't enforce auth on the streaming endpoint, or if the response has permissive cookie/session handling. For production, coordinate with the backend on signed URLs or a cookie-scoped auth token.
