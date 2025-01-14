<p align="center">
	<img alt="WayVR Dashboard logo" src="./contrib/front.jpg" width="auto"/>
</p>

WayVR Dashboard is a work-in-progress overlay application (WayVR/wlx-overlay-s plugin via IPC) for launching various applications and games directly into a VR desktop environment. It will also offer numerous quality-of-life features to bring Linux VR gaming on par with SteamVR's dashboard. Stay tuned!

### Roadmap

`*` - working on it

| Done |          Variant | Description                                       | Requires |
| ---: | ---------------: | :------------------------------------------------ | -------: |
|   \* |              IPC | wlx-overlay-s (wayvr) <-> WayVR dashboard interop |          |
|   ✔ | Applications tab | .desktop Application fetch support                |          |
|   ✔ | Applications tab | .desktop Icon matcher                             |          |
|   ✔ | Applications tab | Applications viewer                               |          |
|      | Applications tab | Search box, sort by categories                    |          |
|   ✔ | Applications tab | Spawn application inside wlx-overlay-s (WayVR)    |      IPC |
|      | Applications tab | Display manager (select WayVR display)            |      IPC |
|   ✔ |            WayVR | WayVR running applications manager                |      IPC |
|   ✔ |        Games tab | List all installed Steam games                    |          |
|      |        Games tab | Search box, sort by vr/non-vr games               |          |
|   ✔ |        Games tab | Launch desktop games inside WayVR                 |          |
|   ✔ |        Games tab | Fetch cover image of games                        |          |
|   ✔ |        Games tab | Games viewer                                      |          |
|   \* |        Games tab | Launch/stop Steam games                           |          |
|      |            Utils | Re-center button                                  |      IPC |
|      |            Utils | Show device battery levels                        |      IPC |
|      |            Utils | Microphone/speaker volume control                 |          |
|      |            Utils | Launch index_camera_passthrough                   |          |
|      |         Settings | Settings window, session metrics                  |          |
|      |      Home screen | TODO                                              |          |

# DISCLAIMER

### This project is still under heavy development and lacks various features that will be implemented in the future. Install it only if you want to contribute to or help develop this dashboard until it is ready for daily use. Here is our [Matrix and Discord](https://lvra.gitlab.io/docs/community/).

# Build instructions

Firstly, **read disclaimer above**.

### Running wlx-overlay-s fork

#### 1. Compile and run wlx-overlay-s from [this wlx-overlay-s fork](https://github.com/olekolek1000/wlx-overlay-s) with `wayvr_dashboard_ipc` branch:

```bash
git clone --branch wayvr_dashboard_ipc --depth 1 https://github.com/olekolek1000/wlx-overlay-s

cd wlx-overlay-s
```

#### 2. Change config option to force WayVR Server to launch directly after wlx-overlay-s startup:

Modify `./src/res/wayvr.yaml` file (you can copy it to the `~/.config/wlxoverlay/wayvr.yaml` path if you want to):

```yaml
run_compositor_at_start: true
```

#### 3. Start wlx-overlay-s:

```bash
cargo run
```

### Starting WayVR dashboard

Make sure to have npm, C/C++ compiler and rust installed and everything in between if you get any build issues.

#### 1. Clone this repository and start this WayVR dashboard:

```bash
npm install

# Make sure wlx-overlay-s is running!
npm run tauri dev
```

At this stage, you should have a running WayVR dashboard on your screen.

# Run this dashboard in VR and assign it to a watch

Firstly, you need to copy a previously prepared watch configuration. See this [WayVR README](https://github.com/galister/wlx-overlay-s/tree/main/contrib/wayvr).

#### 1. Compile this WayVR dashboard in release mode:

```bash
npm run tauri build
```

This should generate an executable in `./src-tauri/target/release/wayvr_dashboard`.

#### 2. Modify wayvr.yaml file and add a new application to the list:

```yaml
- name: "Dashboard"
  target_display: "Disp1"
  exec: "/home/YOUR_USER/PATH_TO_REPO/wayvr_dashboard/src-tauri/target/release/wayvr_dashboard"
  env: ["GDK_BACKEND=wayland", "LIBGL_ALWAYS_SOFTWARE=1"]
```

⚠️ Modify `exec` path accordingly to your executable path.

Environment variables meaning:

`GDK_BACKEND=wayland`: Force-run GTK in Wayland mode

`LIBGL_ALWAYS_SOFTWARE=1`: Run in software rendering mode (prevents Mesa/Webkit mysterious internal crash on AMD GPUs (nvidia not tested yet)). This will be hopefully fixed in the future.

#### 3. Start wlx-overlay-s and run "Dashboard" from the watch.
