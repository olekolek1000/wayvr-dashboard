[![LVRA Discord](https://img.shields.io/discord/1065291958328758352?style=for-the-badge&logo=discord)](https://discord.gg/EHAYe3tTYa) [![LVRA Matrix](https://img.shields.io/matrix/linux-vr-adventures:matrix.org?logo=matrix&style=for-the-badge)](https://matrix.to/#/#linux-vr-adventures:matrix.org)

</p>

<p align="center">
	<img alt="WayVR Dashboard logo" src="./contrib/front.webp" width="auto"/>
</p>

WayVR Dashboard is a work-in-progress overlay application (WayVR/wlx-overlay-s plugin via IPC) for launching various applications and games directly into a VR desktop environment.

# Quick setup

## Method 1: Via [Envision](https://gitlab.com/gabmus/envision):

Open "Plugins" and install the newest WayVR Dashboard release:

![Envision plugins window](contrib/envision_installation.png)

That's it. No further configuration is required.

## Method 2: Via [Releases](https://github.com/olekolek1000/wayvr-dashboard/releases) page:

Unzip the newest WayVR Dashboard, mark it as executable and link it to the `wayvr.yaml` file, [and then configure wlx-overlay-s accordingly.](#assigning-wayvr-dashboard-to-the-wayvr-config-in-wlx-overlay-s)

## Method 3: Manual compilation

Make sure to have NodeJS/npm, C/C++ compiler and rust installed and everything in between if you get any build issues.

[Rust installation instructions](https://www.rust-lang.org/tools/install)

[NodeJS installation instructions](https://nodejs.org/en/download) (only if you have an ancient distro)

#### 1. Clone this repository build WayVR dashboard:

```bash
git clone --depth=1 https://github.com/olekolek1000/wayvr-dashboard.git
cd wayvr-dashboard
npm install
npm run tauri build
```

Built executable will be available at `./src-tauri/target/release/wayvr-dashboard`.

#### 2. Configure _[wlx-overlay-s](https://github.com/galister/wlx-overlay-s)_

```bash
git clone --depth=1 https://github.com/galister/wlx-overlay-s.git
cd wlx-overlay-s
cargo build
```

## Assigning WayVR Dashboard to the WayVR config in wlx-overlay-s

1. Go to `~/.config/wlxoverlay/wayvr.yaml` or copy it from `./src/res/wayvr.yaml` in the _wlx-overlay-s_ repository and edit it:

```yaml
dashboard:
  exec: "/home/YOUR_USER/PATH_TO_REPO/wayvr-dashboard/src-tauri/target/release/wayvr-dashboard"
  args: ""
  env: ["GDK_BACKEND=wayland"]
```

⚠️ Modify `exec` path accordingly to your executable path!

And now you can start wlx-overlay-s via Envision or manually:

```bash
cd wlx-overlay-s
cargo run
```

You are all set! You will see a blue "Dash" button in your watch. You can also assign a controller button to toggle it automatically.

### Have fun!
