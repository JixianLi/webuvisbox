// ABOUTME: The ChatUI example's topics: a word cloud of the conversation, sized by how often each word occurs, colored
// ABOUTME: by who used it more; hovering a word shows the words it shares messages with.

import { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react-lite";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { Panel } from "../../../Panels/Panel";
import { useScenario } from "../../../ScenarioManager/ScenarioManager";
import { WordCloud, WordCloudLayoutRunner, measureWords, type PlacedWord, type WordCloudLink } from "../../../Renderers/Graph";
import type { ChatUIGlobalContext } from "../ChatUIGlobalContext";

const FONT_WEIGHT = 500;
const ASPECT_RATIO = 1.6;

// Inside the Panel, so the theme it reads is the panel's (dark in neutral mode).
const TopicsContent = observer(function TopicsContent() {
    const context = useScenario().globalContext as ChatUIGlobalContext;
    const theme = useTheme();
    const tokens = theme.tokens;
    const fontFamily = String(theme.typography.fontFamily);
    const { words, links, speakerOf } = context.topics;
    const [placed, setPlaced] = useState<PlacedWord[]>([]);
    const [focusKey, setFocusKey] = useState<string | null>(null);
    const [selectedKey, setSelectedKey] = useState<string | null>(null);
    const runnerRef = useRef<WordCloudLayoutRunner | null>(null);
    const placedRef = useRef<PlacedWord[]>([]);

    useEffect(() => {
        const runner = new WordCloudLayoutRunner(next => {
            placedRef.current = next;
            setPlaced(next);
        });
        runnerRef.current = runner;
        return () => runner.dispose();
    }, []);

    // Laid out again as the conversation grows, starting from the words' last positions so the cloud does not jump.
    useEffect(() => {
        const measured = measureWords(words, { maxFontSize: 34, minFontSize: 11, fontFamily, fontWeight: FONT_WEIGHT });
        const previousPositions = Object.fromEntries(placedRef.current.map(word => [word.key, { x: word.x, y: word.y }]));
        runnerRef.current?.request(measured, links, { aspectRatio: ASPECT_RATIO, linkStrength: 0.4, previousPositions });
    }, [words, links, fontFamily]);

    const cloudLinks: WordCloudLink[] = links.map(link => ({
        source: words[link.source].key, target: words[link.target].key, similarity: link.similarity,
    }));
    const colorOf = (key: string) => (speakerOf.get(key) === "user" ? tokens.accentOnSurface : tokens.text);

    return (
        <>
            <Box sx={{ width: 1, height: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
                <Box sx={{ flex: 1, minHeight: 0 }}>
                    {placed.length > 0 &&
                        <WordCloud words={placed} colorOf={colorOf} fontFamily={fontFamily} fontWeight={FONT_WEIGHT}
                                   links={cloudLinks} focusKey={focusKey ?? selectedKey} selectedKey={selectedKey}
                                   onHover={setFocusKey} onSelect={setSelectedKey} />}
                </Box>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    Words of the conversation, sized by how often they occur; colored by the user or the assistants,
                    whoever used them more. Point at a word to see the words it shares messages with.
                </Typography>
            </Box>
        </>
    );
});

export default function TopicsPanel() {
    return <Panel panelName="Topics"><TopicsContent /></Panel>;
}
