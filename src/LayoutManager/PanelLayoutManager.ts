// @ts-ignore unused import toJS TODO remove
import { makeAutoObservable, runInAction, toJS } from 'mobx';
import type { AppLayouts, PanelLayouts, RGLBreakpoints, RGLCols } from '@/Types/PanelLayouts';
import _ from 'lodash';


export class PanelLayoutManager implements PanelLayouts {
    currentLayouts: AppLayouts;
    defaultLayouts: AppLayouts;
    cacheLayouts: AppLayouts;
    breakpoints: RGLBreakpoints;
    cols: RGLCols;
    currentBreakpoint: string = 'xl';

    constructor(
        defaultLayouts: AppLayouts,
        breakpoints: RGLBreakpoints,
        cols?: RGLCols
    ) {
        this.defaultLayouts = _.cloneDeep(defaultLayouts);
        this.currentLayouts = _.cloneDeep(defaultLayouts);
        this.cacheLayouts = _.cloneDeep(defaultLayouts);
        this.breakpoints = _.cloneDeep(breakpoints);
        this.cols = cols ? _.cloneDeep(cols) : Object.keys(this.breakpoints).reduce((acc, key) => {
            acc[key] = 12;
            return acc;
        }, {} as RGLCols);

        // Initialize panels with visible: false
        // Move their full layout to cache and set them to zero-size in currentLayouts
        Object.keys(this.currentLayouts).forEach(breakpoint => {
            this.currentLayouts[breakpoint].forEach((panel, index) => {
                if (panel.visible === false) {
                    // Store the full layout in cache
                    this.cacheLayouts[breakpoint][index] = _.cloneDeep(panel);
                    // Set to zero-size in currentLayouts
                    this.currentLayouts[breakpoint][index] = {
                        i: panel.i,
                        x: 0,
                        y: 0,
                        w: 0,
                        h: 0,
                        minH: 0,
                        minW: 0,
                        maxH: 0,
                        maxW: 0,
                        visible: false,
                        isResizable: false,
                        isDraggable: false,
                        static: true
                    };
                }
            });
        });
        console.log('Initialized PanelLayoutManager:', toJS(this.currentLayouts), toJS(this.cacheLayouts));
        makeAutoObservable(this);
    }

    reinitializeLayouts(newLayouts: AppLayouts) {
        runInAction(() => {
            this.defaultLayouts = _.cloneDeep(newLayouts);
            this.currentLayouts = _.cloneDeep(newLayouts);
            this.cacheLayouts = _.cloneDeep(newLayouts);
        });
    }

    restorePanel(panelId: string): void {
        runInAction(() => {
            this.currentLayouts = _.cloneDeep(this.currentLayouts);
            const breakpoint = this.currentBreakpoint;
            const selectedPanelIndex = _.findIndex(this.currentLayouts[breakpoint], { i: panelId });
            const selectedCached = _.findIndex(this.cacheLayouts[breakpoint], { i: panelId });
            this.currentLayouts[breakpoint][selectedPanelIndex] = _.cloneDeep(this.cacheLayouts[breakpoint][selectedCached]);
            this.currentLayouts[breakpoint][selectedPanelIndex].visible = true;
            delete this.cacheLayouts[panelId];
        });
    }

    closePanel(panelId: string): void {
        runInAction(() => {
            this.currentLayouts = _.cloneDeep(this.currentLayouts);
            const breakpoint = this.currentBreakpoint;
            const selectedPanelIndex = _.findIndex(this.currentLayouts[breakpoint], { i: panelId });
            const selectedPanel = this.currentLayouts[breakpoint][selectedPanelIndex];
            const selectedCached = _.findIndex(this.cacheLayouts[breakpoint], { i: panelId });
            this.cacheLayouts[breakpoint][selectedCached] = _.cloneDeep(selectedPanel);
            this.currentLayouts[breakpoint][selectedPanelIndex] = { i: panelId, x: 0, y: 0, w: 0, h: 0, minH: 0, minW: 0, maxH: 0, maxW: 0, visible: false, isResizable: false, isDraggable: false, static: true };
        });
    }

    toggleVisibility(panelIndex: number): void {
        const visible = this.currentLayouts[this.currentBreakpoint][panelIndex]?.visible;
        const panelId = this.currentLayouts[this.currentBreakpoint][panelIndex]?.i;
        if (visible) {
            this.closePanel(panelId);
        } else {
            this.restorePanel(panelId);
        }
    }

    setCurrentLayout(layout: AppLayouts) {
        const breakpoint = this.currentBreakpoint;
        const newLayouts = layout[breakpoint];
        const currentLayout = this.currentLayouts[breakpoint];

        newLayouts.forEach((newPanel, index) => {
            _.merge(currentLayout[index], newPanel);
        });
    }

    saveDefaultLayouts() {
        runInAction(() => {
            this.defaultLayouts = _.cloneDeep(this.currentLayouts);

            // Iterate through all breakpoints
            Object.keys(this.defaultLayouts).forEach(breakpoint => {
                this.defaultLayouts[breakpoint].forEach((panel, index) => {
                    // If panel is not visible, use cached layout but keep visible as false
                    if (!panel.visible) {
                        const cachedPanelIndex = _.findIndex(this.cacheLayouts[breakpoint], { i: panel.i });
                        if (cachedPanelIndex !== -1) {
                            this.defaultLayouts[breakpoint][index] = _.cloneDeep(this.cacheLayouts[breakpoint][cachedPanelIndex]);
                            this.defaultLayouts[breakpoint][index].visible = false;
                        }
                    }
                });
            });
        });
    }

    resetToDefault() {
        runInAction(() => {
            this.currentLayouts = _.cloneDeep(this.defaultLayouts);
        });
    }

    setCurrentBreakpoint(breakpoint: string) {
        runInAction(() => {
            this.currentBreakpoint = breakpoint;
        });
    }
}

export default PanelLayoutManager;
