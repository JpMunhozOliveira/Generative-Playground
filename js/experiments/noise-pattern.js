// Campo harmônico (soma de oitavas de sin(A+t)·cos(B−t)) sem trigonometria por pixel: o produto é
// expandido em termos que dependem só da coluna, só da linha e só do tempo. Os dois primeiros
// viram tabelas pré-calculadas no setup; por frame restam multiplicações e somas.
const makeLut = name => {
    const lut = new Uint8ClampedArray(768);
    for (let i = 0; i < 256; i++) {
        const n = i / 255;
        const [r, g, b] = name === 'cyber' ? [n * 255, (1 - n) * 200, 255]
            : name === 'fire' ? [255, n * 150, (1 - n) * 50] : [n * 255, n * 255, n * 255];
        lut.set([r, g, b], i * 3);
    }
    return lut;
};

export default {
    controls: [
        { id: 'scale', label: 'Escala', min: 10, max: 100, step: 5, value: 40, reset: true },
        { id: 'complexity', label: 'Complexidade', min: 1, max: 6, value: 3, reset: true },
        { id: 'cell', label: 'Tamanho da célula', min: 2, max: 16, step: 2, value: 6, reset: true, random: false },
        { id: 'speed', label: 'Velocidade', min: 0.005, max: 0.08, step: 0.005, value: 0.02 },
        { id: 'palette', type: 'select', label: 'Paleta de Cores', value: 'cyber',
          options: [['cyber', 'Cyberpunk (Cyan/Magenta)'], ['fire', 'Chama (Laranja/Vermelho)'], ['mono', 'Monocromático']] }
    ],
    setup({ w, h }, p, s) {
        const cw = Math.ceil(w / p.cell), ch = Math.ceil(h / p.cell), k = 0.4 / p.scale;
        const tab = (n, f, fn) => Float32Array.from({ length: n }, (_, i) => fn(i * f));
        Object.assign(s, { cw, ch, O: p.complexity, t: s.t ?? 0, amp: [], sx: [], cx: [], sy: [], cy: [], tot: 0 });
        for (let o = 0; o < p.complexity; o++) {
            const f = 2 ** o * k * p.cell, amp = 0.5 ** o;
            s.amp.push(amp); s.tot += amp;
            s.sx.push(tab(cw, f, Math.sin)); s.cx.push(tab(cw, f, Math.cos));
            s.sy.push(tab(ch, f, Math.sin)); s.cy.push(tab(ch, f, Math.cos));
        }
        s.off ??= document.createElement('canvas');
        s.off.width = cw; s.off.height = ch;
        s.octx = s.off.getContext('2d');
        s.img = s.octx.createImageData(cw, ch);
    },
    frame({ ctx }, p, s, dt) {
        if (s.pal !== p.palette) { s.lut = makeLut(p.palette); s.pal = p.palette; }
        s.t += p.speed * dt * 60;
        const c = Math.cos(s.t), sn = Math.sin(s.t), c2 = c * c, cs = c * sn, s2 = sn * sn;
        const { cw, ch, O, sx, cx, sy, cy, amp, tot, lut } = s, d = s.img.data;
        const U = new Float32Array(O), V = new Float32Array(O);
        let q = 0;
        for (let j = 0; j < ch; j++) {
            for (let o = 0; o < O; o++) {
                const sb = sy[o][j], cb = cy[o][j];
                U[o] = cb * c2 + sb * cs; V[o] = cb * cs + sb * s2;
            }
            for (let i = 0; i < cw; i++) {
                let v = 0;
                for (let o = 0; o < O; o++) v += amp[o] * (sx[o][i] * U[o] + cx[o][i] * V[o]);
                const k = Math.max(0, Math.min(255, ((v / tot + 1) * 127.5) | 0)) * 3;
                d[q++] = lut[k]; d[q++] = lut[k + 1]; d[q++] = lut[k + 2]; d[q++] = 255;
            }
        }
        s.octx.putImageData(s.img, 0, 0);
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(s.off, 0, 0, cw * p.cell, ch * p.cell);
    }
};