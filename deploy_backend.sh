#!/bin/bash
echo "Syncing backend to VPS..."
ssh root@srv999875 "cd /root/LibreChat-WAPPY && git pull && docker cp /root/LibreChat-WAPPY/api/. LibreChat:/app/api/ && docker restart LibreChat"
echo "Backend deployed successfully."
