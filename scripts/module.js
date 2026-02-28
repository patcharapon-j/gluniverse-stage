import { MODULE_ID, registerSettings } from './settings.js';
import { initializeSocket, requestStateSync } from './socket-handler.js';
import { StageManager } from './StageManager.js';
import { StageOverlay } from './StageOverlay.js';
import { GMPanel } from './GMPanel.js';

Hooks.once('init', () => {
    console.log(`${MODULE_ID} | Initializing GLUniverse Stage`);
    registerSettings();
});

Hooks.on('ready', () => {
    console.log(`${MODULE_ID} | Ready`);

    const mod = game.modules.get(MODULE_ID);

    // Create the stage overlay (all clients)
    const overlay = new StageOverlay();
    overlay.render();
    mod.stageOverlay = overlay;

    // Create the stage manager (singleton)
    const mgr = StageManager.getInstance();
    mod.stageManager = mgr;

    // Initialize socket communication
    initializeSocket(
        // onStageUpdate
        (state) => overlay.applyState(state),
        // onAnimation
        (slotIndex, animation) => overlay.playAnimation(slotIndex, animation)
    );

    // If GM, load saved state into overlay immediately
    if (game.user.isGM) {
        const fullState = mgr.getFullState();
        overlay.applyState(fullState);
    } else {
        // Players request sync from GM
        requestStateSync();
    }

    // Expose API
    globalThis.GLUniverseStage = {
        openPanel: () => {
            if (!game.user.isGM) {
                ui.notifications.warn('Only the GM can open the Stage Director panel.');
                return;
            }
            new GMPanel().render({ force: true });
        },
        getManager: () => StageManager.getInstance(),
        getOverlay: () => overlay
    };
});

// Add scene control button for GM
Hooks.on('getSceneControlButtons', (controls) => {
    if (!game.user.isGM) return;

    const tokenControls = controls.tokens;
    if (tokenControls) {
        tokenControls.tools.gluniverseStage = {
            name: 'gluniverseStage',
            title: 'GLUniverse Stage Director',
            icon: 'fa-solid fa-theater-masks',
            order: Object.keys(tokenControls.tools).length,
            button: true,
            visible: true,
            onChange: () => {
                const existing = foundry.applications.instances.get('gluniverse-stage-panel');
                if (existing) existing.close();
                else new GMPanel().render({ force: true });
            }
        };
    }
});
