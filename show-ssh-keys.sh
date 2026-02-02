#!/bin/bash

echo "🔑 Finding SSH Keys for Digital Ocean"
echo ""

# Common SSH key locations
SSH_DIR="$HOME/.ssh"

if [ ! -d "$SSH_DIR" ]; then
    echo "❌ No .ssh directory found at $SSH_DIR"
    echo ""
    echo "Generate a new SSH key with:"
    echo "  ssh-keygen -t ed25519 -C \"your_email@example.com\""
    exit 1
fi

echo "📂 Searching for SSH public keys..."
echo ""

# Find all public keys
PUBLIC_KEYS=$(find "$SSH_DIR" -name "*.pub" 2>/dev/null)

if [ -z "$PUBLIC_KEYS" ]; then
    echo "❌ No SSH public keys found"
    echo ""
    echo "Generate a new SSH key with:"
    echo "  ssh-keygen -t ed25519 -C \"your_email@example.com\""
    exit 1
fi

# Display all found keys
COUNT=1
for KEY_FILE in $PUBLIC_KEYS; do
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "KEY #${COUNT}: $(basename $KEY_FILE)"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    cat "$KEY_FILE"
    echo ""
    echo "File: $KEY_FILE"
    echo ""
    COUNT=$((COUNT + 1))
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 How to add to Digital Ocean:"
echo ""
echo "1. Go to: https://cloud.digitalocean.com/account/security"
echo "2. Click 'Add SSH Key'"
echo "3. Copy one of the keys above (entire line)"
echo "4. Paste into Digital Ocean"
echo "5. Name it (e.g., 'My Local Machine')"
echo "6. Click 'Add SSH Key'"
echo ""
echo "Then add to your droplet:"
echo "1. Go to your droplet in Digital Ocean console"
echo "2. Access -> Console (web-based terminal)"
echo "3. Run: mkdir -p ~/.ssh && nano ~/.ssh/authorized_keys"
echo "4. Paste your public key and save"
echo "5. Run: chmod 600 ~/.ssh/authorized_keys && chmod 700 ~/.ssh"
echo ""
echo "Or use Digital Ocean Console to add it automatically when creating droplet"
echo ""
