# Social Features (Chat / Invites / Presence)

## Presence

- Online status is tracked via active Socket.io connections.
- `GET /api/players` returns:
  - `online`: boolean
  - `playingRoomId`: string|null (only when user is a player in an active room)

## Invites

### Data

Invites are stored in MongoDB collection: `invites`

Fields (current):
- `fromSub`, `fromName`
- `toSub`
- `roomId`
- `timeMode`
- `status`: `pending|accepted|declined`
- `createdAt`, `respondedAt`

### API

- `GET /api/invites/mine?limit=50` → invite inbox for the current user.

### Socket.io

- Client → server:
  - `invite:send { toSub, roomId }`
  - `invite:respond { id, action: accept|decline }`

- Server → client:
  - `invite:received` (delivered to target user's sockets)
  - `invite:updated` (delivered to inviter)

## Room chat

### Socket.io

- Client → server: `chat:send { roomId, text }`
- Server → room: `chat:message { roomId, ts, sub, name, text }`

Limits:
- max 500 chars

## Notes

- Currently chat messages are not persisted; they are realtime only.
- Invites are persisted.
