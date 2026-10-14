import { hexRgb, pixelBuffer } from '../core.js';

// Reação-difusão de Gray-Scott: dois "químicos" U e V numa grade toroidal.
// U + 2V -> 3V (V consome U), U é reabastecido à taxa F e V é removido à taxa F + k.
// Pequenas mudanças em (F, k) produzem corais, labirintos, pontos que se dividem etc.
const PRESETS = {
    coral: [0.0545, 0.062], mitose: [0.0367, 0.0649], labirinto: [0.029, 0.057],
    pontos: [0.025, 0.06], vermes: [0.078, 0.061], ondas: [0.014, 0.045]
};
const DU = 1, DV = 0.5;

// Semeia manchas de V em vários pontos (U = 1, V = 0 no resto)
function seed(s) {
    const { cw, ch, U, V } = s, spots = Math.max(6, (cw * ch / 3000) | 0);
    U.fill(1); V.fill(0);
    for (let n = 0; n < spots; n++) {
        const x0 = Math.random() * cw | 0, y0 = Math.random() * ch | 0, r = 3 + Math.random() * 5;
        for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) {
            if (x * x + y * y > r * r) continue;
            const i = ((y0 + y + ch) % ch | 0) * cw + ((x0 + x + cw) % cw | 0);
            U[i] = 0.5; V[i] = 0.25 + Math.random() * 0.1;
        }
    }
}

export default {
    controls: [
        { id: 'preset', type: 'select', label: 'Padrão', value: 'coral', options: [['coral', 'Coral'], ['mitose', 'Mitose'],
            ['labirinto', 'Labirinto'], ['pontos', 'Pontos'], ['vermes', 'Vermes'], ['ondas', 'Ondas']] },
        { id: 'speed', label: 'Velocidade (passos/frame)', min: 1, max: 20, value: 10 },
        { id: 'cell', label: 'Tamanho do pixel', min: 2, max: 6, value: 3, reset: true, random: false },
        { id: 'color', type: 'color', label: 'Cor', value: '#66ccff' }
    ],
    setup({ w, h }, p, s) {
        const cw = Math.ceil(w / p.cell), ch = Math.ceil(h / p.cell), n = cw * ch;
        // Vizinhos com wrap pré-calculados para o laço interno não ter módulo
        const XL = Int32Array.from({ length: cw }, (_, x) => (x - 1 + cw) % cw);
        const XR = Int32Array.from({ length: cw }, (_, x) => (x + 1) % cw);
        Object.assign(s, { cw, ch, XL, XR, acc: 0,
            U: new Float32Array(n), V: new Float32Array(n), U2: new Float32Array(n), V2: new Float32Array(n) });
        seed(s);
    },
    frame({ ctx, w, h }, p, s, dt) {
        const { cw, ch, XL, XR } = s, [F, k] = PRESETS[p.preset];
        s.acc += p.speed * dt * 60; // passos independentes da taxa de atualização
        let steps = Math.min(40, s.acc | 0);
        s.acc -= steps;
        while (steps--) {
            const { U, V, U2, V2 } = s;
            for (let y = 0; y < ch; y++) {
                const r = y * cw, ru = ((y - 1 + ch) % ch) * cw, rd = ((y + 1) % ch) * cw;
                for (let x = 0; x < cw; x++) {
                    const i = r + x, xl = XL[x], xr = XR[x], u = U[i], v = V[i];
                    // Laplaciano 3x3: vizinhos ortogonais 0.2, diagonais 0.05, centro -1
                    const lu = 0.2 * (U[r + xl] + U[r + xr] + U[ru + x] + U[rd + x])
                        + 0.05 * (U[ru + xl] + U[ru + xr] + U[rd + xl] + U[rd + xr]) - u;
                    const lv = 0.2 * (V[r + xl] + V[r + xr] + V[ru + x] + V[rd + x])
                        + 0.05 * (V[ru + xl] + V[ru + xr] + V[rd + xl] + V[rd + xr]) - v;
                    const uvv = u * v * v;
                    U2[i] = u + DU * lu - uvv + F * (1 - u);
                    V2[i] = v + DV * lv + uvv - (F + k) * v;
                }
            }
            s.U = U2; s.V = V2; s.U2 = U; s.V2 = V;
        }

        const buf = pixelBuffer(s, cw, ch), d = buf.img.data, V = s.V, [r, g, b] = hexRgb(p.color);
        let max = 0;
        for (let i = 0, q = 0; i < V.length; i++, q += 4) {
            const v = V[i], f = v > 0.3 ? 1 : v / 0.3;
            if (v > max) max = v;
            d[q] = r * f; d[q + 1] = g * f; d[q + 2] = b * f; d[q + 3] = 255;
        }
        if (max < 0.01) seed(s); // padrão morreu (tudo voltou a U = 1): semeia de novo
        buf.octx.putImageData(buf.img, 0, 0);
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(buf.off, 0, 0, cw * p.cell, ch * p.cell);
    }
};
