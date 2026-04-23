### Overview of Arch R

**Arch R** is a custom Linux distribution designed specifically for the **R36S** handheld gaming console and its variants. It leverages an **Arch Linux-based build environment**, built on top of [ROCKNIX](https://github.com/ROCKNIX/distribution), to provide a robust, flexible, and user-friendly experience.

#### Key Features

- **Custom Build System**: Supports Docker for building.
- **Kernel 6.12 LTS**: Auto-detects hardware via SARADC.
- **Mesa Panfrost GPU Driver**: Open-source support with GLES 3.1.
- **EmulationStation Frontend**: Pre-installed with RetroArch and over 18 cores.
- **Audio Support**: Speaker/headphone auto-switching.
- **Battery Monitoring**: Capacity reporting and LED warnings.
- **Display Panels**: 20 pre-generated MIPI panel overlays for various displays.
- **Network Play**: Integrated local and remote network play.
- **Performance Control**: Fine-grained control over battery life and performance.
- **Bluetooth Support**: Audio and controller support.
- **HDMI Output**: USB audio output.
- **Sync Tools**: Syncs with Syncthing and rclone.
- **VPN Support**: WireGuard, Tailscale, and ZeroTier.

#### Supported Hardware

**Boards:**

| Board | Image |
| --- | --- |
| R36S (original), R33S | Original |
| Odroid Go Advance / v1.1 / Super | Original |
| Anbernic RG351V / RG351M | Original |
| GameForce Chi, MagicX XU10 | Original |
| K36 / R36S clones / EE Clone | Clone |
| Powkiddy RGB10 / RGB10X / RGB20S | Clone |
| MagicX XU-Mini-M, BatLexp G350 | Clone |

**Display Panels:**

Arch R ships with 20 pre-generated MIPI panel overlays to cover all known R36S display variants. The correct `.dtbo` file is selected by copying it to `overlays/mipi-panel.dtbo`.

#### Quick Start

1. **Download the Latest Images**: 
   - Original image for genuine R36S and compatible boards.
   - Clone image for K36 clones and compatible boards.

2. **Flash to MicroSD Card**:
   ```bash
   xz -d ArchR-R36S-*.img.xz
   sudo dd if=ArchR-R36S-*.img of=/dev/sdX bs=4M status=progress
   sync
   ```

3. **Insert SD Card and Power On**: The correct board DTB is selected automatically.

#### Building from Source

1. **Requirements**:
   - Docker (recommended) or native Linux build environment.
   - ~40 GB free disk space.
   - ~8 GB RAM recommended.

2. **Build Commands**:
   ```bash
   git clone https://github.com/archr-linux/Arch-R.git
   cd Arch-R

   # Build Docker image (first time only)
   make docker-image-build

   # Build for R36S (all variants)
   make docker-RK3326
   ```

Output images are generated in `target/`.

#### Architecture

- **Board DTB**: Hardware profile (GPIOs, PMIC, joypad, audio codec).
- **Panel Overlay**: Display init sequence and timings.

This separation allows the same image to work across all boards of a variant. Only the panel overlay needs to match the specific display.

#### Boot Flow

```
Power On
  U-Boot (BSP or mainline)
    boot.scr: read SARADC hwrev, select board DTB
    sysboot: load kernel + DTBs + overlays from extlinux.conf
  Kernel 6.12 + initramfs
    mount root (ext4) + storage
    switch_root to systemd
  systemd
    archr-autostart (quirks, governors, audio)
    EmulationStation
```

#### Partition Layout

| Partition | Filesystem | Label | Purpose |
| --- | --- | --- | --- |
| 1 | FAT32 | ARCHR | Boot (kernel, DTBs, overlays, boot.scr) |
| 2 | ext4 | ARCHR_ROOT | Root filesystem |
| 3 | ext4 | STORAGE | User data, ROMs, configs |

#### Community

Contributions are welcome. Open issues or pull requests on [GitHub](https://github.com/archr-linux/Arch-R).

#### Licenses

- **Arch R** is a fork of [ROCKNIX](https://github.com/ROCKNIX/distribution), which is a fork of [JELOS](https://github.com/JustEnoughLinuxOS/distribution).
- All upstream licenses apply.
- You are free to share and adapt the material under certain conditions.

#### Credits

Special thanks to:

- **[ROCKNIX](https://github.com/ROCKNIX/distribution)**
- **[JELOS](https://github.com/JustEnoughLinuxOS/distribution/)**
- **[CoreELEC](https://coreelec.org/)**
- **[LibreELEC](https://libreelec.tv/)**
- **[Hardkernel](https://www.hardkernel.com/)**
- **[Rockchip](https://www.rock-chips.com/)**
- **[Mesa](https://mesa3d.org/)**
- **[RetroArch](https://www.retroarch.com/)**
- **[EmulationStation](https://emulationstation.org/)**

This project is a collaborative effort, and all contributors are acknowledged.
