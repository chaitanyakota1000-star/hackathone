#!/bin/bash

# =========================================================================
# Cloudflare UFW IP Synchronizer & Server Lockdown Script
# =========================================================================

# Exit immediately if a command exits with a non-zero status
set -e

# Ensure the script is run as root/sudo
if [ "$EUID" -ne 0 ]; then
  echo "[-] Error: Please run this script with sudo or as root."
  exit 1
fi

echo "[+] Starting Cloudflare UFW IP Synchronization..."

# 1. Download live Cloudflare IP lists
echo "[+] Fetching latest IP ranges from Cloudflare..."
CF_IPV4=$(curl -s https://www.cloudflare.com/ips-v4)
CF_IPV6=$(curl -s https://www.cloudflare.com/ips-v6)

if [ -z "$CF_IPV4" ] || [ -z "$CF_IPV6" ]; then
    echo "[-] Error: Failed to download Cloudflare IP lists. Aborting sync."
    exit 1
fi

# 2. Safely remove any existing unrestricted public HTTP/HTTPS rules
echo "[+] Removing unrestricted public HTTP/S access rules (if any)..."
ufw delete allow 80/tcp >/dev/null 2>&1 || true
ufw delete allow 443/tcp >/dev/null 2>&1 || true
ufw delete allow 80 >/dev/null 2>&1 || true
ufw delete allow 443 >/dev/null 2>&1 || true

# 3. Clean up previously added Cloudflare rules in reverse order to keep rule numbers aligned
echo "[+] Cleaning up obsolete Cloudflare UFW rules..."
while ufw status numbered | grep -q "UFW Allow Cloudflare"; do
    RULE_NUM=$(ufw status numbered | grep -m 1 "UFW Allow Cloudflare" | awk -F"[" '{print $2}' | awk -F"]" '{print $1}')
    echo "y" | ufw delete "$RULE_NUM" >/dev/null 2>&1
done

# 4. Add incoming HTTP/S allowed rules for each Cloudflare IPv4 range
echo "[+] Applying new rules for Cloudflare IPv4 blocks..."
for ip in $CF_IPV4; do
    ufw allow proto tcp from "$ip" to any port 80 comment 'UFW Allow Cloudflare' >/dev/null
    ufw allow proto tcp from "$ip" to any port 443 comment 'UFW Allow Cloudflare' >/dev/null
    echo "  -> Allowed IPv4: $ip"
done

# 5. Add incoming HTTP/S allowed rules for each Cloudflare IPv6 range
echo "[+] Applying new rules for Cloudflare IPv6 blocks..."
for ip in $CF_IPV6; do
    ufw allow proto tcp from "$ip" to any port 80 comment 'UFW Allow Cloudflare' >/dev/null
    ufw allow proto tcp from "$ip" to any port 443 comment 'UFW Allow Cloudflare' >/dev/null
    echo "  -> Allowed IPv6: $ip"
done

# 6. Reload UFW to commit changes
echo "[+] Reloading UFW firewall..."
ufw reload

echo "[+] Cloudflare UFW lockdown complete!"
echo "-------------------------------------------------------------------------"
ufw status verbose
