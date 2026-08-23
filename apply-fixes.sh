#!/bin/bash
# One-shot finisher for the family-tracker cleanup.
# Run:  bash ~/family-tracker/apply-fixes.sh
set -e
cd "$(dirname "$0")"

echo "==> 1/4  Writing .mcp.json (token now read from environment, not hardcoded)"
cat > .mcp.json << 'MCPEOF'
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest"
      ],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "${SUPABASE_ACCESS_TOKEN}"
      }
    },
    "vercel": {
      "command": "npx",
      "args": [
        "-y",
        "@vercel/mcp@latest"
      ]
    },
    "context7": {
      "command": "npx",
      "args": [
        "-y",
        "@upstash/context7-mcp@latest"
      ]
    }
  }
}
MCPEOF

echo "==> 2/4  Writing .claude/settings.local.json (only the supabase MCP enabled)"
mkdir -p .claude
cat > .claude/settings.local.json << 'SETEOF'
{
  "permissions": {
    "allow": [
      "Bash(mkdir -p ~/.ssh)",
      "Bash(chmod 700 ~/.ssh)",
      "Bash(ssh-keyscan -t ed25519 github.com)",
      "Bash(~/.ssh/known_hosts)",
      "Bash(chmod 644 ~/.ssh/known_hosts)",
      "Bash(git config:*)",
      "Bash(git log:*)",
      "Bash(git add:*)",
      "Bash(git commit:*)",
      "Bash(git push:*)",
      "Bash(code --list-extensions)",
      "Bash(supabase status:*)",
      "Bash(supabase projects:*)",
      "Bash(gh auth:*)",
      "Bash(npx expo:*)",
      "Bash(npx vite:*)",
      "Bash(npm run:*)",
      "Bash(lsof -iTCP -sTCP:LISTEN -P)",
      "Bash(lsof -iTCP:5173 -sTCP:LISTEN -P)",
      "Bash(curl -s -o /dev/null -w \"%{http_code}\" http://localhost:5173)",
      "Bash(ipconfig getifaddr:*)",
      "Bash(pkill -f \"vite\")",
      "Bash(lsof -ti:5173)",
      "Bash(xargs kill:*)",
      "Bash(npm --version)",
      "mcp__supabase__list_projects",
      "Bash(node *)",
      "Bash(curl -s -o /dev/null -w \"%{http_code}\" \"https://nmjqjkydrostmqiygtjo.supabase.co/rest/v1/?apikey=sb_publishable_C2g0oYPtPgqcOe3jAijgrw_NZDEc-9L\")",
      "Bash(curl -s -o /dev/null -w \"%{http_code}\\\\n\" -H \"apikey: sb_publishable_C2g0oYPtPgqcOe3jAijgrw_NZDEc-9L\" \"https://nmjqjkydrostmqiygtjo.supabase.co/rest/v1/\")",
      "Bash(curl -s -o /dev/null -w \"%{http_code}\\\\n\" -H \"apikey: sb_publishable_C2g0oYPtPgqcOe3jAijgrw_NZDEc-9L\" \"https://nmjqjkydrostmqiygtjo.supabase.co/auth/v1/health\")",
      "Bash(curl -s -H \"apikey: sb_publishable_C2g0oYPtPgqcOe3jAijgrw_NZDEc-9L\" \"https://nmjqjkydrostmqiygtjo.supabase.co/rest/v1/families?select=id&limit=1\")",
      "Bash(curl -s http://localhost:5173/ -o /dev/null -w \"HTTP %{http_code}\\\\n\")",
      "Bash(curl -s \"http://localhost:5173/src/lib/supabase.js\")"
    ]
  },
  "enabledMcpjsonServers": [
    "supabase"
  ]
}
SETEOF

echo "==> 3/4  Supabase token"
echo "    Opening the Supabase tokens page in your browser."
echo "    There: revoke the OLD token, click 'Generate new token', copy it."
open "https://supabase.com/dashboard/account/tokens" 2>/dev/null || true
read -r -p "    Paste your NEW token here (or press Enter to skip for now): " TOKEN
if [ -n "$TOKEN" ]; then
  if [ -f ~/.zshrc ]; then sed -i '' '/^export SUPABASE_ACCESS_TOKEN=/d' ~/.zshrc; fi
  echo "export SUPABASE_ACCESS_TOKEN=$TOKEN" >> ~/.zshrc
  echo "    Saved to ~/.zshrc. Open a new terminal (or run: source ~/.zshrc) to load it."
else
  echo "    Skipped. Later, run:  echo 'export SUPABASE_ACCESS_TOKEN=YOUR_TOKEN' >> ~/.zshrc"
fi

echo "==> 4/4  Removing dead components"
rm -rf _to_delete

echo ""
git status --short
echo ""
read -r -p "Commit and push all of the above now? Vercel will auto-deploy. [y/N] " ANSWER
if [[ "$ANSWER" =~ ^[Yy]$ ]]; then
  git add -A
  git commit -m "Fix evening timezone bug, stale weather cache, splash delay; slim CLAUDE.md; move MCP token to env" \
             -m "Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
  git push
  echo "Pushed. Vercel is deploying."
else
  echo "Nothing committed. Review with 'git diff', then commit when ready."
fi

echo ""
echo "All done. You can delete this script:  rm ~/family-tracker/apply-fixes.sh"
