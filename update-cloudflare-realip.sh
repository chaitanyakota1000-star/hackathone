#!/bin/bash

# =========================================================================
# Cloudflare Nginx Real-IP Configuration Generator & Reloader
# =========================================================================

# Exit immediately if a command exits with a non-zero status
set -e

# Ensure the script is run as root/sudo
if [ "$EUID" -ne 0 ]; then
  echo "[-] Error: Please run this script with sudo or as root."
  exit 1
fi

CF_IP_V4_URL="https://www.cloudflare.com/ips-v4"
CF_IP_V6_URL="https://www.cloudflare.com/ips-v6"

# Define destination config path
# (For standard Ubuntu VPS, it is /etc/nginx/conf.d/cloudflare-realip.conf)
OUTPUT_FILE="/etc/nginx/conf.d/cloudflare-realip.conf"
TEMP_FILE=$(mktemp)

echo "[+] Fetching live Cloudflare IP blocks..."
CF_IPS_V4=$(curl -s "$CF_IP_V4_URL")
CF_IPS_V6=$(curl -s "$CF_IP_V6_URL")

if [ -z "$CF_IPS_V4" ] || [ -z "$CF_IPS_V6" ]; then
  echo "[-] Error: Failed to retrieve Cloudflare IP lists. Aborting."
  exit 1
fi

# Generate configuration header
echo "# =========================================================================" > "$TEMP_FILE"
echo "# Auto-generated Cloudflare Real-IP Mapping Configuration" >> "$TEMP_FILE"
echo "# Timestamp: $(date)" >> "$TEMP_FILE"
echo "# =========================================================================" >> "$TEMP_FILE"
echo "" >> "$TEMP_FILE"

# Define the source header to read client IP
echo "real_ip_header CF-Connecting-IP;" >> "$TEMP_FILE"
echo "real_ip_recursive on;" >> "$TEMP_FILE"
echo "" >> "$TEMP_FILE"

# Append set_real_ip_from directives for all IPv4 ranges
echo "# Cloudflare IPv4 Blocks" >> "$TEMP_FILE"
for ip in $CF_IPS_V4; do
  echo "set_real_ip_from $ip;" >> "$TEMP_FILE"
done

echo "" >> "$TEMP_FILE"

# Append set_real_ip_from directives for all IPv6 ranges
echo "# Cloudflare IPv6 Blocks" >> "$TEMP_FILE"
for ip in $CF_IPS_V6; do
  echo "set_real_ip_from $ip;" >> "$TEMP_FILE"
done

# Move temp file to production Nginx config directory
mv "$TEMP_FILE" "$OUTPUT_FILE"
chmod 644 "$OUTPUT_FILE"
echo "[+] Configuration successfully written to: $OUTPUT_FILE"

# Run Nginx configuration test to verify syntax before reloading
echo "[+] Running Nginx configuration syntax test..."
if nginx -t; then
  echo "[+] Nginx configuration is OK. Reloading service..."
  systemctl reload nginx || nginx -s reload
  echo "[+] Nginx successfully reloaded. Real visitor IPs are now active in logs."
else
  echo "[-] Error: Nginx configuration test failed. Restoring previous state."
  exit 1
fi
