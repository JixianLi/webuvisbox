
import type { LayoutItem, ResponsiveLayouts } from "react-grid-layout/legacy";

export type AppLayouts = {
  [key: string]: AppLayout[];
};

// How a panel is drawn. regular: a bordered tile in the grid. borderless: in the grid, unframed on the canvas (for
// the main view). overlay: glass, floating above the grid at its x/y/w, as tall as its content up to h rows; it takes
// no grid space. Default: regular.
export type PanelType = 'regular' | 'borderless' | 'overlay';

export type RGLBreakpoints = {
  [key: string]: number;
};

export type RGLCols = {
  [key: string]: number;
};

// Per breakpoint: how many grid rows fill the window height below the navbar (the row height follows from it).
export type FitRows = {
  [key: string]: number;
};

export interface AppLayout extends LayoutItem {
  visible?: boolean;
  type?: PanelType;
  // While collapsed to its title row: the height and minimum height to restore on expand.
  collapsed?: boolean;
  expandedH?: number;
  expandedMinH?: number;
}

export interface PanelLayouts {
  currentLayouts: AppLayouts;
  defaultLayouts: AppLayouts;
  cacheLayouts: AppLayouts;
  breakpoints: RGLBreakpoints;
  cols: RGLCols;
  // As configured; a breakpoint left out fits its default layout (see fitRowsAt).
  fitRows: FitRows;
  currentBreakpoint: string;
  // The current row height in px, set by the layout manager from fitRows and the window height.
  rowHeight: number;

  // Methods
  fitRowsAt(breakpoint: string): number;

  reinitializeLayouts(newLayouts: AppLayouts): void;

  toggleVisibility(panelIndex: number): void;

  closePanel(panelId: string): void;

  restorePanel(panelId: string): void;

  setCurrentLayout(layout: ResponsiveLayouts): void;

  saveDefaultLayouts(): void;

  snapshotCurrentLayouts(): AppLayouts;

  resetToDefault(): void;

  setCurrentBreakpoint(breakpoint: string): void;

  setPanelHeight(panelId: string, rows: number): void;

  toggleCollapsed(panelId: string): void;

  setRowHeight(rowHeight: number): void;

  movePanel(panelId: string, x: number, y: number): void;
}