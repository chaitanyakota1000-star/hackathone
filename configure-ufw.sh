#!/bin/bash

# =========================================================================
# VPS Server Hardening: UFW Firewall Setup Script
# Targets: Web app production server (HTTP/S proxy & Rate-Limited SSH)
# =========================================================================

# Exit immediately if any command returns a non-zero status
set -e

# Ensure the script is executed with superuser (sudo/root) privileges
if [ "$EUID" -ne 0 ]; then
  echo "[-] Error: Please run this script with sudo or as root."
  exit 1
fi

echo "[+] Initializing firewall hardening configurations..."

# 1. Reset UFW rules to clean factory defaults
echo "[+] Resetting UFW to clear any existing configurations..."
ufw --force reset

# 2. Establish Default Policies (Deny all incoming, permit outgoing)
echo "[+] Configuring default policies: Default DENY Incoming, ALLOW Outgoing..."
ufw default deny incoming
ufw default allow outgoing

# 3. Secure SSH Port (22) with Rate-Limiting (Brute-Force Defense)
# The 'limit' directive blocks IPs that attempt 6 or more connections within 30 seconds
echo "[+] Rate-limiting SSH (Port 22/TCP) to mitigate brute-force attacks..."
ufw limit 22/tcp comment 'Limit SSH login attempts'

# 4. Open Public Web Access Ports (80 & 443)
echo "[+] Allowing HTTP (Port 80/TCP) from anywhere..."
ufw allow 80/tcp comment 'Allow Public HTTP Web Traffic'

echo "[+] Allowing HTTPS (Port 443/TCP) from anywhere..."
ufw allow 443/tcp comment 'Allow Public HTTPS Secure Web Traffic'

# 5. Explicitly Block Internal Backend & Database Ports from Public Internet
# (Even though default incoming policy is deny, explicit denies add an extra layer of visibility)
echo "[+] Explicitly blocking public access to backend application port 3000..."
ufw deny 3000/tcp comment 'Block public backend node access'

echo "[+] Explicitly blocking public access to MySQL database port 3306..."
ufw deny 3306/tcp comment 'Block public MySQL access'

echo "[+] Explicitly blocking public access to PostgreSQL database port 5432..."
ufw deny 5432/tcp comment 'Block public PostgreSQL access'

# 6. Enable UFW
echo "[+] Activating UFW firewall rules..."
ufw --force enable

echo "[+] Firewall configuration applied successfully!"
echo "========================================================================="
echo "                            Active UFW Rules                             "
echo "========================================================================="
ufw status verbose
