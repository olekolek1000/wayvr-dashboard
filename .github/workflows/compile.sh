#!/bin/bash

set -e 

# Compile WayVR Dashboard and generate an executable file
cd ${REPO_DIR}

npm run tauri build

# Copy our freshly-baked executable
echo "Copying exec"
cp "${REPO_DIR}/src-tauri/target/release/wayvr-dashboard" "${TEMP_DIR}/wayvr-dashboard"
