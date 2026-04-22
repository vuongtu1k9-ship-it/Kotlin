#!/bin/bash

# Configuration
API_HOST="http://localhost:5000"
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0MjI1MmYiLCJzeXNSb2xlIjoiYWRtaW4iLCJpYXQiOjE3NzY1NjgxMzMsImV4cCI6MTc3NjU3MTczM30.krpOz46iutso7AdXDZ2MHVKubNS7xtmo31hU6nqosqc"

echo "🚀 Testing Social Post via CLI..."

curl -X POST "$API_HOST/api/admin/social/post" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer $TOKEN" \
     -d '{
       "content": "🚀 CLI Test: Checking social integration (TikTok Private Mode) #cotuong #test",
       "platforms": ["tiktok"]
     }'

echo -e "\n\n✅ Request sent. Check server logs for detailed progress."
