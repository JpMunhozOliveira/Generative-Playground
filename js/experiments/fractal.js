import { pixelBuffer } from '../core.js';

// Conjuntos de Julia e Mandelbrot por tempo de escape: itera z -> z² + c e colore pelo número
// de iterações até |z| escapar. A contagem é suavizada (n + 1 - log2(log|z|)) para evitar faixas.
// Julia: c percorre um círculo de raio 0.7885, então o conjunto se transforma continuamente.
// Mandelbrot: zoom exponencial contínuo rumo a um ponto da fronteira, até o limite de precisão do double.
// Os alvos são pontos de Misiurewicz (a órbita de 0 cai num ciclo após k passos): não há interior por perto,
// então a imagem segue detalhada em qualquer zoom e com poucas iterações por pixel. Pontos perto de
// mini-Mandelbrots (ex.: o clássico Vale dos Cavalos-marinhos) exigiriam milhares de iterações em zoom profundo.
const TARGETS = {
    spiral: [-0.1010963638456222, 0.9562865108091416], // M4,1
    dendrite: [0, 1],                                  // c = i (M1,2)
    east: [0.3590789944293554, 0.0625891973476384]     // M8,2
};
const MAX_ZOOM = 36; // log2; além disso os pixels ficam menores que a precisão do double

// Paletas cosseno (Inigo Quilez): cor(t) = a + b·cos(2π(c·t + d))
const PALETTES = {
    arco: [[0.5, 0.5, 0.5], [0.5, 0.5, 0.5], [1, 1, 1], [0, 0.33, 0.67]],
    quente: [[0.5, 0.5, 0.5], [0.5, 0.5, 0.5], [1, 1, 1], [0, 0.1, 0.2]],
    gelo: [[0.4, 0.6, 0.8], [0.4, 0.4, 0.2], [1, 1, 1], [0.5, 0.5, 0.5]]
};
function makeLut([A, B, C, D]) {
    const lut = new Uint8ClampedArray(1024 * 3);
    for (let i = 0; i < 1024; i++)
        for (let ch = 0; ch < 3; ch++) lut[i * 3 + ch] = 255 * (A[ch] + B[ch] * Math.cos(2 * Math.PI * (C[ch] * i / 1024 + D[ch])));
    return lut;
}

export default {
    thumb: { params: { cell: 1 } }, // miniatura da galeria
    controls: [
        { id: 'mode', type: 'select', label: 'Conjunto', value: 'julia',
          options: [['julia', 'Julia (animado)'], ['mandelbrot', 'Mandelbrot (zoom infinito)']] },
        { id: 'target', type: 'select', label: 'Alvo do zoom (Mandelbrot)', value: 'spiral',
          options: [['spiral', 'Espiral (M4,1)'], ['dendrite', 'Dendrito (c = i)'], ['east', 'Ramo leste (M8,2)']] },
        { id: 'speed', label: 'Velocidade', min: 0, max: 2, step: 0.1, value: 0.5 },
        { id: 'iter', label: 'Iterações', min: 50, max: 500, step: 10, value: 150 },
        { id: 'palette', type: 'select', label: 'Paleta', value: 'arco', options: [['arco', 'Arco-íris'], ['quente', 'Quente'], ['gelo', 'Gelo']] },
        { id: 'cycle', label: 'Ciclo de cores', min: 0, max: 1, step: 0.05, value: 0.2 },
        { id: 'cell', label: 'Tamanho do pixel', min: 1, max: 4, value: 2, random: false }
    ],
    setup(rt, p, s) { s.t ??= 0; s.zoom ??= 0; s.phase ??= 0; },
    frame({ ctx, w, h }, p, s, dt) {
        if (s.pal !== p.palette) { s.lut = makeLut(PALETTES[p.palette]); s.pal = p.palette; }
        if (s.tgt !== p.target || s.mode !== p.mode) { s.zoom = 0; s.tgt = p.target; s.mode = p.mode; }
        s.t += p.speed * dt * 0.5;
        s.phase += p.cycle * dt * 0.2;

        const julia = p.mode === 'julia';
        let cx0 = 0, cy0 = 0, span = 3.2, maxIt = p.iter;
        if (!julia) {
            s.zoom += p.speed * dt; // o zoom dobra a cada 1/velocidade segundos
            if (s.zoom > MAX_ZOOM) s.zoom = 0;
            const z = 2 ** s.zoom, [tx, ty] = TARGETS[p.target];
            // O centro desliza da vista inicial (-0.6, 0) até o alvo conforme o zoom cresce
            cx0 = tx + (-0.6 - tx) / z; cy0 = ty - ty / z; span = 3.2 / z;
            maxIt += (s.zoom * 20) | 0; // mais detalhe exige mais iterações
        }
        const jx = 0.7885 * Math.cos(s.t), jy = 0.7885 * Math.sin(s.t);
        const cw = Math.ceil(w / p.cell), ch = Math.ceil(h / p.cell), k = span / Math.min(cw, ch);
        const x0 = cx0 - cw * k / 2, y0 = cy0 - ch * k / 2, phase = s.phase % 1;
        const buf = pixelBuffer(s, cw, ch), d = buf.img.data, lut = s.lut;

        for (let j = 0, q = 0; j < ch; j++) {
            const py = y0 + j * k;
            for (let i = 0; i < cw; i++, q += 4) {
                const px = x0 + i * k, cr = julia ? jx : px, ci = julia ? jy : py;
                let x = julia ? px : 0, y = julia ? py : 0, x2 = x * x, y2 = y * y, n = 0;
                if (!julia) {
                    // Cardioide principal e bulbo de período 2: pontos interiores conhecidos, pula a iteração
                    const xq = px - 0.25, qq = xq * xq + py * py;
                    if (qq * (qq + xq) <= 0.25 * py * py || (px + 1) * (px + 1) + py * py <= 0.0625) n = maxIt;
                }
                while (n < maxIt && x2 + y2 <= 256) { y = 2 * x * y + ci; x = x2 - y2 + cr; x2 = x * x; y2 = y * y; n++; }
                d[q + 3] = 255;
                if (n >= maxIt) { d[q] = d[q + 1] = d[q + 2] = 0; continue; }
                const mu = n + 1 - Math.log2(0.5 * Math.log(x2 + y2));
                const t = mu * 0.03 + phase, l = (((t % 1) + 1) % 1 * 1024 | 0) * 3;
                d[q] = lut[l]; d[q + 1] = lut[l + 1]; d[q + 2] = lut[l + 2];
            }
        }
        buf.octx.putImageData(buf.img, 0, 0);
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(buf.off, 0, 0, cw * p.cell, ch * p.cell);
    }
};
