#!/bin/bash

# utils/lock_file.sh
# Khóa file để ngăn xung đột giữa các agent

FILE_PATH=$1
AGENT_ID=$2
LOCK_FILE="/tmp/${FILE_PATH##*/}.lock"

# Kiểm tra khóa
if [ -f "$LOCK_FILE" ]; then
    echo "❌ File $FILE_PATH đang bị khóa bởi agent $(cat $LOCK_FILE). Vui lòng chờ."
    exit 1
fi

# Tạo khóa
echo "$AGENT_ID" > "$LOCK_FILE"
echo "✅ Agent $AGENT_ID đã khóa file $FILE_PATH"

# Xóa khóa khi hoàn thành (sử dụng trap để đảm bảo xóa khóa khi script kết thúc)
trap "rm -f $LOCK_FILE" EXIT

# Giữ khóa trong 5 phút (300 giây)
sleep 300