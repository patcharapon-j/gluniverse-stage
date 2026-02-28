export const MODULE_ID = 'gluniverse-stage';

export function registerSettings() {
    // Stage height as percentage of viewport
    game.settings.register(MODULE_ID, 'stageHeight', {
        name: game.i18n.localize('GLSTAGE.settings.stageHeight.name'),
        hint: game.i18n.localize('GLSTAGE.settings.stageHeight.hint'),
        scope: 'world',
        config: true,
        type: Number,
        default: 40,
        range: { min: 20, max: 100, step: 5 },
        onChange: () => {
            const overlay = game.modules.get(MODULE_ID)?.stageOverlay;
            if (overlay) overlay.updateLayout();
        }
    });

    // Stage width as percentage of viewport
    game.settings.register(MODULE_ID, 'stageWidth', {
        name: game.i18n.localize('GLSTAGE.settings.stageWidth.name'),
        hint: game.i18n.localize('GLSTAGE.settings.stageWidth.hint'),
        scope: 'world',
        config: true,
        type: Number,
        default: 100,
        range: { min: 30, max: 100, step: 5 },
        onChange: () => {
            const overlay = game.modules.get(MODULE_ID)?.stageOverlay;
            if (overlay) overlay.updateLayout();
        }
    });

    // Stage-wide X offset (vw) — shifts entire stage horizontally
    game.settings.register(MODULE_ID, 'stageXOffset', {
        scope: 'world',
        config: false,
        type: Number,
        default: 0,
        onChange: () => {
            const overlay = game.modules.get(MODULE_ID)?.stageOverlay;
            if (overlay) overlay.updateLayout();
        }
    });

    // Stage-wide Y offset (pixels) — shifts all characters vertically
    game.settings.register(MODULE_ID, 'stageYOffset', {
        scope: 'world',
        config: false,
        type: Number,
        default: 0,
        onChange: () => {
            const overlay = game.modules.get(MODULE_ID)?.stageOverlay;
            if (overlay) overlay.updateLayout();
        }
    });

    // Hidden setting: actor library (GM configured actors)
    game.settings.register(MODULE_ID, 'actorLibrary', {
        scope: 'world',
        config: false,
        type: Array,
        default: []
    });

    // Hidden setting: current stage state
    game.settings.register(MODULE_ID, 'stageState', {
        scope: 'world',
        config: false,
        type: Object,
        default: {
            visible: false,
            slots: [],
            highlightedSlot: -1
        }
    });
}

export function getSetting(key) {
    return game.settings.get(MODULE_ID, key);
}

export function setSetting(key, value) {
    return game.settings.set(MODULE_ID, key, value);
}
