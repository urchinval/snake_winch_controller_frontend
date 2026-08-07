# SNAKE Winch Controller — Frontend

React/TypeScript/Vite SPA for operating a winch mounted on one of the ground
robotic platforms. Talks to the ESP32-based winch controller (see the
`winch_controller` firmware repo) through nginx running on the car's
Raspberry Pi, over the operator's WireGuard tunnel.

## How it fits together

```
Operator laptop --(WireGuard)--> Pi:80 (nginx)
                                    |-- /             -> this SPA (static files)
                                    |-- /api/v1/*      -> ESP32 winch controller (192.168.212.200)
                                    `-- /stream/winch_cam/ -> MediaMTX (127.0.0.1:8889, WebRTC)
```

The SPA never talks to the ESP32 or to MediaMTX directly — everything goes
through nginx on the Pi, same-origin. This matters for two reasons:

- Only port 80 needs to be reachable over the WireGuard tunnel; no internal
  ports or device IPs are exposed to the operator's machine.
- The camera stream's auth header (`Authorization: Basic ...`) is injected
  by nginx server-side, the browser never sees or needs credentials.

Because of this, **all API/stream paths in the code are relative**
(`BASE_URL = '/api/v1'` in `src/common/api/constants.ts`,
`CAMERA_PATH = '/stream/winch_cam/'` in
`src/components/back-cam-video/common/constants.ts`, resolved against
`window.location.origin`). None of it needs to change if the ESP32's IP or
subnet changes — only nginx's `proxy_pass` target does.

## Structure

- `src/api/` — thin fetch wrapper (`client.ts`) + winch-specific calls (`winch.ts`)
- `src/hooks/useWinchController.ts` — single source of truth for winch state:
  polls `/winch/state` every `STATE_POLL_INTERVAL_MS`, sends a heartbeat
  every `HEARTBEAT_INTERVAL_MS` while a direction button is held, and blocks
  direction input based on the controller's `stopReason` (not on local
  heartbeat/ref state — that caused race conditions with delayed responses)
- `src/components/control-panel/` — hold-to-run forward/reverse buttons
- `src/components/back-cam-video/` — winch-mounted camera feed (WebRTC via
  MediaMTX, proxied through nginx)
- `src/pages/WinchPage.tsx` — assembles the above into the operator view

## Local development

```bash
npm install
npm run dev
```

`vite dev` serves on its own port with no nginx in front of it, so
`/api/v1/*` and `/stream/winch_cam/*` requests won't resolve to anything
unless you're also running against a live Pi. Point Vite's dev proxy at the
Pi's WireGuard IP if you need to iterate against real hardware:

```ts
// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/api/v1': 'http://192.168.112.2',
      '/stream/winch_cam': { target: 'http://192.168.112.2', ws: true },
    },
  },
});
```

## Deploy

```bash
./deploy.sh
```

Builds with `npm run build` and `rsync --delete`s `dist/` to
`/var/www/winch` on the Pi. Before running it, fill in `deploy.sh`:

```bash
PI_HOST="admin@<pi-ip>"   # Pi's WireGuard address
```

Requires nginx already set up on the Pi
(serving `dist/` as static files at `/`, proxying `/api/v1/` to the ESP32's
current IP).

## Known constraints

- The maintenance AP / `POST /api/v1/wifi/config` flow on the ESP32 (see the
  firmware repo) is not exposed anywhere in this UI by design — it's a
  field-recovery path meant to be used directly against the ESP32's own AP
  (`SNAKE-Winch-Setup`), not through the normal operator flow.
