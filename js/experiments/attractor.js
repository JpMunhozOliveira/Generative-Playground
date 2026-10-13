import { hexRgb } from '../core.js';

// Atrator de Clifford. Antes: 50.000 iterações + 50.000 rects A CADA FRAME, mesmo parado.
// Agora: calcula só quando um parâmetro muda e renderiza por densidade (histograma + log).
export default {
    static: true,
    controls: [
        { id: 'a', label: 'Parâmetro A', min: -2, max: 2, step: 0.05, value: -1.4 },
        { id: 'b', label: 'Parâmetro B', min: -2, max: 2, step: 0.05, value: 1.6 },
        { id: 'c', label: 'Parâmetro C', min: -2, max: 2, step: 0.05, value: 1.0 },
        { id: 'd', label: 'Parâmetro D', min: -2, max: 2, step: 0.05, value: 0.7 },
        { id: 'count', label: 'Iterações (mil)', min: 50, max: 1000, step: 50, value: 300 },
        { id: 'color', type: 'color', label: 'Cor', value: '#ff007f' }
    ],
    frame({ ctx, w, h }, p, s) {
        const W = Math.floor(w), H = Math.floor(h);
        if (!s.off || s.off.width !== W || s.off.height !== H) {
            s.off = Object.assign(document.createElement('canvas'), { width: W, height: H });
            s.octx = s.off.getContext('2d');
            s.img = s.octx.createImageData(W, H);
            s.hist = new Uint32Array(W * H);
        }
        const hist = s.hist.fill(0);
        const sc = Math.min(W, H) / (2 * (1 + Math.max(Math.abs(p.c), Math.abs(p.d)))) * 0.95;
        const cx = W / 2, cy = H / 2, N = p.count * 1000;
        let x = 0.1, y = 0.1, max = 1;
        for (let i = -100; i < N; i++) {
            const xn = Math.sin(p.a * y) + p.c * Math.cos(p.a * x);
            y = Math.sin(p.b * x) + p.d * Math.cos(p.b * y);
            x = xn;
            if (i < 0) continue;
            const px = (cx + x * sc) | 0, py = (cy + y * sc) | 0;
            if (px >= 0 && px < W && py >= 0 && py < H && ++hist[py * W + px] > max) max = hist[py * W + px];
        }
        const [r, g, b] = hexRgb(p.color), d = s.img.data, lm = 1 / Math.log(1 + max);
        for (let k = 0, q = 0; k < hist.length; k++, q += 4) {
            const n = hist[k];
            d[q] = r; d[q + 1] = g; d[q + 2] = b;
            d[q + 3] = n ? Math.min(255, 50 + 205 * Math.log(1 + n) * lm) : 0;
        }
        s.octx.putImageData(s.img, 0, 0);
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(s.off, 0, 0);
    }
};