#!/bin/bash

set -e

if [[ ! -v LINUXDEPLOY ]]; then
  echo "LINUXDEPLOY is not set"
	exit -1
fi

echo "Installing packages"

sudo apt update

# sorted alphabetically
sudo apt install \
	binutils \
	build-essential \
	coreutils \
	curl \
	file \
	findutils \
	grep \
	libasound2-dev \
	libayatana-appindicator3-dev \
	librsvg2-dev \
	libssl-dev \
	libwebkit2gtk-4.1-dev \
	libxdo-dev \
	patchelf \
	sed \
	strace \
	wget \
	zsync \

echo "Installing rust"

rustup update stable
rustup default stable

echo "Downloading linuxdeploy"

test -f ${LINUXDEPLOY} || wget  -O ${LINUXDEPLOY} https://github.com/linuxdeploy/linuxdeploy/releases/download/1-alpha-20250213-2/linuxdeploy-x86_64.AppImage

chmod +x ${LINUXDEPLOY}

