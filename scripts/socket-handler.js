import { MODULE_ID } from './settings.js';

const SOCKET_NAME = `module.${MODULE_ID}`;
const ALLOWED_ANIMATIONS = new Set(['bounce', 'shake', 'flip', 'nod', 'jiggle', 'fadeIn', 'slideIn']);

export const SOCKET_EVENTS = {
    UPDATE_STAGE: 'updateStage',
    TRIGGER_ANIMATION: 'triggerAnimation',
    REQUEST_SYNC: 'requestSync',
    SYNC_STATE: 'syncState'
};

let _onStageUpdate = null;
let _onAnimation = null;

export function initializeSocket(onStageUpdate, onAnimation) {
    _onStageUpdate = onStageUpdate;
    _onAnimation = onAnimation;
    game.socket?.on(SOCKET_NAME, handleSocketMessage);
}

export function emitSocket(data) {
    const payload = { ...data, senderId: game.user.id };
    game.socket?.emit(SOCKET_NAME, payload);
    // Handle locally for sender
    handleLocalMessage(data);
}

function handleSocketMessage(data) {
    if (data.senderId === game.user.id) return;

    switch (data.type) {
        case SOCKET_EVENTS.UPDATE_STAGE:
            if (!isSenderGM(data) || !data.state || typeof data.state !== 'object') return;
            if (_onStageUpdate) _onStageUpdate(data.state);
            break;
        case SOCKET_EVENTS.TRIGGER_ANIMATION:
            if (!isSenderGM(data) || !Number.isInteger(data.slotIndex) || !ALLOWED_ANIMATIONS.has(data.animation)) return;
            if (_onAnimation) _onAnimation(data.slotIndex, data.animation);
            break;
        case SOCKET_EVENTS.REQUEST_SYNC:
            handleSyncRequest(data);
            break;
        case SOCKET_EVENTS.SYNC_STATE:
            if (!isSenderGM(data) || !data.state || typeof data.state !== 'object') return;
            if (data.targetId && data.targetId !== game.user.id) return;
            if (_onStageUpdate) _onStageUpdate(data.state);
            break;
    }
}

function isSenderGM(data) {
    return game.users?.get(data.senderId)?.isGM === true;
}

function handleLocalMessage(data) {
    switch (data.type) {
        case SOCKET_EVENTS.UPDATE_STAGE:
            if (_onStageUpdate) _onStageUpdate(data.state);
            break;
        case SOCKET_EVENTS.TRIGGER_ANIMATION:
            if (_onAnimation) _onAnimation(data.slotIndex, data.animation);
            break;
    }
}

function handleSyncRequest(data) {
    if (!game.user.isGM) return;
    const mod = game.modules.get(MODULE_ID);
    const stageManager = mod?.stageManager;
    if (!stageManager) return;

    game.socket?.emit(SOCKET_NAME, {
        type: SOCKET_EVENTS.SYNC_STATE,
        senderId: game.user.id,
        targetId: data.senderId,
        state: stageManager.getFullState()
    });
}

export function requestStateSync() {
    if (!game.user.isGM) {
        emitSocket({ type: SOCKET_EVENTS.REQUEST_SYNC });
    }
}
