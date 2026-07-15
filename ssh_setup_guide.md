# VPS SSH Key Authorization and GitHub Actions Integration Guide

This guide walks you through authorizing a newly generated public SSH key on your Ubuntu VPS and securely registering the private key in GitHub Secrets for automated deployments.

---

## Step 1: Set Up Directory Permissions on the VPS
Run these commands on your Ubuntu VPS (log in via password or your existing credentials first) to ensure the SSH directory is secured with the correct permissions.

```bash
# 1. Create the .ssh directory in the user's home folder if it doesn't exist
mkdir -p ~/.ssh

# 2. Restrict access to the directory (Owner Read/Write/Execute only)
chmod 700 ~/.ssh
```

---

## Step 2: Authorize Your Public Key
You must append the public key (the content of `id_ed25519.pub`) to the server's authorized keys list.

1. Open the authorized keys file on the VPS:
   ```bash
   nano ~/.ssh/authorized_keys
   ```
2. Paste the **entire content** of your public key (copy it from your local `id_ed25519.pub` file). It should look like:
   `ssh-ed25519 AAAAC3NzaC1lZDI1NTE5... user@domain`
3. Save the file (Ctrl + O, Enter) and exit (Ctrl + X).
4. Restrict permissions on the authorized_keys file:
   ```bash
   chmod 600 ~/.ssh/authorized_keys
   ```

---

## Step 3: Securely Copy Your Private Key to GitHub Secrets
GitHub Actions needs the private key to authenticate. Copy it carefully to avoid whitespace and formatting issues.

1. On the machine where you generated the keys, display the private key:
   ```bash
   cat ~/.ssh/id_ed25519
   ```
2. Copy the **entire block of output**, including the headers and footers:
   ```text
   -----BEGIN OPENSSH PRIVATE KEY-----
   MIIEpAIBAAKCAQEAzp/4Zf89...
   ... [multiple lines of base64 data] ...
   -----END OPENSSH PRIVATE KEY-----
   ```
3. Go to your repository on GitHub.
4. Navigate to **Settings ➔ Secrets and variables ➔ Actions**.
5. Click **New repository secret** and add:
   * **Name**: `VPS_SSH_KEY`
   * **Value**: Paste the copied key block directly into the value field.

---

## Step 4: Test Key Authentication
Before triggering the automated GitHub pipeline, verify that your key authentication works from your local machine.

Run this command in your local terminal:
```bash
ssh -i ~/.ssh/id_ed25519 -o PreferredAuthentications=publickey VPS_USER@VPS_IP
```

* **Expected Result**: You should log directly into the VPS command prompt without being asked for a password.
