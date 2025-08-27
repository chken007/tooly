#!/bin/bash

# Server-side deployment script
# Execute this script on Adobe server

set -e

echo "🖥️  Deploying Tooly application on server..."

# Check if deployment package exists
if [ ! -f "/tmp/tooly-deploy.tar.gz" ]; then
    echo "❌ Error: /tmp/tooly-deploy.tar.gz not found"
    echo "Please upload deployment package to server first"
    exit 1
fi

# Create deployment directory
echo "📁 Creating deployment directory..."
mkdir -p /home/hengcui/tooly-build

# Extract files
echo "📦 Extracting application files..."
cd /home/hengcui/tooly-build
tar -xzf /tmp/tooly-deploy.tar.gz

# Install Nginx
echo "⚙️  Installing Nginx..."
if command -v apt-get > /dev/null; then
    sudo apt-get update
    sudo apt-get install -y nginx
elif command -v yum > /dev/null; then
    sudo yum install -y nginx
elif command -v dnf > /dev/null; then
    sudo dnf install -y nginx
else
    echo "❌ Cannot detect package manager, please install Nginx manually"
    exit 1
fi

# Create Nginx configuration
echo "🔧 Configuring Nginx..."
sudo tee /etc/nginx/sites-available/tooly > /dev/null << 'EOF'
server {
    listen 80;
    server_name sj1010010246021.corp.adobe.com;
    
    root /var/www/html;
    index index.html;
    
    # Handle React Router client-side routing
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Static assets caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
}
EOF

# Copy files to web directory
echo "📂 Copying files to web directory..."
sudo cp -r /home/hengcui/tooly-build/* /var/www/html/
sudo chown -R www-data:www-data /var/www/html/
sudo chmod -R 755 /var/www/html/

# Enable site
echo "🔗 Enabling site..."
if [ -d "/etc/nginx/sites-available" ]; then
    sudo ln -sf /etc/nginx/sites-available/tooly /etc/nginx/sites-enabled/
    sudo rm -f /etc/nginx/sites-enabled/default
fi

# Test configuration
echo "🧪 Testing Nginx configuration..."
sudo nginx -t

# Start service
echo "🚀 Starting Nginx..."
sudo systemctl enable nginx
sudo systemctl restart nginx

# Configure firewall
echo "🔒 Configuring firewall..."
if command -v ufw > /dev/null; then
    sudo ufw --force enable
    sudo ufw allow 'Nginx Full'
elif command -v firewall-cmd > /dev/null; then
    sudo firewall-cmd --permanent --add-service=http
    sudo firewall-cmd --permanent --add-service=https
    sudo firewall-cmd --reload
fi

# Clean up temporary files
echo "🧹 Cleaning up temporary files..."
rm -f /tmp/tooly-deploy.tar.gz

echo ""
echo "🎉 Deployment completed!"
echo ""
echo "✅ Your application is now accessible at:"
echo "   http://sj1010010246021.corp.adobe.com"
echo "   http://10.10.246.21"
echo ""
echo "📝 Note: May require VPN access due to Adobe internal environment"
echo ""
echo "🔍 If you encounter issues, check:"
echo "   - sudo systemctl status nginx"
echo "   - sudo nginx -t"
echo "   - tail -f /var/log/nginx/error.log" 