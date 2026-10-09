#!/bin/bash
echo "Waiting for build to finish..."
while pgrep -f "vite" > /dev/null; do sleep 5; done
echo "Build finished. Syncing to VPS..."
git add client/src client/dist
git commit -m "style(ui): consolidate NotebookLM MCP tools into a single toggle with standard styling"
ssh root@srv999875 "cd /root/LibreChat-WAPPY && git pull && docker cp /root/LibreChat-WAPPY/client/dist/. LibreChat:/app/client/dist/"
echo "Deployed successfully."
