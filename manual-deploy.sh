#!/bin/bash

# Tooly Application Deployment Script (Adobe SSH Environment)
# Usage: ./manual-deploy.sh

set -e

echo "🚀 Building Tooly application..."

# Local build
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

echo "📦 Building production version..."
npm run build

echo "📦 Packaging deployment files..."
tar -czf tooly-deploy.tar.gz -C build .

echo ""
echo "✅ Build completed!"
echo ""
echo "📤 Next step: Upload files to server"
echo "scp tooly-deploy.tar.gz hengcui@root@sj1010010246021.corp.adobe.com@sshp.wipc.adobe.com:/tmp/"
echo "scp server-setup.sh hengcui@root@sj1010010246021.corp.adobe.com@sshp.wipc.adobe.com:/tmp/"
echo ""
echo "🖥️  Then execute on server:"
echo "chmod +x /tmp/server-setup.sh"
echo "bash /tmp/server-setup.sh"
echo ""
echo "🎯 Access URL: http://10.10.246.21" 