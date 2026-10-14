import { hexRgb, pixelBuffer } from '../core.js';

// Autômato celular em grade toroidal. Cada regra "B/S" diz com quantos vizinhos vivos uma célula
// nasce (Birth) ou sobrevive (Survival); aqui viram máscaras de bits indexadas pela contagem.
// O terceiro valor é a densidade usada para reavivar a grade (Dia e Noite só prospera perto de 50%).
const mask = digits => [...digits].reduce((m, d) => m | 1 << +d, 0);
const RULES = {
    conway: ['3', '23', 0.35], highlife: ['36', '23', 0.35], daynight: ['3678', '34678', 0.5], maze: ['3', '12345', 0.3]
};
const WINDOW = 60; // gerações observadas para detectar estagnação (múltiplo de 1..4)

// Preenche aleatoriamente um quadrado (ou a grade inteira, se size >= dimensões)
function sprinkle(s, density, size) {
    const { cw, ch, G } = s, rw = Math.min(cw, size), rh = Math.min(ch, size);
    const x0 = Math.random() * cw | 0, y0 = Math.random() * ch | 0;
    for (let y = 0; y < rh; y++) for (let x = 0; x < rw; x++)
        G[((y0 + y) % ch) * cw + (x0 + x) % cw] = Math.random() < density ? 1 : 0;
}

export default {
    controls: [
        { id: 'rule', type: 'select', label: 'Regra', value: 'conway', options: [['conway', 'Conway (B3/S23)'],
            ['highlife', 'HighLife (B36/S23)'], ['daynight', 'Dia e Noite (B3678/S34678)'], ['maze', 'Labirinto (B3/S12345)']] },
        { id: 'speed', label: 'Gerações por segundo', min: 1, max: 60, value: 20 },
        { id: 'cell', label: 'Tamanho da célula', min: 3, max: 16, value: 6, reset: true, random: false },
        { id: 'density', label: 'Densidade inicial', min: 0.05, max: 0.6, step: 0.05, value: 0.3, reset: true },
        { id: 'trail', label: 'Rastro', min: 0, max: 0.95, step: 0.05, value: 0.8 },
        { id: 'color', type: 'color', label: 'Cor', value: '#88ff44' }
    ],
    setup({ w, h }, p, s) {
        const cw = Math.ceil(w / p.cell), ch = Math.ceil(h / p.cell), n = cw * ch;
        Object.assign(s, { cw, ch, acc: 0, gen: 0, revivals: 0, pops: new Int32Array(WINDOW), G: new Uint8Array(n), G2: new Uint8Array(n), heat: new Float32Array(n),
            XL: Int32Array.from({ length: cw }, (_, x) => (x - 1 + cw) % cw), XR: Int32Array.from({ length: cw }, (_, x) => (x + 1) % cw) });
        for (let i = 0; i < n; i++) s.G[i] = Math.random() < p.density ? 1 : 0;
    },
    frame({ ctx }, p, s, dt) {
        const { cw, ch, XL, XR, heat, pops } = s, n = cw * ch, [b, sv, revive] = RULES[p.rule], B = mask(b), S = mask(sv);
        s.acc += dt * p.speed;
        let steps = Math.min(4, s.acc | 0);
        s.acc -= steps;
        while (steps--) {
            const { G, G2 } = s;
            let pop = 0;
            for (let y = 0; y < ch; y++) {
                const r = y * cw, ru = ((y - 1 + ch) % ch) * cw, rd = ((y + 1) % ch) * cw;
                for (let x = 0; x < cw; x++) {
                    const xl = XL[x], xr = XR[x], i = r + x;
                    const k = G[ru + xl] + G[ru + x] + G[ru + xr] + G[r + xl] + G[r + xr] + G[rd + xl] + G[rd + x] + G[rd + xr];
                    const alive = (G[i] ? S : B) >> k & 1;
                    G2[i] = alive;
                    pop += alive;
                    heat[i] = alive ? 1 : heat[i] * p.trail;
                }
            }
            s.G = G2; s.G2 = G;
            // Estagnação: a população se repete com período 1 a 4 em toda a janela (vazio, blocos parados,
            // osciladores, planadores soltos). Injeta uma área nova; se já falhou duas vezes, ressemeia tudo.
            pops[s.gen++ % WINDOW] = pop;
            if (s.gen >= WINDOW) {
                const tol = Math.max(2, pop * 0.01);
                if ([1, 2, 3, 4].some(P => pops.every((v, i) => Math.abs(v - pops[(i + P) % WINDOW]) <= tol))) {
                    const full = ++s.revivals > 2;
                    sprinkle(s, revive, full ? Math.max(cw, ch) : Math.max(8, Math.min(cw, ch) / 4 | 0));
                    if (full) s.revivals = 0;
                    s.gen = 0;
                } else if (s.gen > WINDOW * 5) s.revivals = 0; // voltou a ter atividade por um bom tempo
            }
        }

        const buf = pixelBuffer(s, cw, ch), d = buf.img.data, [r, g, bl] = hexRgb(p.color);
        for (let i = 0, q = 0; i < n; i++, q += 4) {
            const f = heat[i];
            d[q] = r * f; d[q + 1] = g * f; d[q + 2] = bl * f; d[q + 3] = 255;
        }
        buf.octx.putImageData(buf.img, 0, 0);
        ctx.imageSmoothingEnabled = false; // células nítidas
        ctx.drawImage(buf.off, 0, 0, cw * p.cell, ch * p.cell);
    }
};
