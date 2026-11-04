
export type AppLayouts = {
  [key: string]: AppLayout[];
};

// Where tool panels go. grid: with the content, in the grid. docked: in an inspector beside the content.
// overlay: in an inspector floating over the content.
export type ToolPlacement = 'grid' | 'docked' | 'overlay';

// The corner the inspector sits in (overlay); docked uses only its side (left or right).
export type InspectorAnchor = 'top_left' | 'top_right' | 'bottom_left' | 'bottom_right';

// content: what the user looks at (renders, maps, charts). tool: what they adjust (settings, editors). Default: tool.
export type PanelRole = 'content' | 'tool';

export type RGLBreakpoints = {
  [key: string]: number;
};

export type RGLCols = {
  [key: string]: number;
};

export interface AppLayout {
  visible?: boolean; // Optional property to track visibility
  role?: PanelRole;
  x: number;
  y: number;
  w: number;
  h: number;
  i: string;
  minH?: number;
  minW?: number;
  maxH?: number;
  maxW?: number;
  [key: string]: any;
}

export interface PanelLayouts {
  currentLayouts: AppLayouts;
  defaultLayouts: AppLayouts;
  cacheLayouts: AppLayouts;
  breakpoints: RGLBreakpoints;
  cols: RGLCols;
  currentBreakpoint: string;
  toolPlacement: ToolPlacement;
  inspectorAnchor: InspectorAnchor;
  // Docked or overlay: the content panels' shares of the width, left to right (equal when unset or stale).
  contentSplit: number[];

  // Methods
  reinitializeLayouts(newLayouts: AppLayouts): void;

  toggleVisibility(panelIndex: number): void;

  closePanel(panelId: string): void;

  restorePanel(panelId: string): void;

  setCurrentLayout(layout: AppLayouts): void;

  saveDefaultLayouts(): void;

  resetToDefault(): void;

  setCurrentBreakpoint(breakpoint: string): void;

  setPanelHeight(panelId: string, rows: number): void;

  toggleCollapsed(panelId: string): void;

  setInspectorAnchor(anchor: InspectorAnchor): void;

  setContentSplit(split: number[]): void;
}