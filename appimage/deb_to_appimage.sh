#!/bin/sh

set -e

SCRIPT_DIR=$(dirname "$(readlink -f "$0")")
REPO_DIR="${SCRIPT_DIR}/../"

APPIMAGETOOL="https://github.com/AppImage/appimagetool/releases/download/continuous/appimagetool-x86_64.AppImage"
LIB4BIN="https://raw.githubusercontent.com/VHSgunzo/sharun/refs/heads/main/lib4bin"
SHARUNBIN="https://github.com/VHSgunzo/sharun/releases/download/v0.2.5/sharun-x86_64"

cd "${SCRIPT_DIR}"

rm -rf AppDir

mkdir -p AppDir
cd AppDir

cp "${REPO_DIR}/src-tauri/target/release/bundle/deb/wayvr_dashboard_0.1.0_amd64.deb" ./package.deb
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
./lib4bin -p -v -r -s -k ./usr/bin/wayvr_dashboard \
        /usr/lib/x86_64-linux-gnu/libGL* \
        /usr/lib/x86_64-linux-gnu/libEGL* \
        /usr/lib/x86_64-linux-gnu/libvulkan* \
        /usr/lib/x86_64-linux-gnu/dri/* \
        /usr/lib/x86_64-linux-gnu/libpulsecommon* \
        /usr/lib/x86_64-linux-gnu/libnss_mdns* \
        /usr/lib/x86_64-linux-gnu/libssl.so.3 \
        /usr/lib/x86_64-linux-gnu/libcrypto.so.3 \
        /usr/lib/x86_64-linux-gnu/gio/modules/*
        
rm -rf ./usr

#gstreamer is not used by us
#/usr/lib/x86_64-linux-gnu/gstreamer-1.0/* \

mkdir -p ./shared/bin
mkdir -p ./shared/lib

cp -vr /usr/lib/x86_64-linux-gnu/webkit2gtk-4.1/* ./shared/bin

mkdir -p ./shared/lib/webkit2gtk-4.1/injected-bundle
( cd ./shared/lib/webkit2gtk-4.1
        ln -s ../../../sharun ./WebKitWebProcess
        ln -s ../../../sharun ./WebKitNetworkProcess
        ln -s ../../../sharun ./MiniBrowser
        cd ./injected-bundle
        cp -v ../../../../shared/bin/injected-bundle/* ./
)
ln -s ./ ./shared/lib/x86_64-linux-gnu

find ./shared/lib -name 'libwebkit*' -exec sed -i 's|/usr|././|g' {} \;
echo 'SHARUN_WORKING_DIR=${SHARUN_DIR}' > ./.env

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
        --mksquashfs-opt -Xcompression-level --mksquashfs-opt 12 \
        -n "$PWD"/AppDir "$PWD"/wayvr_dashboard.AppImage
