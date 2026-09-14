import { useSyncExternalStore } from 'react';
import { liveEngine, LiveState } from '../data/liveEngine';

/** Accès à l'état temps réel partagé (mis à jour toutes les 3 s). */
export function useLive(): LiveState {
  return useSyncExternalStore(liveEngine.subscribe, liveEngine.getSnapshot, liveEngine.getSnapshot);
}

export { liveEngine };
