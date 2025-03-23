#!/bin/sh

set -e

SCRIPT_DIR=$(dirname "$(readlink -f "$0")")
REPO_DIR="${SCRIPT_DIR}/../"

APPIMAGETOOL="https://github.com/AppImage/appimagetool/releases/download/continuous/appimagetool-x86_64.AppImage"
LIB4BIN="https://raw.githubusercontent.com/VHSgunzo/sharun/9a6124a82595a835b07ea7fad7301be736e5a39b/lib4bin"
SHARUNBIN="https://github.com/VHSgunzo/sharun/releases/download/v0.3.3/sharun-x86_64"

cd "${SCRIPT_DIR}"

rm -rf AppDir

mkdir -p AppDir
cd AppDir

cp "${REPO_DIR}/src-tauri/target/release/bundle/deb/wayvr_dashboard_0.3.0_amd64.deb" ./package.deb
ar vx ./package.deb

tar -xvf data.tar.gz
rm -f *.tar* package.deb debian-binary

mv ./usr/share ./
cp ./share/applications/*.desktop ./
cp ./share/icons/hicolor/128x128/apps/wayvr_dashboard.png ./
ln -s ./app.png ./.DirIcon

wget -nc --retry-connrefused --tries=5  "${LIB4BIN}" -O /tmp/lib4bin || true
cp /tmp/lib4bin ./lib4bin

chmod +x ./lib4bin
./lib4bin -p -v -s -k ./usr/bin/wayvr_dashboard \
        /usr/lib/x86_64-linux-gnu/libGL* \
        /usr/lib/x86_64-linux-gnu/libEGL* \
        /usr/lib/x86_64-linux-gnu/libvulkan* \
        /usr/lib/x86_64-linux-gnu/dri/* \
        /usr/lib/x86_64-linux-gnu/libpulsecommon* \
        /usr/lib/x86_64-linux-gnu/libnss_mdns* \
        /usr/lib/x86_64-linux-gnu/libssl.so.3 \
        /usr/lib/x86_64-linux-gnu/libcrypto.so.3 \
				/usr/lib/x86_64-linux-gnu/libwebkit2gtk* \
        /usr/lib/x86_64-linux-gnu/gio/modules/*
        
rm -rf ./usr

#gstreamer is not used by us
#/usr/lib/x86_64-linux-gnu/gstreamer-1.0/* \

mkdir -p ./shared/bin
mkdir -p ./shared/lib

wget -nc --retry-connrefused --tries=5 "${SHARUNBIN}" -O /tmp/sharun || true
cp /tmp/sharun ./sharun

chmod +x ./sharun
ln ./sharun ./AppRun
./sharun -g

cd ..
wget -nc --retry-connrefused --tries=5 "${APPIMAGETOOL}" -O /tmp/appimagetool || true
cp /tmp/appimagetool ./appimagetool
chmod +x ./appimagetool
./appimagetool --comp zstd \
        --mksquashfs-opt -Xcompression-level --mksquashfs-opt 14 \
        -n "$PWD"/AppDir "$PWD"/wayvr_dashboard.AppImage
