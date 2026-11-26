import { describe, expect, it } from 'vitest';
import { conversationTopics } from './ConversationTopics';

describe('conversationTopics', () => {
    const topics = conversationTopics([
        { id: '1', role: 'user', content: "What's the weather in Paris?" },
        { id: '2', role: 'assistant', content: [{ type: 'text', text: 'Sunny weather in Paris, warm.' }] },
        { id: '3', role: 'user', content: 'Show me a kitten picture' },
    ]);

    it('weights words by how often they occur, leaving out short and common ones', () => {
        const weightOf = Object.fromEntries(topics.words.map(word => [word.key, word.weight]));
        expect(weightOf.weather).toBe(2);
        expect(weightOf.paris).toBe(2);
        expect(weightOf).not.toHaveProperty('what');
        expect(weightOf).not.toHaveProperty('the');
    });

    it('links words of the same message by the share of messages that hold both', () => {
        const index = new Map(topics.words.map((word, position) => [word.key, position]));
        const link = topics.links.find(candidate =>
            [candidate.source, candidate.target].sort().join() === [index.get('weather'), index.get('paris')].sort().join());
        expect(link?.similarity).toBe(1);
        expect(topics.links.some(candidate => candidate.source === index.get('kitten') && candidate.target === index.get('paris'))).toBe(false);
    });

    it('attributes each word to whoever used it more', () => {
        expect(topics.speakerOf.get('kitten')).toBe('user');
        expect(topics.speakerOf.get('sunny')).toBe('assistant');
    });
});
