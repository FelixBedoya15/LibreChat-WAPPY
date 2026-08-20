---
name: vps-deploy-sync
description: >-
  Safely deploy updates, sync agents, and verify services on the WAPPY production VPS server (srv999875).
---

# VPS Deploy & Agent Sync Procedure (srv999875)

This skill outlines the strict, safe workflow for deploying code updates, prompt changes, and database synchronizations to the WAPPY production server.

---

## 1. Pre-Deployment Checks (Local Machine)

Before executing or guiding deployment commands on the production VPS, ensure:
1. All local changes are committed and pushed to the remote repository:
   ```bash
   git status
   git add .
   git commit -m "feat(agents): update prompts and system configurations"
   git push origin main
   ```
2. Any newly added scripts or migrations have been syntax-checked and tested.

---

## 2. Production VPS Execution Steps (`srv999875`)

Connect to the VPS or execute via remote runner:

### Step A: Pull Latest Changes
Navigate to the project root directory and pull the latest commits from GitHub:
```bash
cd /root/LibreChat-WAPPY && git pull
```

### Step B: Sync Agents and Prompts in Docker
Execute the exact synchronization command inside the running `LibreChat` container:
```bash
docker exec -it LibreChat node scripts/restore-and-sync-all.js
```

### Step C: Optional Database Migration (If applicable)
If the deployment includes database schema updates or plan changes:
```bash
docker exec -it LibreChat node update_plans.js
```

---

## 3. Post-Deployment Verification

1. **Check Container Health:**
   ```bash
   docker ps --filter "name=LibreChat"
   ```
2. **Inspect Recent Logs:**
   ```bash
   docker logs --tail 50 LibreChat
   ```
3. **Verify Agent Availability:** Ensure all agents in LibreChat UI load their updated system prompts without errors.
