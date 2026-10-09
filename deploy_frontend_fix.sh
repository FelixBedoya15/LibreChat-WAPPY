#!/bin/bash
npm run build:client
ssh root@srv999875 "docker cp /root/LibreChat-WAPPY/client/dist/. LibreChat:/app/client/dist/"
git add client/src client/dist
git commit -m "fix(ui): correct invalid lucide-react import causing React crash #130"
