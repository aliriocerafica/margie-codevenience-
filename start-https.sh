#!/bin/bash
echo "Starting HTTPS development server for mobile testing..."
echo ""
echo "This will start the server with HTTPS enabled."
echo "You can then access it on your phone using:"
echo "  https://[YOUR_IP]:3000/scanqr"
echo ""
echo "Finding your IP address..."
if command -v ip &> /dev/null; then
    IP=$(ip route get 1 | awk '{print $7; exit}')
elif command -v ifconfig &> /dev/null; then
    IP=$(ifconfig | grep -Eo 'inet (addr:)?([0-9]*\.){3}[0-9]*' | grep -Eo '([0-9]*\.){3}[0-9]*' | grep -v '127.0.0.1' | head -n1)
else
    IP="[CHECK_MANUALLY]"
fi
echo "Your IP: $IP"
echo ""
echo "Mobile URL: https://$IP:3000/scanqr"
echo ""
echo "Press enter to start the server..."
read -r
npm run dev:https
