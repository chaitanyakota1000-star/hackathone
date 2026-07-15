#!/bin/bash

# =========================================================================
# VPS Stealth Server Hardening: UFW Firewall Setup Script
# Targets: Defeat port scanners (Silent DROP, Ping Ignore, Rate-Limited SSH)
# =========================================================================

# Exit immediately if any command returns a non-zero status
set -e

# Ensure the script is executed with superuser (sudo/root) privileges
if [ "$EUID" -ne 0 ]; then
  echo "[-] Error: Please run this script with sudo or as root."
  exit 1
fi

echo "[+] Initializing Stealth Firewall configurations..."

# 1. Reset UFW rules to clean factory defaults
echo "[+] Resetting UFW to clear any existing configurations..."
ufw --force reset

# 2. Set Default Policies: DROP all incoming packets silently (no REJECT responses)
# In UFW, "default deny" translates directly to "DROP" in iptables
echo "[+] Setting default policies (DROP Incoming, ALLOW Outgoing)..."
ufw default deny incoming
ufw default allow outgoing

# 3. Configure sysctl to Ignore ICMP Echo Requests (Ignore Ping)
# This prevents scanners from discovering if the host is online via ping sweeps
echo "[+] Modifying /etc/ufw/sysctl.conf to ignore all ICMP Echo (ping) requests..."
SYSCTL_CONF="/etc/ufw/sysctl.conf"

if grep -q "net/ipv4/icmp_echo_ignore_all" "$SYSCTL_CONF"; then
    # Uncomment and set to 1 if it exists
    sed -i 's/.*net\/ipv4\/icmp_echo_ignore_all.*/net\/ipv4\/icmp_echo_ignore_all=1/' "$SYSCTL_CONF"
else
    # Append if not present
    echo "net/ipv4/icmp_echo_ignore_all=1" >> "$SYSCTL_CONF"
fi

# Ensure IPv6 also ignores ping sweeps if IPv6 is enabled
if grep -q "net/ipv6/icmp/echo_ignore_all" "$SYSCTL_CONF"; then
    sed -i 's/.*net\/ipv6\/icmp\/echo_ignore_all.*/net\/ipv6\/icmp\/echo_ignore_all=1/' "$SYSCTL_CONF"
else
    echo "net/ipv6/icmp/echo_ignore_all=1" >> "$SYSCTL_CONF"
fi

# 4. Open Public Web Access Ports (80 & 443)
echo "[+] Allowing HTTP (Port 80/TCP)..."
ufw allow 80/tcp comment 'Allow Public HTTP'

echo "[+] Allowing HTTPS (Port 443/TCP)..."
ufw allow 443/tcp comment 'Allow Public HTTPS'

# 5. Secure SSH Port (22) with Rate-Limiting (Brute-Force defense)
echo "[+] Rate-limiting SSH (Port 22/TCP)..."
ufw limit 22/tcp comment 'Limit SSH login attempts'

# 6. Enable UFW
echo "[+] Activating UFW firewall rules..."
ufw --force enable

# Apply sysctl settings immediately
sudo sysctl -p

echo "[+] Stealth Firewall applied successfully!"
echo "========================================================================="
echo "                            Active UFW Rules                             "
echo "========================================================================="
ufw status verbose
