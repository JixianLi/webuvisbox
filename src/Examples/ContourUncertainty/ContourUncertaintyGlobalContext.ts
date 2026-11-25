// ABOUTME: State of the contour uncertainty example: ensemble settings, the contour level, what the views show, and
// ABOUTME: the member highlighted across views. Imports no rendering code, so registering the example stays light.

import { makeAutoObservable } from "mobx";
import type { GlobalContext } from "../../Types/GlobalContext";
import { generateEnsemble } from "./ContourEnsemble";
import { contourBoxplot, criticalPoints, crossingProbability, exceedanceFraction } from "./ContourAnalysis";

export type ProbabilityMode = "exceedance" | "crossing";
export type ContourMode = "members" | "boxplot";

export class ContourUncertaintyGlobalContext implements GlobalContext {
    memberCount = 20;
    spread = 0.6;
    seed = 0;
    level = 0.25;
    probabilityMode: ProbabilityMode = "exceedance";
    contourMode: ContourMode = "members";
    showCriticalPoints = true;
    highlightedMember: number | null = null;

    constructor() {
        makeAutoObservable(this, {}, { autoBind: true });
    }

    initialize(globalData: any): void {
        this.memberCount = globalData?.member_count ?? this.memberCount;
        this.spread = globalData?.spread ?? this.spread;
        this.level = globalData?.level ?? this.level;
        this.probabilityMode = globalData?.probability_mode ?? this.probabilityMode;
        this.contourMode = globalData?.contour_mode ?? this.contourMode;
        this.showCriticalPoints = globalData?.show_critical_points ?? this.showCriticalPoints;
    }

    async asyncInitialize(): Promise<void> {}

    toObject(): any {
        return {
            member_count: this.memberCount,
            spread: this.spread,
            level: this.level,
            probability_mode: this.probabilityMode,
            contour_mode: this.contourMode,
            show_critical_points: this.showCriticalPoints,
        };
    }

    get ensemble() {
        return generateEnsemble(this.memberCount, this.spread, this.seed);
    }

    get exceedance() {
        return exceedanceFraction(this.ensemble.members, this.level);
    }

    get crossing() {
        return crossingProbability(this.ensemble.members, this.level);
    }

    get boxplot() {
        return contourBoxplot(this.ensemble.members, this.level);
    }

    get memberCriticalPoints() {
        return this.ensemble.members.map(criticalPoints);
    }

    setMemberCount(memberCount: number) {
        this.memberCount = memberCount;
        this.highlightedMember = null;
    }

    setSpread(spread: number) {
        this.spread = spread;
    }

    newRandomSeed() {
        this.seed += 1;
    }

    setLevel(level: number) {
        this.level = level;
    }

    setProbabilityMode(mode: ProbabilityMode) {
        this.probabilityMode = mode;
    }

    setContourMode(mode: ContourMode) {
        this.contourMode = mode;
    }

    setShowCriticalPoints(show: boolean) {
        this.showCriticalPoints = show;
    }

    setHighlightedMember(member: number | null) {
        this.highlightedMember = member;
    }
}
