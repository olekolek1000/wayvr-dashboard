#!/bin/sh

set -e

ARCH="$(uname -m)"
SCRIPT_DIR=$(dirname "$(readlink -f "$0")")
REPO_DIR="${SCRIPT_DIR}/../"

LIB4BIN="https://raw.githubusercontent.com/VHSgunzo/sharun/9a6124a82595a835b07ea7fad7301be736e5a39b/lib4bin"
URUNTIME="https://github.com/VHSgunzo/uruntime/releases/latest/download/uruntime-appimage-dwarfs-${ARCH}"
UPINFO="gh-releases-zsync|$(echo "$GITHUB_REPOSITORY" | tr '/' '|')|latest|*$ARCH.AppImage.zsync"

cd "${SCRIPT_DIR}"

rm -rf AppDir

mkdir -p AppDir
cd AppDir

cp "${REPO_DIR}/src-tauri/target/release/bundle/deb/wayvr_dashboard_0.3.1_amd64.deb" ./package.deb
ar vx ./package.deb

tar -xvf data.tar.gz
rm -f *.tar* package.deb debian-binary

mv ./usr/share ./
cp ./share/applications/*.desktop ./
cp ./share/icons/hicolor/128x128/apps/wayvr_dashboard.png ./
ln -s wayvr_dashboard.png ./.DirIcon

wget -nc --retry-connrefused --tries=5  "${LIB4BIN}" -O /tmp/lib4bin || true
cp /tmp/lib4bin ./lib4bin

chmod +x ./lib4bin
./lib4bin -p -v -s -k ./usr/bin/wayvr_dashboard \
	/usr/lib/"${ARCH}"-linux-gnu/libGL* \
	/usr/lib/"${ARCH}"-linux-gnu/libEGL* \
	/usr/lib/"${ARCH}"-linux-gnu/libvulkan* \
	/usr/lib/"${ARCH}"-linux-gnu/dri/* \
	/usr/lib/"${ARCH}"-linux-gnu/libpulsecommon* \
	/usr/lib/"${ARCH}"-linux-gnu/libnss_mdns* \
	/usr/lib/"${ARCH}"-linux-gnu/libssl.so.3 \
	/usr/lib/"${ARCH}"-linux-gnu/libcrypto.so.3 \
	/usr/lib/"${ARCH}"-linux-gnu/libwebkit2gtk* \
	/usr/lib/"${ARCH}"-linux-gnu/gio/modules/*
        
rm -rf ./usr

# get latest glibc
mkdir -p ./tmp
wget "https://archlinux.org/packages/core/"${ARCH}"/glibc/download/" -O ./tmp/glibc.tar.zst
tar xvf ./tmp/glibc.tar.zst -C ./tmp
mv -v ./tmp/usr/lib/libc*.so* ./shared/lib
mv -v ./tmp/usr/lib/libpthread*.so* ./shared/lib
mv -v ./tmp/usr/lib/ld-linux*.so* ./shared/lib
rm -rf ./tmp

#gstreamer is not used by us
#/usr/lib/x86_64-linux-gnu/gstreamer-1.0/* \

chmod +x ./sharun
ln ./sharun ./AppRun
./sharun -g

cd ..
wget -nc --retry-connrefused --tries=5 "${URUNTIME}" -O /tmp/uruntime || true
cp /tmp/uruntime ./uruntime
chmod +x ./uruntime

# enable this if you want to keep the mount point and change block size to '-S26'
#sed -i 's|URUNTIME_MOUNT=[0-9]|URUNTIME_MOUNT=0|' ./uruntime

echo "Adding update information \"$UPINFO\" to runtime..."
./uruntime --appimage-addupdinfo "$UPINFO"

echo "Generating AppImage..."
./uruntime --appimage-mkdwarfs -f \
	--set-owner 0 --set-group 0 \
	--no-history --no-create-timestamp \
	--compression zstd:level=22 -S23 -B32 \
	--header uruntime \
	-i ./AppDir -o ./wayvr_dashboard.AppImage

echo "Generating zsync file..."
zsyncmake *.AppImage -u *.AppImage
