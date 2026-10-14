// Boids (Reynolds, 1986): cada pássaro só enxerga vizinhos próximos e segue três regras —
// separação (não colidir), alinhamento (voar na direção média) e coesão (ir para o centro do grupo).
// Vizinhos são buscados numa grade espacial (lista ligada por célula) em vez de testar todos os pares.
export default {
    thumb: { params: { count: 80, vision: 30 }, warmup: 120 }, // miniatura da galeria
    controls: [
        { id: 'count', label: 'Pássaros', min: 50, max: 1000, step: 50, value: 400, reset: true },
        { id: 'vision', label: 'Raio de visão', min: 20, max: 100, step: 5, value: 50 },
        { id: 'separation', label: 'Separação', min: 0, max: 3, step: 0.1, value: 1.5 },
        { id: 'alignment', label: 'Alinhamento', min: 0, max: 3, step: 0.1, value: 1 },
        { id: 'cohesion', label: 'Coesão', min: 0, max: 3, step: 0.1, value: 1 },
        { id: 'speed', label: 'Velocidade máx.', min: 1, max: 6, step: 0.5, value: 3 },
        { id: 'color', type: 'color', label: 'Cor', value: '#ffffff' }
    ],
    setup({ w, h }, p, s) {
        const N = p.count;
        Object.assign(s, { x: new Float32Array(N), y: new Float32Array(N), vx: new Float32Array(N), vy: new Float32Array(N),
            nvx: new Float32Array(N), nvy: new Float32Array(N), next: new Int32Array(N) });
        for (let i = 0; i < N; i++) {
            const a = Math.random() * Math.PI * 2;
            s.x[i] = Math.random() * w; s.y[i] = Math.random() * h;
            s.vx[i] = Math.cos(a) * p.speed; s.vy[i] = Math.sin(a) * p.speed;
        }
    },
    frame({ ctx, w, h }, p, s, dt) {
        const { x, y, vx, vy, nvx, nvy, next } = s, N = x.length, R = p.vision, R2 = R * R, S2 = R2 / 4, v = dt * 60;

        if (v > 0) {
            // Grade com células >= raio de visão: os vizinhos estão sempre nas 3x3 células ao redor
            const gx = Math.max(1, (w / R) | 0), gy = Math.max(1, (h / R) | 0), sx = gx / w, sy = gy / h;
            const head = new Int32Array(gx * gy).fill(-1);
            for (let i = 0; i < N; i++) {
                const c = Math.min(gy - 1, (y[i] * sy) | 0) * gx + Math.min(gx - 1, (x[i] * sx) | 0);
                next[i] = head[c]; head[c] = i;
            }
            const cells = [];
            for (let i = 0; i < N; i++) {
                const xi = x[i], yi = y[i], cx = Math.min(gx - 1, (xi * sx) | 0), cy = Math.min(gy - 1, (yi * sy) | 0);
                cells.length = 0;
                for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) {
                    const c = ((cy + oy + gy) % gy) * gx + (cx + ox + gx) % gx;
                    if (!cells.includes(c)) cells.push(c); // grades pequenas: não visitar a mesma célula 2x
                }
                let n = 0, avx = 0, avy = 0, px = 0, py = 0, sepx = 0, sepy = 0;
                for (const c of cells) for (let j = head[c]; j !== -1; j = next[j]) {
                    if (j === i) continue;
                    let dx = x[j] - xi, dy = y[j] - yi;
                    // Mundo toroidal: usa o caminho mais curto pela borda
                    if (dx > w / 2) dx -= w; else if (dx < -w / 2) dx += w;
                    if (dy > h / 2) dy -= h; else if (dy < -h / 2) dy += h;
                    const d2 = dx * dx + dy * dy;
                    if (d2 > R2 || d2 === 0) continue;
                    n++; avx += vx[j]; avy += vy[j]; px += dx; py += dy;
                    if (d2 < S2) { sepx -= dx / d2; sepy -= dy / d2; }
                }
                let ax = 0, ay = 0;
                if (n) {
                    ax = (avx / n - vx[i]) * 0.05 * p.alignment + (px / n) * 0.002 * p.cohesion + sepx * 1.5 * p.separation;
                    ay = (avy / n - vy[i]) * 0.05 * p.alignment + (py / n) * 0.002 * p.cohesion + sepy * 1.5 * p.separation;
                }
                let nx = vx[i] + ax * v, ny = vy[i] + ay * v;
                const sp = Math.hypot(nx, ny) || 1, lim = Math.min(p.speed, Math.max(p.speed * 0.5, sp)) / sp;
                nvx[i] = nx * lim; nvy[i] = ny * lim;
            }
            for (let i = 0; i < N; i++) {
                vx[i] = nvx[i]; vy[i] = nvy[i];
                x[i] = (x[i] + vx[i] * v + w) % w; y[i] = (y[i] + vy[i] * v + h) % h;
            }
        }

        ctx.fillStyle = 'rgba(0,0,0,0.3)'; // fundo semitransparente deixa um rastro curto
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        for (let i = 0; i < N; i++) {
            const sp = Math.hypot(vx[i], vy[i]) || 1, ux = vx[i] / sp, uy = vy[i] / sp;
            ctx.moveTo(x[i] + ux * 7, y[i] + uy * 7);
            ctx.lineTo(x[i] - ux * 4 - uy * 3, y[i] - uy * 4 + ux * 3);
            ctx.lineTo(x[i] - ux * 4 + uy * 3, y[i] - uy * 4 - ux * 3);
            ctx.closePath();
        }
        ctx.fill();
    }
};
