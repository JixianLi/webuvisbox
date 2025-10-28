// @ts-ignore unused import toJS TODO remove
import { makeAutoObservable, runInAction, toJS } from 'mobx';
import type { AppLayouts, PanelLayouts, RGLBreakpoints, RGLCols } from '@/Types/PanelLayouts';
import _ from 'lodash';


export class PanelLayoutManager implements PanelLayouts {
    current_layouts: AppLayouts;
    default_layouts: AppLayouts;
    cache_layouts: AppLayouts;
    breakpoints: RGLBreakpoints;
    cols: RGLCols;
    current_breakpoint: string = 'xl';

    constructor(
        default_layouts: AppLayouts,
        breakpoints: RGLBreakpoints,
        cols: RGLCols
    ) {
        this.default_layouts = _.cloneDeep(default_layouts);
        this.current_layouts = _.cloneDeep(default_layouts);
        this.cache_layouts = _.cloneDeep(default_layouts);
        this.breakpoints = _.cloneDeep(breakpoints);
        this.cols = _.cloneDeep(cols);
        
        // Initialize panels with visible: false
        // Move their full layout to cache and set them to zero-size in current_layouts
        Object.keys(this.current_layouts).forEach(breakpoint => {
            this.current_layouts[breakpoint].forEach((panel, index) => {
                if (panel.visible === false) {
                    // Store the full layout in cache
                    this.cache_layouts[breakpoint][index] = _.cloneDeep(panel);
                    // Set to zero-size in current_layouts
                    this.current_layouts[breakpoint][index] = { 
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
        console.log('Initialized PanelLayoutManager:', toJS(this.current_layouts), toJS(this.cache_layouts));
        makeAutoObservable(this);
    }

    reinitializeLayouts(new_layouts: AppLayouts) {
        runInAction(() => {
            this.default_layouts = _.cloneDeep(new_layouts);
            this.current_layouts = _.cloneDeep(new_layouts);
            this.cache_layouts = _.cloneDeep(new_layouts);
        });
    }

    restore_panel(panel_id: string): void {
        runInAction(() => {
            this.current_layouts = _.cloneDeep(this.current_layouts);
            const breakpoint = this.current_breakpoint;
            const selected_panel_index = _.findIndex(this.current_layouts[breakpoint], { i: panel_id });
            const selected_cached = _.findIndex(this.cache_layouts[breakpoint], { i: panel_id });
            this.current_layouts[breakpoint][selected_panel_index] = _.cloneDeep(this.cache_layouts[breakpoint][selected_cached]);
            this.current_layouts[breakpoint][selected_panel_index].visible = true;
            delete this.cache_layouts[panel_id];
        });
    }

    close_panel(panel_id: string): void {
        runInAction(() => {
            this.current_layouts = _.cloneDeep(this.current_layouts);
            const breakpoint = this.current_breakpoint;
            const selected_panel_index = _.findIndex(this.current_layouts[breakpoint], { i: panel_id });
            const selected_panel = this.current_layouts[breakpoint][selected_panel_index];
            const selected_cached = _.findIndex(this.cache_layouts[breakpoint], { i: panel_id });
            this.cache_layouts[breakpoint][selected_cached] = _.cloneDeep(selected_panel);
            this.current_layouts[breakpoint][selected_panel_index] = { i: panel_id, x: 0, y: 0, w: 0, h: 0, minH: 0, minW: 0, maxH: 0, maxW: 0, visible: false, isResizable: false, isDraggable: false, static: true };
        });
    }

    toggle_visibility(panel_index: number): void {
        const visible = this.current_layouts[this.current_breakpoint][panel_index]?.visible;
        const panel_id = this.current_layouts[this.current_breakpoint][panel_index]?.i;
        if (visible) {
            this.close_panel(panel_id);
        } else {
            this.restore_panel(panel_id);
        }
    }

    setCurrentLayout(layout: AppLayouts) {
        const breakpoint = this.current_breakpoint;
        const new_layouts = layout[breakpoint];
        const current_layout = this.current_layouts[breakpoint];

        new_layouts.forEach((new_panel, index) => {
            _.merge(current_layout[index], new_panel);
        });
    }

    saveDefaultLayouts() {
        runInAction(() => {
            this.default_layouts = _.cloneDeep(this.current_layouts);

            // Iterate through all breakpoints
            Object.keys(this.default_layouts).forEach(breakpoint => {
                this.default_layouts[breakpoint].forEach((panel, index) => {
                    // If panel is not visible, use cached layout but keep visible as false
                    if (!panel.visible) {
                        const cached_panel_index = _.findIndex(this.cache_layouts[breakpoint], { i: panel.i });
                        if (cached_panel_index !== -1) {
                            this.default_layouts[breakpoint][index] = _.cloneDeep(this.cache_layouts[breakpoint][cached_panel_index]);
                            this.default_layouts[breakpoint][index].visible = false;
                        }
                    }
                });
            });
        });
    }

    resetToDefault() {
        runInAction(() => {
            this.current_layouts = _.cloneDeep(this.default_layouts);
        });
    }

    setCurrentBreakpoint(breakpoint: string) {
        runInAction(() => {
            this.current_breakpoint = breakpoint;
        });
    }
}

export default PanelLayoutManager;