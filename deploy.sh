 #!/usr/bin/env bash
    set -euo pipefail

    PI_HOST="admin@<pi-ip>"
    REMOTE_DIR="/var/www/winch"

    echo "Building..."
    npm run build

    echo "Syncing to $PI_HOST:$REMOTE_DIR ..."
    rsync -avz --delete dist/ "$PI_HOST:$REMOTE_DIR/"

    echo "Done. Live at <pi-wireguard-ip>"