import { MODULE_ID, getSetting, setSetting } from './settings.js';
import { emitSocket, SOCKET_EVENTS } from './socket-handler.js';

/**
 * Manages the actor library and stage state.
 * GM-only operations emit socket events to sync all clients.
 */
export class StageManager {
    static instance = null;

    static getInstance() {
        if (!this.instance) this.instance = new StageManager();
        return this.instance;
    }

    constructor() {
        this._callbacks = new Set();
    }

    // --- Actor Library (CRUD) ---

    getActors() {
        return foundry.utils.deepClone(getSetting('actorLibrary') || []);
    }

    async addActor({ name, image, scale = 1.0, offsetX = 0, offsetY = 0 }) {
        const actors = this.getActors();
        const id = foundry.utils.randomID();
        actors.push({ id, name, image, scale, offsetX, offsetY });
        await setSetting('actorLibrary', actors);
        this._notifySubscribers();
        return id;
    }

    async updateActor(id, updates) {
        const actors = this.getActors();
        const idx = actors.findIndex(a => a.id === id);
        if (idx === -1) return;
        Object.assign(actors[idx], updates);
        await setSetting('actorLibrary', actors);

        // If this actor is on stage, update stage too
        const state = this.getStageState();
        let stageChanged = false;
        for (const slot of state.slots) {
            if (slot.actorId === id) {
                slot.actor = actors[idx];
                stageChanged = true;
            }
        }
        if (stageChanged) {
            await this._saveAndBroadcastStage(state);
        }
        this._notifySubscribers();
    }

    async removeActor(id) {
        let actors = this.getActors();
        actors = actors.filter(a => a.id !== id);
        await setSetting('actorLibrary', actors);

        // Remove from stage if present
        const state = this.getStageState();
        for (const slot of state.slots) {
            if (slot.actorId === id) {
                slot.actorId = null;
                slot.actor = null;
            }
        }
        if (state.highlightedSlot >= 0) {
            const hSlot = state.slots[state.highlightedSlot];
            if (!hSlot || !hSlot.actorId) state.highlightedSlot = -1;
        }
        await this._saveAndBroadcastStage(state);
        this._notifySubscribers();
    }

    getActorById(id) {
        const actors = this.getActors();
        return actors.find(a => a.id === id) || null;
    }

    // --- Stage State ---

    getStageState() {
        const state = foundry.utils.deepClone(getSetting('stageState') || {
            visible: false,
            slots: [],
            highlightedSlot: -1
        });
        // Backfill slotId on existing slots missing it (migration)
        for (const slot of state.slots) {
            if (!slot.slotId) slot.slotId = foundry.utils.randomID();
        }
        return state;
    }

    getFullState() {
        const state = this.getStageState();
        state.stageHeight = getSetting('stageHeight');
        state.stageWidth = getSetting('stageWidth');
        state.stageYOffset = getSetting('stageYOffset');
        // Resolve actor data for each slot
        const actors = this.getActors();
        for (const slot of state.slots) {
            if (slot.actorId) {
                slot.actor = actors.find(a => a.id === slot.actorId) || null;
            }
        }
        return state;
    }

    async setStageVisible(visible) {
        const state = this.getStageState();
        state.visible = visible;
        await this._saveAndBroadcastStage(state);
        this._notifySubscribers();
    }

    async addSlot() {
        const state = this.getStageState();
        state.slots.push({ slotId: foundry.utils.randomID(), actorId: null, actor: null, position: 'center' });
        await this._saveAndBroadcastStage(state);
        this._notifySubscribers();
    }

    async removeSlot(index) {
        const state = this.getStageState();
        if (index < 0 || index >= state.slots.length) return;
        state.slots.splice(index, 1);
        if (state.highlightedSlot === index) state.highlightedSlot = -1;
        else if (state.highlightedSlot > index) state.highlightedSlot--;
        await this._saveAndBroadcastStage(state);
        this._notifySubscribers();
    }

    async reorderSlots(fromIndex, toIndex) {
        const state = this.getStageState();
        if (fromIndex < 0 || fromIndex >= state.slots.length) return;
        if (toIndex < 0 || toIndex >= state.slots.length) return;
        if (fromIndex === toIndex) return;

        const [moved] = state.slots.splice(fromIndex, 1);
        state.slots.splice(toIndex, 0, moved);

        // Adjust highlight index to follow the highlighted slot
        if (state.highlightedSlot === fromIndex) {
            state.highlightedSlot = toIndex;
        } else if (state.highlightedSlot >= 0) {
            if (fromIndex < state.highlightedSlot && toIndex >= state.highlightedSlot) {
                state.highlightedSlot--;
            } else if (fromIndex > state.highlightedSlot && toIndex <= state.highlightedSlot) {
                state.highlightedSlot++;
            }
        }

        await this._saveAndBroadcastStage(state);
        this._notifySubscribers();
    }

    async updateSlot(slotIndex, updates) {
        const state = this.getStageState();
        if (slotIndex < 0 || slotIndex >= state.slots.length) return;
        Object.assign(state.slots[slotIndex], updates);
        await this._saveAndBroadcastStage(state);
        this._notifySubscribers();
    }

    async assignActorToSlot(slotIndex, actorId) {
        const state = this.getStageState();
        if (slotIndex < 0 || slotIndex >= state.slots.length) return;
        const actor = actorId ? this.getActorById(actorId) : null;
        state.slots[slotIndex].actorId = actorId;
        state.slots[slotIndex].actor = actor;
        await this._saveAndBroadcastStage(state);
        this._notifySubscribers();
    }

    async setHighlight(slotIndex) {
        const state = this.getStageState();
        state.highlightedSlot = slotIndex;
        await this._saveAndBroadcastStage(state);
        this._notifySubscribers();
    }

    async clearStage() {
        const state = this.getStageState();
        state.slots = [];
        state.highlightedSlot = -1;
        await this._saveAndBroadcastStage(state);
        this._notifySubscribers();
    }

    triggerAnimation(slotIndex, animation) {
        emitSocket({
            type: SOCKET_EVENTS.TRIGGER_ANIMATION,
            slotIndex,
            animation
        });
    }

    // --- Internal ---

    async _saveAndBroadcastStage(state) {
        // Strip resolved actor data before saving (only save actorId)
        const toSave = foundry.utils.deepClone(state);
        for (const slot of toSave.slots) {
            delete slot.actor;
        }
        await setSetting('stageState', toSave);

        // Broadcast full state with resolved actors
        const fullState = this.getFullState();
        emitSocket({
            type: SOCKET_EVENTS.UPDATE_STAGE,
            state: fullState
        });
    }

    subscribe(callback) {
        this._callbacks.add(callback);
    }

    unsubscribe(callback) {
        this._callbacks.delete(callback);
    }

    _notifySubscribers() {
        for (const cb of this._callbacks) {
            try { cb(); } catch (err) {
                console.error(`${MODULE_ID} | Subscriber error:`, err);
            }
        }
    }
}
