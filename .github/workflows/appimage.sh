#!/bin/bash

set -e

if [[ ! -v LINUXDEPLOY ]]; then
  echo "APP_DIR is not set"
	exit -1
fi

rm -rfv "${APP_DIR}"

BIN_DIR="${APP_DIR}/usr/bin"
LIB_DIR="${APP_DIR}/usr/lib"

mkdir -p ${BIN_DIR}
mkdir -p ${LIB_DIR}

echo "Copying executable to app_dir target"
cp ${TEMP_DIR}/wayvr-dashboard ${BIN_DIR}/

cd ${APP_DIR}

# Fix webkit
echo "Copying webkit runtime executables"

# Copy runtime executables
find -L /usr/lib /usr/libexec -name WebKitNetworkProcess -exec mkdir -p . ';' -exec cp -v --parents '{}' . ';' || true
find -L /usr/lib /usr/libexec -name WebKitWebProcess -exec mkdir -p . ';' -exec cp -v --parents '{}' . ';' || true
find -L /usr/lib /usr/libexec -name libwebkit2gtkinjectedbundle.so -exec mkdir -p . ';' -exec cp --parents '{}' . ';' || true

echo "Patching webkit lib"

# Patch libwebkit .so file: Replace 4 bytes containing "/usr" into "././". TODO, pretty fragile!
WEBKIT_SO="${TEMP_DIR}/libwebkit2gtk-4.1.so.0"
cp /usr/lib/x86_64-linux-gnu/libwebkit2gtk-4.1.so.0 ${WEBKIT_SO}
sed -i -e "s|/usr|././|g" "${WEBKIT_SO}"
cp ${WEBKIT_SO} ${LIB_DIR}/

echo "Running linuxdeploy"

# Run linuxdeploy
cd ${TEMP_DIR}

${LINUXDEPLOY} \
	"-d${REPO_DIR}/wayvr-dashboard.desktop" \
	"-i${REPO_DIR}/wayvr-dashboard.svg" \
	"--library=${WEBKIT_SO}" \
	"--appdir=${APP_DIR}" \
	"--custom-apprun=${SCRIPT_DIR}/res/AppRun" \
	--output appimage \

