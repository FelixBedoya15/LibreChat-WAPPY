#!/bin/bash
echo "Waiting for build to finish..."
while pgrep -f "vite" > /dev/null; do sleep 5; done
echo "Build finished. Syncing to VPS..."
git add client/src client/dist api/
git commit -m "feat(sgsst): implement PubChem API tool, add Matriz Guia grid, fix heatmap colors"
ssh root@srv999875 "cd /root/LibreChat-WAPPY && git pull && docker cp /root/LibreChat-WAPPY/client/dist/. LibreChat:/app/client/dist/ && docker exec LibreChat node scripts/restore-and-sync-all.js"
echo "Deployed successfully."
