import { hexRgb, pixelBuffer } from '../core.js';

// Physarum (bolor limoso): cada agente tem três sensores à frente (esquerda, centro, direita), gira em
// direção ao rastro mais forte, anda um passo e deposita rastro. O mapa de rastro se espalha (blur) e
// evapora a cada passo. Dessa regra local surgem redes de transporte parecidas com as do organismo real.
const SCALE = 2; // 1 célula do mapa = 2x2 px CSS

export default {
    controls: [
        { id: 'count', label: 'Agentes (mil)', min: 5, max: 80, step: 5, value: 30, reset: true, random: false },
        { id: 'sensorAngle', label: 'Ângulo do sensor', min: 5, max: 90, value: 30 },
        { id: 'sensorDist', label: 'Distância do sensor', min: 2, max: 30, value: 9 },
        { id: 'turn', label: 'Ângulo de giro', min: 5, max: 90, value: 30 },
        { id: 'decay', label: 'Persistência do rastro', min: 0.5, max: 0.98, step: 0.01, value: 0.9 },
        { id: 'color', type: 'color', label: 'Cor', value: '#ffcc66' }
    ],
    setup({ w, h }, p, s) {
        const W = Math.ceil(w / SCALE), H = Math.ceil(h / SCALE), N = p.count * 1000, R = Math.min(W, H) * 0.4;
        Object.assign(s, { W, H, acc: 0, T: new Float32Array(W * H), tmp: new Float32Array(W * H),
            x: new Float32Array(N), y: new Float32Array(N), a: new Float32Array(N) });
        // Começa num disco com todos apontando para o centro: a rede "implode" e depois se ramifica
        for (let i = 0; i < N; i++) {
            const r = R * Math.sqrt(Math.random()), t = Math.random() * Math.PI * 2;
            s.x[i] = W / 2 + r * Math.cos(t); s.y[i] = H / 2 + r * Math.sin(t); s.a[i] = t + Math.PI;
        }
    },
    frame({ ctx, w, h }, p, s, dt) {
        const { W, H, x, y, a, T, tmp } = s, N = x.length, rad = Math.PI / 180;
        const SA = p.sensorAngle * rad, SD = p.sensorDist, RA = p.turn * rad;
        const sense = (px, py, ang) => {
            const sx = ((px + Math.cos(ang) * SD) % W + W) % W | 0, sy = ((py + Math.sin(ang) * SD) % H + H) % H | 0;
            return T[sy * W + sx];
        };
        s.acc += dt * 60;
        let steps = Math.min(3, s.acc | 0);
        s.acc -= steps;
        while (steps--) {
            for (let i = 0; i < N; i++) {
                let ang = a[i];
                const px = x[i], py = y[i], F = sense(px, py, ang), L = sense(px, py, ang - SA), R = sense(px, py, ang + SA);
                if (F > L && F > R) { /* segue reto */ }
                else if (F < L && F < R) ang += Math.random() < 0.5 ? RA : -RA;
                else if (L > R) ang -= RA;
                else if (R > L) ang += RA;
                const nx = (px + Math.cos(ang) + W) % W, ny = (py + Math.sin(ang) + H) % H;
                x[i] = nx; y[i] = ny; a[i] = ang;
                T[(ny | 0) * W + (nx | 0)] += 1;
            }
            // Blur 3x3 separável (com wrap) + evaporação
            for (let j = 0; j < H; j++) {
                const r = j * W;
                for (let i = 0; i < W; i++) tmp[r + i] = T[r + (i ? i - 1 : W - 1)] + T[r + i] + T[r + (i < W - 1 ? i + 1 : 0)];
            }
            const k = p.decay / 9;
            for (let j = 0; j < H; j++) {
                const r = j * W, ru = (j ? j - 1 : H - 1) * W, rd = (j < H - 1 ? j + 1 : 0) * W;
                for (let i = 0; i < W; i++) T[r + i] = (tmp[ru + i] + tmp[r + i] + tmp[rd + i]) * k;
            }
        }

        const buf = pixelBuffer(s, W, H), d = buf.img.data, [r, g, b] = hexRgb(p.color);
        for (let i = 0, q = 0; i < T.length; i++, q += 4) {
            const t = T[i], f = t / (t + 1.5); // satura suavemente em vez de estourar
            d[q] = r * f; d[q + 1] = g * f; d[q + 2] = b * f; d[q + 3] = 255;
        }
        buf.octx.putImageData(buf.img, 0, 0);
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(buf.off, 0, 0, W * SCALE, H * SCALE);
    }
};
