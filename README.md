# GLUniverse Stage - Visual Novel Presenter

A visual novel style presentation system for Foundry VTT v13. GMs can present characters on-screen for all players with animations, highlights, and cinematic staging.

## Features

- **Actor Library** - Create and manage character actors with custom images, scale, and positioning offsets

- **Stage Overlay** - Display characters pinned at the bottom of the screen for all players:
  - Configurable height and width (percentage of viewport)
  - X/Y offset controls for stage positioning
  - Real-time sync across all connected clients

- **Slot Management** - Organize characters on stage:
  - Add/remove character slots
  - Assign actors from the library
  - Drag-and-drop reordering
  - Z-index layering control

- **Highlight System** - Indicate the active speaker:
  - Highlighted characters get a glowing drop-shadow
  - Non-highlighted characters dim automatically

- **Animations** - Trigger expressive character animations:
  - Bounce, Shake, Flip, Nod, Jiggle
  - Fade In, Slide In

- **Measurement Tab** - Preview all actors side-by-side to calibrate scale and positioning with visual floor/screen line indicators

## Installation

### Manifest URL
```
https://github.com/patcharapon-j/gluniverse-stage/releases/latest/download/module.json
```

### Manual Installation
1. Download the latest release from the [Releases](https://github.com/patcharapon-j/gluniverse-stage/releases) page
2. Extract the `module.zip` to your `Data/modules/` folder
3. Enable the module in your Foundry VTT world

## Usage

### For GMs
1. Click the Stage Director button in the scene controls
2. **Actors tab** - Add characters with their artwork, adjust scale and offsets
3. **Stage tab** - Add slots, assign actors, show/hide the stage, highlight speakers, trigger animations
4. **Measure tab** - Calibrate actor positioning across all clients
5. **Guide tab** - Built-in tutorial for setup

### For Players
The stage overlay appears automatically when the GM shows it. Characters display at the bottom of the screen with animations and highlights.

## Settings

| Setting | Description |
|---------|-------------|
| Stage Height (%) | Height of the stage area as a percentage of viewport |
| Stage Width (%) | Width of the stage area as a percentage of viewport |

## Compatibility

- **Foundry VTT**: v13+
- **System**: System agnostic (works with any game system)

## License

MIT License - See [LICENSE](LICENSE) for details.

## Credits

Created by GLUniverse
