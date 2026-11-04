// ABOUTME: Where the layout manager placed a panel: a grid tile, one of several content panels beside the inspector,
// ABOUTME: the stage (the only content panel), or the inspector. Panels read it to pick their frame (bordered, bare, glass).

import { createContext, useContext } from 'react';

export type PanelPlacement = 'tile' | 'content' | 'stage' | 'floating';

export const PanelPlacementContext = createContext<PanelPlacement>('tile');

export function usePanelPlacement(): PanelPlacement {
    return useContext(PanelPlacementContext);
}
