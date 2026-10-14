import { hexRgb } from '../core.js';

// L-Systems (Lindenmayer, 1968): uma gramática reescreve cada símbolo de uma string em paralelo, a
// cada iteração. Depois uma "tartaruga" lê o resultado: F (ou A/B) anda desenhando, + e - giram,
// [ e ] salvam e restauram a posição (ramificação). Regras curtas geram plantas e curvas fractais.
const SYSTEMS = {
    planta: { axiom: 'X', rules: { X: 'F+[[X]-X]-F[-FX]+X', F: 'FF' }, angle: 25, max: 6, heading: -90 },
    arbusto: { axiom: 'F', rules: { F: 'FF+[+F-F-F]-[-F+F+F]' }, angle: 22.5, max: 4, heading: -90 },
    hilbert: { axiom: 'A', rules: { A: '+BF-AFA-FB+', B: '-AF+BFB+FA-' }, angle: 90, max: 7 },
    dragao: { axiom: 'FX', rules: { X: 'X+YF+', Y: '-FX-Y' }, angle: 90, max: 14 },
    koch: { axiom: 'F--F--F', rules: { F: 'F+F--F+F' }, angle: 60, max: 6 },
    sierpinski: { axiom: 'A', rules: { A: 'B-A-B', B: 'A+B+A' }, angle: 60, max: 8, draw: 'AB' },
    gosper: { axiom: 'A', rules: { A: 'A-B--B+A++AA+B-', B: '+A-BB--B-A++A+B' }, angle: 60, max: 5, draw: 'AB' }
};
const BUCKETS = 24; // faixas de cor ao longo do traço (um stroke por faixa)

const expand = (sys, n) => {
    let str = sys.axiom;
    for (let i = 0; i < n; i++) str = str.replace(/[A-Z]/g, c => sys.rules[c] ?? c);
    return str;
};

// Interpreta a string com a tartaruga -> segmentos [x1, y1, x2, y2, ...] e seus limites
function trace(str, sys, angleDeg) {
    const D = new Uint8Array(128);
    for (const c of sys.draw ?? 'F') D[c.charCodeAt(0)] = 1;
    let n = 0;
    for (let i = 0; i < str.length; i++) n += D[str.charCodeAt(i)];
    const seg = new Float32Array(n * 4), stack = [], a = angleDeg * Math.PI / 180;
    let x = 0, y = 0, hd = (sys.heading ?? 0) * Math.PI / 180, k = 0;
    let x0 = 0, y0 = 0, x1 = 0, y1 = 0;
    for (let i = 0; i < str.length; i++) {
        const c = str.charCodeAt(i);
        if (D[c]) {
            const nx = x + Math.cos(hd), ny = y + Math.sin(hd);
            seg[k++] = x; seg[k++] = y; seg[k++] = nx; seg[k++] = ny;
            x = nx; y = ny;
            if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
        }
        else if (c === 43) hd += a;              // +
        else if (c === 45) hd -= a;              // -
        else if (c === 91) stack.push(x, y, hd); // [
        else if (c === 93) { hd = stack.pop(); y = stack.pop(); x = stack.pop(); } // ]
    }
    return { seg, bounds: [x0, y0, x1, y1] };
}

export default {
    thumb: { params: { speed: 3, detail: 4 }, warmup: 90 }, // miniatura da galeria
    controls: [
        { id: 'system', type: 'select', label: 'Gramática', value: 'planta', options: [['planta', 'Planta'], ['arbusto', 'Arbusto'],
            ['hilbert', 'Curva de Hilbert'], ['dragao', 'Curva do Dragão'], ['koch', 'Floco de Koch'],
            ['sierpinski', 'Triângulo de Sierpiński'], ['gosper', 'Curva de Gosper']] },
        { id: 'detail', label: 'Nível de detalhe', min: 1, max: 5, value: 5 },
        { id: 'angle', label: 'Desvio do ângulo', min: -15, max: 15, step: 0.5, value: 0 },
        { id: 'speed', label: 'Velocidade do traço', min: 0.2, max: 3, step: 0.1, value: 1 },
        { id: 'lineWidth', label: 'Espessura', min: 0.5, max: 3, step: 0.5, value: 1 },
        { id: 'color', type: 'color', label: 'Cor inicial', value: '#33ff99' },
        { id: 'color2', type: 'color', label: 'Cor final', value: '#ff33cc' }
    ],
    setup(rt, p, s) { s.t ??= 0; },
    frame({ ctx, w, h }, p, s, dt) {
        const sys = SYSTEMS[p.system], it = Math.max(1, sys.max - 5 + p.detail); // detalhe 5 = máximo da gramática
        const key = p.system + it;
        if (s.key !== key) { s.str = expand(sys, it); s.key = key; s.traced = null; s.t = 0; }
        const ang = sys.angle + p.angle;
        if (s.traced !== key + ang) Object.assign(s, trace(s.str, sys, ang), { traced: key + ang });

        s.t += dt * p.speed / 4; // ~4 s para desenhar tudo na velocidade 1
        if (s.t > 1.5) s.t = 0;  // segura o desenho completo e recomeça
        const { seg, bounds: [x0, y0, x1, y1] } = s, total = seg.length / 4;
        const shown = Math.min(total, Math.ceil(total * s.t));

        // Encaixa o desenho no canvas, centralizado
        const sc = Math.min(w * 0.9 / ((x1 - x0) || 1), h * 0.9 / ((y1 - y0) || 1));
        const ox = (w - (x1 - x0) * sc) / 2 - x0 * sc, oy = (h - (y1 - y0) * sc) / 2 - y0 * sc;

        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, w, h);
        ctx.lineWidth = p.lineWidth;
        ctx.lineCap = 'round';
        const A = hexRgb(p.color), B = hexRgb(p.color2);
        for (let b = 0; b < BUCKETS; b++) {
            const from = Math.floor(total * b / BUCKETS), to = Math.min(shown, Math.floor(total * (b + 1) / BUCKETS));
            if (from >= to) break;
            const f = b / (BUCKETS - 1);
            ctx.strokeStyle = `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * f))})`;
            ctx.beginPath();
            for (let i = from * 4, end = to * 4; i < end; i += 4) {
                ctx.moveTo(ox + seg[i] * sc, oy + seg[i + 1] * sc);
                ctx.lineTo(ox + seg[i + 2] * sc, oy + seg[i + 3] * sc);
            }
            ctx.stroke();
        }
        if (shown > 0 && shown < total) { // ponta da "tartaruga" enquanto desenha
            const i = (shown - 1) * 4;
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(ox + seg[i + 2] * sc, oy + seg[i + 3] * sc, 2.5, 0, Math.PI * 2);
            ctx.fill();
        }
    }
};
