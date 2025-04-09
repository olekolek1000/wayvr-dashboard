#!/bin/bash

set -e

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
