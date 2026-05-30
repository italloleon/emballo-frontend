# Likes & Cheers — Frontend Implementation

## Overview

Two social features added to the gym feed: **likes** on any feed item and **cheers** sent user-to-user.

---

## Files Changed

| File | Change |
|------|--------|
| `src/api/feed.ts` | Added `likes_count`, `liked_by_me` to `EventEntry` and `PostEntry`; added `toggleLike`, `getLikers` |
| `src/api/users.ts` | Added `cheerUser` |
| `src/lib/meDashboard.ts` | Added `cheerCount` field to `MeDashboard` + `parseMeDashboard` |
| `src/features/feed/FeedItemCard.tsx` | Added `LikeBar` component and `onLikeToggle` prop |
| `src/features/feed/FeedPage.tsx` | Added `handleLikeToggle`, passes `onLikeToggle` to each card |
| `src/features/feed/CheerButton.tsx` | New reusable cheer button component |
| `src/features/student/Profile.tsx` | Cheers stat tile + received cheers notification section |
| `src/index.css` | `like-pop` and `cheer-burst` keyframes |

---

## API Contract

### Likes

```typescript
// Toggle like on any feed item (post or event)
POST /feed/:id/like
→ { liked: boolean; likes_count: number }

// Fetch likers list (lazy-loaded for modal)
GET /feed/:id/likes
→ { data: { user_id: string; name: string }[]; meta: { total: number } }
```

Both `EventEntry` and `PostEntry` now include:
```typescript
likes_count: number
liked_by_me: boolean
```

### Cheers

```typescript
// Send a cheer (one per sender per recipient per UTC day)
POST /users/:id/cheer
→ { success: boolean; cheers_count: number }
// 409 = already sent today (treat as success on the client)
```

`GET /me/dashboard` now includes:
```typescript
cheers_received_total: number
```

`GET /me/notifications` may include entries of type `cheer_received`:
```typescript
{
  id: string
  type: 'cheer_received'
  read: boolean
  created_at: string
  data: {
    cheer_id: string
    sender: { user_id: string; name: string }
    sent_on: string  // "2026-05-28"
  }
}
```

---

## Likes

### `LikeBar` (internal to `FeedItemCard`)

Isolated component that owns all like state per card, preventing sibling re-renders.

**State:**
- `likedByMe` / `likesCount` — local mirror of the server state, used for optimistic updates
- `animationKey` — incremented on each click; changing the `key` on the heart `<span>` remounts it and retriggers the `.like-pop` CSS animation
- `likersOpen` / `likers` / `likersLoading` — modal state, populated lazily on open

**Optimistic update flow:**
1. Flip `likedByMe`, ±1 `likesCount`, increment `animationKey` — instant UI feedback
2. Call `onLikeToggle` so `FeedPage` syncs the parent array
3. `await toggleLike(id)` — on success, reconcile with server's authoritative count
4. On any error, revert all three local state values and notify parent

**Likers modal:**
- Opens only when the count is tapped (not the heart)
- Calls `getLikers` on open; shows a spinner during load
- Renders initials avatars + names; empty state if no likes yet
- Uses the existing `Modal` component from `@/components/ui/Modal`

**`FeedItemCardProps` addition:**
```typescript
onLikeToggle: (id: string, likes_count: number, liked_by_me: boolean) => void
```

`LikeBar` is rendered at the bottom of both post cards and event cards, separated by `border-t border-bg-700`.

---

## Cheers

### `CheerButton` (`src/features/feed/CheerButton.tsx`)

Reusable, drop-in component. Wire it into any card by passing the target user's id.

```tsx
<CheerButton
  targetUserId="abc-123"
  targetUserName="Rafael"
  onCheer={() => { /* optional callback */ }}
/>
```

**Props:**
```typescript
interface CheerButtonProps {
  targetUserId: string
  targetUserName: string
  onCheer?: () => void
}
```

**State machine:**

```
idle ──click──► loading ──success──► done
                        └──409─────► done
                        └──error────► error ──2s──► idle
```

- `done` state is permanent for the session (button disabled) — one cheer per day enforced server-side
- `409` from the API immediately resolves to `done` without showing an error
- On success, `animKey` is incremented to remount the 👏 `<span>` and replay `.cheer-burst`

**To wire into check-in event cards**, add inside `FeedItemCard`'s event branch:
```tsx
import { CheerButton } from './CheerButton'

// Inside the check_in event card, alongside LikeBar:
{entry.type === 'check_in' && typeof entry.payload.user_id === 'string' && (
  <CheerButton
    targetUserId={entry.payload.user_id}
    targetUserName={String(entry.payload.name ?? '')}
  />
)}
```

### Profile page changes

**Stats grid** — 5th tile added:
```typescript
{ label: 'Palmas', value: `👏 ${stats?.cheerCount ?? 0}` }
```
Grid is `grid-cols-2 sm:grid-cols-3` to accommodate 5 tiles cleanly.

**Received cheers section** — renders below the stats grid when `cheerNotifs.length > 0`:
- Fetched independently via `getMyNotifications()` in a separate `useEffect` (errors silently swallowed — secondary data)
- Filtered to `type === 'cheer_received'`
- Gold initials avatar + sender name + relative timestamp
- Amber dot (`bg-amber-400`) for unread notifications

---

## Animations

Both keyframes live in `src/index.css`.

```css
/* Heart pop on like/unlike */
@keyframes like-pop {
  0%   { transform: scale(1); }
  40%  { transform: scale(1.35); }
  100% { transform: scale(1); }
}
.like-pop { animation: like-pop 0.25s ease-out; }

/* Clapping hands burst on cheer */
@keyframes cheer-burst {
  0%   { transform: scale(1) rotate(0deg); }
  30%  { transform: scale(1.4) rotate(-10deg); }
  60%  { transform: scale(1.2) rotate(8deg); }
  100% { transform: scale(1) rotate(0deg); }
}
.cheer-burst { animation: cheer-burst 0.4s ease-out; }
```

Both are triggered via the React key-remount trick: incrementing a state counter that is used as the `key` on the animated `<span>` forces a remount, which restarts the CSS animation without needing JS animation libraries.

---

## Pending

- Wire `CheerButton` into `check_in` event cards in `FeedItemCard` (see snippet above)
- Backend endpoints for likes and cheers not yet implemented
- `POST /feed/:id/like` toggle endpoint
- `GET /feed/:id/likes` likers list endpoint  
- `POST /users/:id/cheer` cheer endpoint
- `cheers_received_total` field on `/me/dashboard`
- `cheer_received` notification type on `/me/notifications`
