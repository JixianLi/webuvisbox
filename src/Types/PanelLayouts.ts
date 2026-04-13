
export type AppLayouts = {
  [key: string]: AppLayout[];
};

export type RGLBreakpoints = {
  [key: string]: number;
};

export type RGLCols = {
  [key: string]: number;
};

export interface AppLayout {
  visible?: boolean; // Optional property to track visibility
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

  // Methods
  reinitializeLayouts(newLayouts: AppLayouts): void;

  toggleVisibility(panelIndex: number): void;

  closePanel(panelId: string): void;

  restorePanel(panelId: string): void;

  setCurrentLayout(layout: AppLayouts): void;

  saveDefaultLayouts(): void;

  resetToDefault(): void;

  setCurrentBreakpoint(breakpoint: string): void;
}