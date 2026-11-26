// ABOUTME: The ChatUI example's topics: the conversation's words weighted by how often they occur, linked when they occur
// ABOUTME: in the same message, and attributed to whoever used them more (user or assistants). Pure text processing.

import type { ChatMessage } from "../../Renderers/Chat";
import type { LayoutLink, WordInput } from "../../Renderers/Graph";

const MINIMUM_LENGTH = 4;
const MAXIMUM_WORDS = 40;
const STOP_WORDS = new Set([
    "about", "after", "again", "also", "been", "before", "being", "could", "does", "doing", "each", "from", "have",
    "having", "here", "into", "just", "like", "more", "most", "much", "only", "other", "over", "same", "should", "some",
    "such", "than", "that", "their", "them", "then", "there", "these", "they", "this", "those", "very", "want", "were",
    "what", "when", "where", "which", "while", "will", "with", "would", "your",
]);

export type Speaker = "user" | "assistant";

export interface ConversationTopics {
    words: WordInput[];
    links: LayoutLink[];
    speakerOf: Map<string, Speaker>;
}

function textOf(message: ChatMessage): string {
    return typeof message.content === "string"
        ? message.content
        : message.content.map(part => (part.type === "text" ? part.text : "")).join(" ");
}

function wordsIn(text: string): string[] {
    return (text.toLowerCase().match(/[\p{L}'’]+/gu) ?? [])
        .map(word => word.replace(/’/g, "'").replace(/^'+|'+$/g, ""))
        // Contractions ("what's", "it's") are function words too.
        .filter(word => word.length >= MINIMUM_LENGTH && !word.includes("'") && !STOP_WORDS.has(word));
}

export function conversationTopics(messages: ChatMessage[]): ConversationTopics {
    const counts = new Map<string, number>();
    const bySpeaker = new Map<string, { user: number; assistant: number }>();
    const perMessage = messages.map(message => {
        const speaker: Speaker = message.role === "user" ? "user" : "assistant";
        const words = wordsIn(textOf(message));
        for (const word of words) {
            counts.set(word, (counts.get(word) ?? 0) + 1);
            const tally = bySpeaker.get(word) ?? { user: 0, assistant: 0 };
            tally[speaker] += 1;
            bySpeaker.set(word, tally);
        }
        return new Set(words);
    });

    const kept = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, MAXIMUM_WORDS);
    const indexOf = new Map(kept.map(([word], index) => [word, index]));
    const words: WordInput[] = kept.map(([word, count]) => ({ key: word, text: word, weight: count }));

    // Similarity: the share of messages holding either word that hold both (Jaccard index).
    const together = new Map<string, number>();
    const containing = new Map<string, number>();
    for (const message of perMessage) {
        const present = [...message].filter(word => indexOf.has(word));
        for (const word of present) containing.set(word, (containing.get(word) ?? 0) + 1);
        for (let first = 0; first < present.length; first++) {
            for (let second = first + 1; second < present.length; second++) {
                const [a, b] = [present[first], present[second]].sort();
                together.set(`${a}|${b}`, (together.get(`${a}|${b}`) ?? 0) + 1);
            }
        }
    }
    const links: LayoutLink[] = [...together.entries()].map(([pair, both]) => {
        const [a, b] = pair.split("|");
        return { source: indexOf.get(a)!, target: indexOf.get(b)!,
                 similarity: both / (containing.get(a)! + containing.get(b)! - both) };
    });

    const speakerOf = new Map<string, Speaker>(kept.map(([word]) => {
        const tally = bySpeaker.get(word)!;
        return [word, tally.user >= tally.assistant ? "user" : "assistant"];
    }));
    return { words, links, speakerOf };
}
