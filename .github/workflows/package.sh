#!/bin/bash

# This script should be run from the repo $PWD and (preferably) Ubuntu 22.04. See build.yml.
# like this:
# ./.github/workflows/package.sh

set -e

SCRIPT_DIR=$(dirname "$0")

# Run "configure_env.sh" only once by creating an empty ".installed" file.
# This will always run on a github worker
if ! test -f ${SCRIPT_DIR}/.installed; then
	${SCRIPT_DIR}/configure_env.sh

	# Install frontend deps
	npm install

	# Mark that we have run configure_env.sh already
  touch ${SCRIPT_DIR}/.installed
fi

# Compile WayVR Dashboard and generate an executable file
npm run tauri build

# Copy our freshly-baked executable
cp ./src-tauri/target/release/wayvr-dashboard ./wayvr-dashboard.x86_64