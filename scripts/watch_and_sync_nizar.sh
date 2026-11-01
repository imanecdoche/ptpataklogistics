#!/usr/bin/env bash
# ==============================================================================
# 🤖 Argon Watcher & Auto-Sync daemon for Antigravity Nizar (Windows <-> Linux)
# Repo: ptpataklogistics (branch: main)
# ==============================================================================

PROJECT_DIR="/media/fatihfarhat/New Volume1/PROJECTS/Patak Logistics System"
BRANCH="main"
REMOTE="origin"
POLL_INTERVAL=15 # seconds
LOG_FILE="$PROJECT_DIR/sync_handoff.log"
PID_FILE="/tmp/argon_nizar_watcher.pid"

# Colors for terminal output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Save PID
echo $$ > "$PID_FILE"

cleanup() {
    echo -e "\n${YELLOW}🛑 Pemantau dihentikan.${NC}"
    rm -f "$PID_FILE"
    exit 0
}
trap cleanup SIGINT SIGTERM

cd "$PROJECT_DIR" || exit 1

notify() {
    local title="$1"
    local msg="$2"
    if command -v notify-send >/dev/null 2>&1; then
        notify-send -u normal -t 8000 "🤖 $title" "$msg" 2>/dev/null || true
    fi
}

echo -e "${BOLD}${CYAN}====================================================================${NC}"
echo -e "${BOLD}${GREEN}🤖 ARGON REPO WATCHER: Memantau commit dari Antigravity Nizar${NC}"
echo -e "${CYAN}Repo   : ${NC}$(git remote get-url origin)"
echo -e "${CYAN}Branch : ${NC}$BRANCH"
echo -e "${CYAN}Polling: ${NC}Setiap $POLL_INTERVAL detik"
echo -e "${CYAN}Log    : ${NC}$LOG_FILE"
echo -e "${BOLD}${CYAN}====================================================================${NC}\n"

notify "Argon Repo Watcher Aktif" "Memantau perubahan dari Antigravity Nizar setiap ${POLL_INTERVAL}s."

while true; do
    # Fetch silent
    git fetch "$REMOTE" "$BRANCH" --quiet 2>/dev/null

    LOCAL_HASH=$(git rev-parse HEAD 2>/dev/null)
    REMOTE_HASH=$(git rev-parse "$REMOTE/$BRANCH" 2>/dev/null)

    if [ -n "$LOCAL_HASH" ] && [ -n "$REMOTE_HASH" ] && [ "$LOCAL_HASH" != "$REMOTE_HASH" ]; then
        BASE_HASH=$(git merge-base HEAD "$REMOTE/$BRANCH" 2>/dev/null)

        if [ "$LOCAL_HASH" = "$BASE_HASH" ]; then
            TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")
            COMMIT_COUNT=$(git rev-list --count "$LOCAL_HASH..$REMOTE_HASH")
            
            echo -e "\n${BOLD}${YELLOW}[$TIMESTAMP] 🚀 Terdeteksi $COMMIT_COUNT commit baru dari Nizar!${NC}"
            echo -e "${CYAN}Daftar Commit:${NC}"
            git log "$LOCAL_HASH..$REMOTE_HASH" --oneline --color=always
            
            # Cek perubahan file penting sebelum pull
            CHANGED_FILES=$(git diff --name-only "$LOCAL_HASH" "$REMOTE_HASH")
            PKG_CHANGED=$(echo "$CHANGED_FILES" | grep -E "^package(-lock)?\.json$" || true)
            SIDE_SESSION_CHANGED=$(echo "$CHANGED_FILES" | grep "^side_session\.md$" || true)

            # Eksekusi Fast-Forward Pull
            echo -e "${BLUE}📥 Melakukan git pull origin $BRANCH...${NC}"
            if git pull --ff-only "$REMOTE" "$BRANCH"; then
                echo -e "${GREEN}✅ Berhasil disinkronkan ke commit: $(git rev-parse --short HEAD)${NC}"

                # Notifikasi Desktop
                LATEST_MSG=$(git log -1 --pretty=format:"%s")
                notify "Nizar Pushed $COMMIT_COUNT Commit" "$LATEST_MSG"

                # Catat ke log file
                {
                    echo -e "\n### 🔄 Sync: $TIMESTAMP"
                    echo "Menerima $COMMIT_COUNT commit baru:"
                    git log "$LOCAL_HASH..$REMOTE_HASH" --pretty=format:"- [%h] %s (%an)"
                    echo -e "\nFiles changed:"
                    git diff --stat "$LOCAL_HASH..$REMOTE_HASH"
                } >> "$LOG_FILE"

                # Otomatis npm install jika package.json berubah
                if [ -n "$PKG_CHANGED" ]; then
                    echo -e "${YELLOW}📦 Terdeteksi perubahan package.json, menjalankan npm install...${NC}"
                    notify "Argon Build" "Menginstal dependensi baru via npm install..."
                    npm install --silent
                    echo -e "${GREEN}✅ Dependensi berhasil diinstal.${NC}"
                fi

                # Verifikasi TypeScript build
                echo -e "${BLUE}🛠️ Memverifikasi integritas build (npm run build)...${NC}"
                if npm run build > /tmp/argon_build_check.log 2>&1; then
                    echo -e "${GREEN}✅ Build 100% SUKSES (0 error). Sistem siap digunakan!${NC}"
                    notify "Argon Build Sukses" "Proyek berhasil dibuild tanpa error (0 error TS/Vite)."
                else
                    echo -e "${RED}⚠️ Build mengalami kendala. Periksa /tmp/argon_build_check.log${NC}"
                    notify "Argon Build Warning" "Ada peringatan/error build setelah sync."
                fi

                if [ -n "$SIDE_SESSION_CHANGED" ]; then
                    echo -e "${CYAN}📄 File catatan serah terima (side_session.md) telah diperbarui oleh Nizar.${NC}"
                fi

                echo -e "${GREEN}✨ Sinkronisasi selesai. Melanjutkan pemantauan...${NC}\n"
            else
                echo -e "${RED}❌ Gagal melakukan fast-forward pull. Mungkin ada perubahan lokal yang belum di-commit.${NC}"
                notify "Argon Sync Error" "Gagal pull karena ada konflik atau perubahan lokal."
            fi
        elif [ "$REMOTE_HASH" = "$BASE_HASH" ]; then
            # Local is ahead of remote, normal state when Argon commits before pushing
            :
        else
            echo -e "${RED}⚠️ Branch diverged (ada commit berbeda di lokal dan remote).${NC}"
        fi
    fi

    sleep "$POLL_INTERVAL"
done
