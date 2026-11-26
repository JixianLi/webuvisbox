// ABOUTME: Checks a scenario config before anything is built from it, so a bad config fails with a message naming the
// ABOUTME: key at fault and leaves the running scenario untouched.

import * as d3 from "d3";
import { scenarioRegistry } from "../Scenarios/ScenarioRegistry";
import { DEFAULT_BREAKPOINTS } from "../LayoutManager/PanelLayoutManager";
import { DISPLAY_MODES, UI_SCALES } from "../Theme/DesignTokens";
import type { ScenarioConfig } from "../Types/Scenario";

function isRecord(value: unknown): value is Record<string, unknown> {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isNumberRecord(value: unknown): value is Record<string, number> {
    return isRecord(value) && Object.values(value).every(entry => typeof entry === "number" && Number.isFinite(entry));
}

function checkPanelLayouts(name: string, panelLayouts: unknown): void {
    if (!isRecord(panelLayouts) || !isRecord(panelLayouts.default_layouts)) {
        throw new Error(`The config of "${name}" has no panel_layouts.default_layouts.`);
    }
    const layouts = panelLayouts.default_layouts;
    for (const [breakpoint, layout] of Object.entries(layouts)) {
        if (!Array.isArray(layout)) {
            throw new Error(`panel_layouts.default_layouts.${breakpoint} of "${name}" is not a list of panels.`);
        }
        layout.forEach((panel: unknown, index) => {
            const valid = isRecord(panel) && typeof panel.i === "string"
                && ["x", "y", "w", "h"].every(key => typeof panel[key] === "number");
            if (!valid) {
                throw new Error(`Panel ${index} in panel_layouts.default_layouts.${breakpoint} of "${name}" needs ` +
                                `an "i" (its id) and numbers "x", "y", "w", "h".`);
            }
        });
    }

    if (panelLayouts.breakpoints !== undefined && !isNumberRecord(panelLayouts.breakpoints)) {
        throw new Error(`panel_layouts.breakpoints of "${name}" must map breakpoint names to minimum widths in px.`);
    }
    if (panelLayouts.cols !== undefined && !isNumberRecord(panelLayouts.cols)) {
        throw new Error(`panel_layouts.cols of "${name}" must map breakpoint names to column counts.`);
    }
    if (panelLayouts.fit_rows !== undefined && !isNumberRecord(panelLayouts.fit_rows)) {
        throw new Error(`panel_layouts.fit_rows of "${name}" must map breakpoint names to row counts.`);
    }

    const breakpoints = Object.keys(panelLayouts.breakpoints ?? DEFAULT_BREAKPOINTS);
    if (!breakpoints.some(breakpoint => breakpoint in layouts)) {
        const where = panelLayouts.breakpoints === undefined
            ? `the default breakpoints (${breakpoints.join(", ")}; panel_layouts.breakpoints is not given)`
            : `panel_layouts.breakpoints (${breakpoints.join(", ")})`;
        throw new Error(`panel_layouts.default_layouts of "${name}" has no layout for any of ${where}.`);
    }
}

function checkAppearance(name: string, appearance: unknown): void {
    if (appearance === undefined) {
        return;
    }
    if (!isRecord(appearance)) {
        throw new Error(`appearance of "${name}" is not an object.`);
    }
    const { accent, default_mode: mode, ui_scale: uiScale } = appearance;
    // Parsed rather than passed through: the accent ends up in style rules, so only a color may get there.
    if (accent !== undefined && (typeof accent !== "string" || d3.color(accent) === null)) {
        throw new Error(`appearance.accent of "${name}" is not a CSS color: ${JSON.stringify(accent)}.`);
    }
    if (mode !== undefined && !DISPLAY_MODES.includes(mode as never)) {
        throw new Error(`appearance.default_mode of "${name}" is ${JSON.stringify(mode)}; ` +
                        `it must be one of ${DISPLAY_MODES.join(", ")}.`);
    }
    const smallest = Math.min(...UI_SCALES);
    const largest = Math.max(...UI_SCALES);
    if (uiScale !== undefined && (typeof uiScale !== "number" || !(uiScale >= smallest && uiScale <= largest))) {
        throw new Error(`appearance.ui_scale of "${name}" is ${JSON.stringify(uiScale)}; ` +
                        `it must be a number from ${smallest} to ${largest}.`);
    }
}

export function checkConfig(value: unknown): asserts value is ScenarioConfig {
    if (!isRecord(value)) {
        throw new Error("The config is not a JSON object.");
    }
    const name = value.name;
    if (typeof name !== "string" || name === "") {
        throw new Error('The config has no "name".');
    }
    if (!scenarioRegistry.has(name)) {
        throw new Error(`No scenario named "${name}" is registered in this app ` +
                        `(registered: ${scenarioRegistry.list().join(", ")}).`);
    }
    checkPanelLayouts(name, value.panel_layouts);
    checkAppearance(name, value.appearance);
}
