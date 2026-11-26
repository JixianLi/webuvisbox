// ABOUTME: Seeded random numbers, so one seed always gives the same synthetic data (examples, tests, a downloaded
// ABOUTME: config that stores its seed).

// Uniform numbers in [0, 1) from mulberry32, a 32-bit generator (Tommy Ettinger, public domain): fast, and good enough
// for synthetic data, not for cryptography.
export function seededRandom(seed: number): () => number {
    let value = seed >>> 0;
    return () => {
        value = (value + 0x6d2b79f5) >>> 0;
        let mixed = Math.imul(value ^ (value >>> 15), value | 1);
        mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
        return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
    };
}

// Standard normal samples (mean 0, standard deviation 1) from uniform ones by the Box–Muller transform:
// z = sqrt(-2 ln u1) cos(2π u2), with u1 taken as 1 - random() so it is never 0.
export function standardNormal(random: () => number): () => number {
    return () => Math.sqrt(-2 * Math.log(1 - random())) * Math.cos(2 * Math.PI * random());
}
