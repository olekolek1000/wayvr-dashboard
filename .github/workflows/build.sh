#!/bin/bash

set -e

export SCRIPT_DIR=$(realpath $(dirname "$0"))
export REPO_DIR=$(realpath "${SCRIPT_DIR}/../../")
export TEMP_DIR=$(realpath "${REPO_DIR}/temp")
mkdir -p ${TEMP_DIR}

export APP_DIR=$(realpath "${TEMP_DIR}/appdir")
export LINUXDEPLOY="${TEMP_DIR}/linuxdeploy"

echo "SCRIPT_DIR: ${SCRIPT_DIR}"
echo "REPO_DIR: ${REPO_DIR}"
echo "TEMP_DIR: ${TEMP_DIR}"
echo "APP_DIR: ${APP_DIR}"

# Run "configure_env.sh" only once by creating an empty ".installed" file.
# This will always run on a github worker
if ! test -f ${TEMP_DIR}/.installed; then
	source ${SCRIPT_DIR}/configure_env.sh

	# Install frontend deps
	npm install

	# Mark that we have run configure_env.sh already
  touch ${TEMP_DIR}/.installed
fi

${SCRIPT_DIR}/compile.sh

if [ -n "$PACKAGE_APPIMAGE" ]; then
	${SCRIPT_DIR}/appimage.sh

	ARTIFACTS="${REPO_DIR}/artifacts"
	echo "Copying artifacts to ${ARTIFACTS}"

	mkdir -p ${ARTIFACTS}

	cp "${TEMP_DIR}/wayvr-dashboard" "${ARTIFACTS}/"
	cp "${TEMP_DIR}/WayVR_Dashboard-x86_64.AppImage" "${ARTIFACTS}/wayvr-dashboard.AppImage"
fi

echo "Build done"