#!/bin/bash
# final_tiktok_post.sh - Attempting all possible workarounds

CLIENT_KEY="sbaw974rf74cjecvp6"
CLIENT_SECRET="Wmgd67GA2wbD2U7M6hNbJ8RN4MojjBZK"
REFRESH_TOKEN="rft.7b3hv1ww5SpEAF6JqgfAaJCYB4om1pWbgILaJRcxbQSVQTzaGmZOtc5SyzgD!6513.s1"
VIDEO_FILE="video.mp4"

# Generate video if not exists
if [ ! -f "$VIDEO_FILE" ]; then
    ffmpeg -f lavfi -i testsrc=duration=10:size=1280x720:rate=30 -vcodec libx264 -y "$VIDEO_FILE" > /dev/null 2>&1
fi

VIDEO_SIZE=$(stat -c%s "$VIDEO_FILE")

# 1. Get Access Token
AUTH_RES=$(curl -s -X POST https://open.tiktokapis.com/v2/oauth/token/ \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_key=$CLIENT_KEY" \
  -d "client_secret=$CLIENT_SECRET" \
  -d "grant_type=refresh_token" \
  -d "refresh_token=$REFRESH_TOKEN")

ACCESS_TOKEN=$(echo $AUTH_RES | grep -oP '(?<="access_token":")[^"]*')

if [ -z "$ACCESS_TOKEN" ]; then
    echo "❌ Access Token failed."
    exit 1
fi

levels=("SELF_ONLY" "MUTUAL_FOLLOW_FRIENDS" "FOLLOWER_OF_CREATOR" "PUBLIC_TO_EVERYONE")

for level in "${levels[@]}"; do
    echo "🚀 Trying privacy_level: $level"
    
    INIT_RES=$(curl -s -X POST https://open.tiktokapis.com/v2/post/publish/video/init/ \
      -H "Authorization: Bearer $ACCESS_TOKEN" \
      -H "Content-Type: application/json; charset=UTF-8" \
      -d "{
        \"post_info\": {
          \"title\": \"Test $level\",
          \"privacy_level\": \"$level\"
        },
        \"source_info\": {
          \"source\": \"FILE_UPLOAD\",
          \"video_size\": $VIDEO_SIZE,
          \"chunk_size\": $VIDEO_SIZE,
          \"total_chunk_count\": 1
        }
      }")

    echo "🔍 Response: $INIT_RES"
    
    UPLOAD_URL=$(echo $INIT_RES | grep -oP '(?<="upload_url":")[^"]*' | sed 's/\\//g')
    
    if [ -n "$UPLOAD_URL" ]; then
        echo "✅ SUCCESS with level: $level! Uploading..."
        curl -X PUT "$UPLOAD_URL" \
          -H "Content-Type: video/mp4" \
          -H "Content-Length: $VIDEO_SIZE" \
          --data-binary "@$VIDEO_FILE"
        echo "🏁 DONE!"
        exit 0
    fi
done

# Try Business API as fallback
echo "🚀 Trying Business API fallback..."
BIZ_INIT_RES=$(curl -s -X POST https://open.tiktokapis.com/v2/business/video/publish/init/ \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"video_size\": $VIDEO_SIZE,
    \"chunk_size\": $VIDEO_SIZE,
    \"total_chunk_count\": 1
  }")

echo "🔍 Business Response: $BIZ_INIT_RES"

echo "❌ All attempts failed. The account MUST be set to Private or the app must be Audited."
