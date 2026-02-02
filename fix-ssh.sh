#!/bin/bash

echo "🔧 Fixing SSH host key issue for 143.110.129.9"
echo ""

# Remove old host key
ssh-keygen -f "$HOME/.ssh/known_hosts" -R "143.110.129.9"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Old host key removed"
    echo ""
    echo "Now connecting to accept new host key..."
    echo ""
    ssh -o StrictHostKeyChecking=accept-new root@143.110.129.9 "echo '✅ SSH connection successful!'; uname -a"
else
    echo "❌ Failed to remove old key"
    exit 1
fi
