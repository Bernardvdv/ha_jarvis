# Jarvis Dashboard for Home Assistant

A full-featured, Jarvis-style Lovelace dashboard for Home Assistant. Dark sci-fi aesthetic with dot-grid backgrounds, animated corner brackets, Orbitron/Share Tech Mono fonts, and cyan accents.

![Jarvis Dashboard Preview](docs/screenshots/overview.png)

## Features

- **Room Cards** — per-room temperature display + TRV control (current temp, target, +/−, heat on/off), light toggles with brightness/colour/effects panel
- **Security View** — live camera thumbnails (tap to expand), lock status, contact/motion sensors, perimeter status
- **Jarvis AI View** — clock, weather, energy stats, proxmox server monitoring, system status
- **Battery Overview** — all device batteries with arc gauges grouped by category
- **Music Centre** — speaker selection, volume, media controls, radio station grid
- **Fixed Navbar** — Jarvis-styled bottom navigation bar matching the main card aesthetic

## Requirements

### HACS Cards (install via HACS)
- `clock-weather-card` — for the home view weather widget
- `lovelace-card-mod` — optional, for card styling tweaks
- `kiosk-mode` — optional, for kiosk/tablet display

### Home Assistant Integrations (optional but recommended)
- **FordPass** — for vehicle telemetry (puma-card)
- **Octopus Energy** — for energy stats in jarvis-card
- **Proxmox** — for server monitoring in jarvis-card
- **Electricity Maps** — for fossil fuel % in jarvis-card

## Installation

### 1. Copy card files

Copy the entire `cards/` folder to your HA config:

```
/config/www/jarvis/
  room-card.js
  control-card.js
  jarvis-navbar.js
  jarvis-card.js
  security-camera-card.js
  battery-overview-card.js
  music-centre-card.js
  home-status-bar.js
```

### 2. Register resources

In Home Assistant → Settings → Dashboards → Resources, add each file as a **JavaScript Module**:

| URL | Type |
|-----|------|
| `/local/jarvis/room-card.js` | JavaScript Module |
| `/local/jarvis/control-card.js` | JavaScript Module |
| `/local/jarvis/jarvis-navbar.js` | JavaScript Module |
| `/local/jarvis/jarvis-card.js` | JavaScript Module |
| `/local/jarvis/security-camera-card.js` | JavaScript Module |
| `/local/jarvis/battery-overview-card.js` | JavaScript Module |
| `/local/jarvis/music-centre-card.js` | JavaScript Module |
| `/local/jarvis/home-status-bar.js` | JavaScript Module |

### 3. Create dashboard

1. Go to Settings → Dashboards → Add Dashboard
2. Give it a URL path (e.g. `dashboard-jarvis`)
3. Open the dashboard → Edit → Raw Configuration Editor
4. Paste the contents of `dashboard/dashboard.yaml`
5. Replace all `YOUR_*` placeholder values with your actual entity IDs

### 4. Clear cache & reload

Hard refresh your browser (`Ctrl+Shift+R` or `Cmd+Shift+R`) to load the new resources.

## Card Reference

### `custom:room-card`

```yaml
type: custom:room-card
name: Living Room
icon: mdi:sofa
climate_entity: climate.living_room_trv
temp_sensor: sensor.living_room_trv_local_temperature  # optional
secondary_climate: climate.study_heater                # optional
lights:
  - entity: light.ceiling
    name: Ceiling
    icon: mdi:ceiling-light
  - entity: light.lamp_1
    name: Lamp 1
    icon: mdi:floor-lamp
    pair: true   # groups with other pair:true lights of same icon/name into one button
  - entity: light.lamp_2
    name: Lamp 1
    icon: mdi:floor-lamp
    pair: true
plugs:
  - entity: switch.printer
    name: Printer
    icon: mdi:printer-3d
  - entity: button.robovac_clean
    name: Robovac
    icon: mdi:robot-vacuum
```

**Light capabilities detected automatically:**
- Brightness slider — shown if light supports dimming
- Colour temperature slider — shown if `color_temp` mode supported
- RGB colour swatches — shown if `hs`/`rgb`/`rgbw` mode supported
- Effects grid — shown if light has an `effect_list`

### `custom:control-card`

```yaml
# Thermostat
type: custom:control-card
entity_type: thermostat
name: Heating
icon: mdi:thermostat
entity: climate.nest_trv
temp_sensor: sensor.nest_current_temp  # optional

# Lock
type: custom:control-card
entity_type: lock
name: Front Door
icon: mdi:door
entity: lock.front_door

# Placeholder
type: custom:control-card
entity_type: spare
name: Spare
icon: mdi:plus-circle-outline
```

### `custom:security-camera-card`

```yaml
type: custom:security-camera-card
cameras:
  - name: Garage
    icon: mdi:garage
    entity: camera.garage
locks:
  - entity: lock.front_door
    label: Front Door
  - entity: lock.car_door
    label: Car
sensors:
  - entity: binary_sensor.contact_sensor
    label: Front Contact
    type: contact    # contact | glass | garage | motion
navbar:             # optional, overrides default routes
  - icon: mdi:home
    url: /dashboard-jarvis/0
```

### `custom:battery-overview-card`

```yaml
type: custom:battery-overview-card
columns: 5         # items per row in each group
groups:
  - name: TRVs
    items:
      - name: Living Room
        entity: sensor.living_room_trv_battery
  - name: Security
    items:
      - name: Front Door Lock
        entity: sensor.lock_battery
```

## Tablet Setup

This dashboard is optimised for an 11" tablet in landscape mode (e.g. Lenovo Tab with Fully Kiosk Browser).

Recommended Fully Kiosk settings:
- Enable hardware acceleration
- Set start URL to your dashboard overview page
- Enable "Return to start URL" on screen wake

## Contributing

PRs welcome. Please keep cards self-contained (no external dependencies beyond HA's `ha-icon` element) and maintain the Jarvis aesthetic guidelines:

- Background: `#010d1a`
- Dot grid: `radial-gradient(circle, rgba(0,190,255,.14) 1px, transparent 1px)` at `36px`
- Accent: `rgba(0,190,255,*)` (cyan)
- Fonts: `Orbitron` (headings/numbers), `Share Tech Mono` (data/labels)
- Corner brackets: `14×14px`, `2px solid`, animated opacity

## License

MIT — see LICENSE file.
