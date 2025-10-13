
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
  current_layouts: AppLayouts;
  default_layouts: AppLayouts;
  cache_layouts: AppLayouts;
  breakpoints: RGLBreakpoints;
  cols: RGLCols;
  current_breakpoint: string;

  // Methods
  reinitializeLayouts(new_layouts: AppLayouts): void;
  
  toggle_visibility(panel_index: number): void;

  close_panel(panel_id: string): void;

  restore_panel(panel_id: string): void;

  setCurrentLayout(layout: AppLayouts): void;

  saveDefaultLayouts(): void;

  resetToDefault(): void;

  setCurrentBreakpoint(breakpoint: string): void;
}