#!/bin/bash
# test_tiktok_direct.sh

CLIENT_KEY="sbaw974rf74cjecvp6"
CLIENT_SECRET="Wmgd67GA2wbD2U7M6hNbJ8RN4MojjBZK"
REFRESH_TOKEN="rft.7b3hv1ww5SpEAF6JqgfAaJCYB4om1pWbgILaJRcxbQSVQTzaGmZOtc5SyzgD!6513.s1"
VIDEO_FILE="video.mp4"

# Tự tạo video nếu chưa có
if [ ! -f "$VIDEO_FILE" ] || [ ! -s "$VIDEO_FILE" ]; then
    echo "🎥 Đang tự tạo video mẫu..."
    ffmpeg -f lavfi -i testsrc=duration=10:size=1280x720:rate=30 -vcodec libx264 -y "$VIDEO_FILE" > /dev/null 2>&1
fi

VIDEO_SIZE=$(stat -c%s "$VIDEO_FILE")
echo "📦 Kích thước video: $((VIDEO_SIZE / 1024)) KB"

echo "⏳ 1. Đang lấy Access Token..."
AUTH_RES=$(curl -s -X POST https://open.tiktokapis.com/v2/oauth/token/ \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_key=$CLIENT_KEY" \
  -d "client_secret=$CLIENT_SECRET" \
  -d "grant_type=refresh_token" \
  -d "refresh_token=$REFRESH_TOKEN")

ACCESS_TOKEN=$(echo $AUTH_RES | grep -oP '(?<="access_token":")[^"]*')

if [ -z "$ACCESS_TOKEN" ]; then
    echo "❌ Lỗi Token: $AUTH_RES"
    exit 1
fi

echo "⏳ 2. Đang khởi tạo TikTok Inbox Init..."
INIT_RES=$(curl -s -X POST https://open.tiktokapis.com/v2/post/publish/inbox/video/init/ \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json; charset=UTF-8" \
  -d "{
    \"post_info\": {
      \"title\": \"Cờ tướng Social - Test Sandbox\",
      \"privacy_level\": \"SELF_ONLY\",
      \"disable_comment\": true,
      \"disable_duet\": true,
      \"disable_stitch\": true
    },
    \"source_info\": {
      \"source\": \"FILE_UPLOAD\",
      \"video_size\": $VIDEO_SIZE,
      \"chunk_size\": $VIDEO_SIZE,
      \"total_chunk_count\": 1
    }
  }")

echo "🔍 Init Response: $INIT_RES"

UPLOAD_URL=$(echo $INIT_RES | grep -oP '(?<="upload_url":")[^"]*' | sed 's/\\//g')

if [ -z "$UPLOAD_URL" ]; then
    echo "❌ Lỗi Init: $INIT_RES"
    exit 1
fi

echo "⏳ 3. Đang tải video (PUT)..."
curl -X PUT "$UPLOAD_URL" \
  -H "Content-Type: video/mp4" \
  -H "Content-Length: $VIDEO_SIZE" \
  --data-binary "@$VIDEO_FILE"

echo -e "\n\n🏁 Hoàn tất! Video đã được đẩy lên Sandbox (SELF_ONLY)."
