# Time Control (Cờ tướng)

This project supports **dual time controls** (server-authoritative):

- **Total time per side** (e.g. 30 minutes each)
- **Per-move limit** (e.g. 3 minutes per move)

If it is your turn and you exceed either limit, you lose by **timeout**.

## Presets

| Mode | Total (per side) | Per move |
|---|---:|---:|
| Blitz (Chớp) | 5:00 | 0:30 |
| Rapid (Nhanh) | 15:00 | 1:00 |
| Standard (Tiêu chuẩn) | 30:00 | 3:00 |

## Notes

- Clocks are enforced by the server (Socket.io). Client UI is only a display.
- Server runs a background ticker to end games on timeout even if the client is idle.
