import { useEffect, useState } from 'react';

// ── Config ────────────────────────────────────────────────────────────────
const S = 6;    // CSS px per pixel
const W = 30;
const H = 20;

// ── Palette ───────────────────────────────────────────────────────────────
const D  = '#1b3254';  // dark — outline / shadow
const B  = '#3a7bd5';  // robot blue
const L  = '#7ec8f0';  // light blue — panel / highlight
const Y  = '#ffd43b';  // yellow — antenna, button, happy eyes
const BS = '#3d1800';  // book spine
const BC = '#7a3a18';  // book cover
const BP = '#fdf5e6';  // book pages
const BT = '#c0a060';  // book text lines
const P1 = '#ffd43b';  // particle – gold
const P2 = '#ff6b5e';  // particle – pink
const P3 = '#7ec8f0';  // particle – blue

// ── Primitive ─────────────────────────────────────────────────────────────
type Rect = [number, number, number, number, string]; // x y w h color

const r = (x: number, y: number, w: number, h: number, c: string): Rect =>
    [x, y, w, h, c];

// ── Robot: static geometry ────────────────────────────────────────────────
// Eyes and mouth are per-frame; everything else lives here.
const BODY: Rect[] = [
    // antenna
    r(5, 0, 1, 1, Y),          // tip
    r(5, 1, 1, 2, D),          // stem
    // head outline
    r(2, 3, 7, 1, D),          // top
    r(2, 4, 1, 6, D),          // left
    r(8, 4, 1, 6, D),          // right
    r(2, 9, 7, 1, D),          // bottom
    // head fill + corner highlight
    r(3, 4, 5, 5, B),
    r(3, 4, 2, 1, L),
    // left arm
    r(0, 11, 2, 2, D),
    r(0, 11, 1, 1, B),
    // body outline
    r(1, 10, 9, 1, D),         // top
    r(1, 11, 1, 4, D),         // left
    r(9, 11, 1, 4, D),         // right
    r(1, 14, 9, 1, D),         // bottom
    // body fill
    r(2, 11, 7, 3, B),
    // panel
    r(3, 11, 4, 2, L),
    r(5, 12, 1, 1, Y),         // button
    // legs
    r(2, 15, 2, 3, D),
    r(6, 15, 2, 3, D),
    // feet + shadow
    r(1, 18, 3, 1, D),
    r(6, 18, 3, 1, D),
    r(2, 19, 4, 1, D),
    r(6, 19, 4, 1, D),
];

// ── Eye variants ──────────────────────────────────────────────────────────
const normalEyes = (): Rect[] => [
    r(4, 6, 1, 1, D),
    r(7, 6, 1, 1, D),
];

// + shaped stars for the satisfied frame
const starEyes = (): Rect[] => [
    r(4, 5, 1, 3, Y), r(3, 6, 3, 1, Y),
    r(7, 5, 1, 3, Y), r(6, 6, 3, 1, Y),
];

// ── Mouth variants ────────────────────────────────────────────────────────
const mouthClosed = (): Rect[] => [
    r(4, 8, 3, 1, D),
];

const mouthHalf = (): Rect[] => [
    r(4, 8, 3, 1, D),          // upper lip
    r(4, 9, 1, 1, D),          // left corner drop
    r(6, 9, 1, 1, D),          // right corner drop
];

const mouthOpen = (): Rect[] => [
    r(3, 7, 5, 1, D),          // upper jaw / teeth bar
    r(3, 8, 1, 2, D),          // left jaw side
    r(7, 8, 1, 2, D),          // right jaw side
    r(4, 8, 3, 2, '#0a1832'),  // mouth interior (very dark)
    r(4, 7, 1, 1, L),          // tooth highlight left
    r(6, 7, 1, 1, L),          // tooth highlight right
];

const mouthChew = (): Rect[] => [
    r(3, 7, 5, 1, D),          // upper lip
    r(3, 8, 2, 1, D),          // left cheek
    r(6, 8, 2, 1, D),          // right cheek
    r(5, 8, 1, 1, B),          // chewing bulge
    r(3, 9, 5, 1, D),          // lower lip
];

// ── Right-arm variants ────────────────────────────────────────────────────
const armIdle = (): Rect[] => [
    r(10, 11, 2, 2, D),
    r(10, 11, 1, 1, B),
];

const armReach = (len: number): Rect[] => [
    r(10, 11, len, 2, D),
    r(11, 11, Math.max(0, len - 2), 1, B),  // arm highlight
    r(10 + len, 10, 1, 1, D),               // claw finger top
    r(10 + len, 13, 1, 1, D),               // claw finger bottom
];

// ── Book ──────────────────────────────────────────────────────────────────
// bx = left edge (spine), pages = total pixel width including spine & cover
function book(bx: number, pages: number): Rect[] {
    if (pages <= 0) return [];
    const BY = 4, BH = 12;
    const out: Rect[] = [
        r(bx, BY, 1, BH, BS),                        // spine
    ];
    if (pages >= 3) {
        out.push(r(bx + 1, BY, pages - 2, BH, BP));  // page block
        const textW = Math.max(0, pages - 4);
        for (let row = BY + 1; row < BY + BH; row += 2) {
            if (textW > 0) out.push(r(bx + 2, row, textW, 1, BT));
        }
        out.push(r(bx + pages - 1, BY, 1, BH, BC));  // back cover
    }
    return out;
}

// ── Sparkle particles (frame 3) ───────────────────────────────────────────
const sparkles = (): Rect[] => [
    // scattered single pixels
    r(11, 4, 1, 1, P1), r(13, 3, 1, 1, P2), r(15, 5, 1, 1, P3),
    r(12, 8, 1, 1, P2), r(16, 4, 1, 1, P1), r(14, 10, 1, 1, P3),
    r(18, 6, 1, 1, P1), r(20, 3, 1, 1, P2), r(19, 9,  1, 1, P3),
    // three + stars
    r(13, 4, 1, 3, P1), r(12, 5, 3, 1, P1),
    r(18, 5, 1, 3, P2), r(17, 6, 3, 1, P2),
    r(21, 4, 1, 3, P3), r(20, 5, 3, 1, P3),
];

// ── Frames (pre-computed at module load) ──────────────────────────────────
const FRAMES: Rect[][] = [
    // 0 · calm: mouth closed, arm idle, full book
    [...BODY, ...normalEyes(), ...mouthClosed(), ...armIdle(),    ...book(17, 12)],
    // 1 · alert: mouth half-open, arm starting to reach
    [...BODY, ...normalEyes(), ...mouthHalf(),   ...armReach(4),  ...book(17, 12)],
    // 2 · eating: mouth wide open, arm extended, book half consumed
    [...BODY, ...normalEyes(), ...mouthOpen(),   ...armReach(9),  ...book(21, 8)],
    // 3 · satisfied: star eyes, chewing, book gone, sparkles
    [...BODY, ...starEyes(),   ...mouthChew(),   ...armIdle(),    ...sparkles()],
];

// ── Component ─────────────────────────────────────────────────────────────
export default function RobotEatingAnimation() {
    const [frame, setFrame]     = useState(0);
    const [dotCount, setDotCount] = useState(0);

    useEffect(() => {
        const id = setInterval(() => setFrame(f => (f + 1) % FRAMES.length), 280);
        return () => clearInterval(id);
    }, []);

    useEffect(() => {
        const id = setInterval(() => setDotCount(d => (d + 1) % 4), 500);
        return () => clearInterval(id);
    }, []);

    return (
        <div className="flex flex-col items-center gap-6 py-12">
            <svg
                width={W * S}
                height={H * S}
                style={{ imageRendering: 'pixelated' }}
                aria-label="Pixel art robot eating a recipe book"
                role="img"
            >
                {FRAMES[frame].map(([x, y, w, h, c], i) => (
                    <rect
                        key={i}
                        x={x * S}
                        y={y * S}
                        width={w * S}
                        height={h * S}
                        fill={c}
                    />
                ))}
            </svg>
            <p className="font-mono text-sm tracking-widest text-mid select-none w-44 text-center">
                Reading recipe{'.'.repeat(dotCount)}
            </p>
        </div>
    );
}
