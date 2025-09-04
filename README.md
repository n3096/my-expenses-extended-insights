# My Expenses - Extended Insights

## Deployment

This guide provides cross-platform instructions for deploying the application using `rsync` and SSH keys.

### Prerequisites

Your setup depends on your operating system.

* **Windows**: This guide uses the **Windows Subsystem for Linux (WSL)**.
    1.  Open **PowerShell as an Administrator** and run:
        ```powershell
        wsl --install
        ```
    2.  Restart your PC. This installs WSL and the "Ubuntu" app.
    3.  Open the **Ubuntu** terminal and install the necessary tools:
        ```sh
        sudo apt update && sudo apt install rsync dos2unix
        ```

* **Linux (Debian/Ubuntu)**: `rsync` is usually pre-installed. If not, run:
    ```sh
    sudo apt update && sudo apt install rsync
    ```

* **macOS**: `rsync` is pre-installed. No action is needed.

### One-Time Setup (All Platforms)

You only need to perform these steps once from your respective terminal (WSL for Windows, Terminal for Linux/macOS).

1.  **Generate SSH Keys**:
    If you don't have an SSH key, create one. Press `Enter` at each prompt to accept the defaults.
    ```sh
    ssh-keygen -t rsa -b 4096
    ```

2.  **Copy Your SSH Key to the Server**:
    This command copies your public key to the server, allowing passwordless login. You will be asked for your password **one last time**.
    ```sh
    # Replace the placeholders with your actual server details
    ssh-copy-id -p [YOUR_SFTP_PORT] [YOUR_SFTP_USER]@[YOUR_SFTP_HOST]
    ```

### Configuration (All Platforms)

1.  **Create the `deploy.env` File**:
    In the project's root directory, create a file named `deploy.env` to store your server details.

2.  **Add Your Credentials**:
    Copy the following template into `deploy.env`. This file is in `.gitignore` and should never be committed.

    ```env
    # --- SFTP Server Configuration ---
    LOCAL_SOURCE_PATH="public_www"
    SFTP_USER="your_username"
    SFTP_HOST="your_sftp_host"
    SFTP_PORT="22"
    SFTP_REMOTE_PATH="/path/to/your/remote/directory"
    ```

### Usage

1.  **Create/Verify `deploy.sh`**:
    Ensure the `deploy.sh` script exists in your project root with the following content:
    ```bash
    #!/bin/bash
    set -e
    echo "⚙️  Loading configuration..."
    if [ -f "deploy.env" ]; then
      export $(grep -v '^#' deploy.env | xargs)
    fi
    ERROR_SUFFIX="Please define it in deploy.env or as an environment variable."
    : "${LOCAL_SOURCE_PATH:?LOCAL_SOURCE_PATH is not set. $ERROR_SUFFIX}"
    : "${SFTP_USER:?SFTP_USER is not set. $ERROR_SUFFIX}"
    : "${SFTP_HOST:?SFTP_HOST is not set. $ERROR_SUFFIX}"
    : "${SFTP_PORT:?SFTP_PORT is not set. $ERROR_SUFFIX}"
    : "${SFTP_REMOTE_PATH:?SFTP_REMOTE_PATH is not set. $ERROR_SUFFIX}"
    if [ ! -d "$LOCAL_SOURCE_PATH" ]; then
      echo "❌ Error: Local source directory '$LOCAL_SOURCE_PATH' not found."
      exit 1
    fi
    echo "🚀 Starting deployment to $SFTP_HOST..."
    echo "----------------------------------------"
    echo "Source (Local):    ./$LOCAL_SOURCE_PATH/"
    echo "Target (Remote):   $SFTP_USER@$SFTP_HOST:$SFTP_REMOTE_PATH/"
    echo "----------------------------------------"
    rsync -avz --delete --progress \
      -e "ssh -p $SFTP_PORT" \
      "$LOCAL_SOURCE_PATH/" \
      "$SFTP_USER@$SFTP_HOST:$SFTP_REMOTE_PATH/"
    echo "----------------------------------------"
    echo "✅ Deployment completed successfully!"
    echo "----------------------------------------"
    ```

2.  **Run the Deployment**:
    * **Windows Users (in WSL Terminal)**: You must first fix the script's line endings.
        ```sh
        # Navigate to your project: e.g., cd /mnt/c/Users/YourName/project
        dos2unix deploy.sh deploy.env
        chmod +x deploy.sh
        ./deploy.sh
        ```
    * **Linux & macOS Users (in native Terminal)**:
        ```sh
        # Navigate to your project
        chmod +x deploy.sh
        ./deploy.sh
        ```

## Project Components

The project is now structured around a central dashboard that provides access to various tools.

### Tool Dashboard

* **`public_www/index.html`**: This is the main entry point of the project. It's a simple landing page that dynamically loads and displays all available tools from the configuration file below.
* **`public_www/tools.json`**: This file configures the tool cards that appear on the dashboard. To add a new tool, simply add a new object to this JSON array.

  *Example `tools.json`*:
    ```json
    [
      {
        "name": "Insights",
        "emoji": "📊",
        "path": "insights"
      }
    ]
    ```

### Insights Tool (`/insights`)

This is the primary tool for visualizing and analyzing financial data from a CSV export.

#### CSV Import for Insights

To ensure the Insights tool can correctly parse your data, please use the following settings when exporting from the "My Expenses" application.

**1. Settings (`My Expenses > Settings > Import / Export > Export to CSV`)**
-   [x] Use separate columns for each level of category hierarchy
-   [x] Use separate columns for income and expenses
-   [x] Use separate columns for date and time
-   [ ] Original amount / Equivalent Amount

**2. Export (`My Expenses > Export`)**
-   **Data format**: CSV
-   **Delimiter**: `,` (Comma)
-   **Date format**: `dd.MM.yy`
-   **Time format**: `HH:mm`
-   **Decimal separator**: `.` (Dot)
-   **Character encoding**: UTF-8

### Production Build (Minify)

To optimize the files for production, you can minify the HTML, CSS, and JavaScript.

**1. Installation**
```sh
npm install -g html-minifier-terser