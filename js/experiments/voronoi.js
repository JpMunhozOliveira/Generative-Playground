import { hexA } from '../core.js';

// Mantém o semiplano dos pontos mais próximos de (ax,ay) do que de (bx,by) (Sutherland–Hodgman).
function clip(poly, ax, ay, bx, by) {
    const nx = bx - ax, ny = by - ay, c = nx * (ax + bx) / 2 + ny * (ay + by) / 2, out = [];
    for (let i = 0; i < poly.length; i++) {
        const P = poly[i], Q = poly[(i + 1) % poly.length];
        const dp = nx * P[0] + ny * P[1] - c, dq = nx * Q[0] + ny * Q[1] - c;
        if (dp <= 0) out.push(P);
        if ((dp < 0 && dq > 0) || (dp > 0 && dq < 0)) {
            const t = dp / (dp - dq);
            out.push([P[0] + (Q[0] - P[0]) * t, P[1] + (Q[1] - P[1]) * t]);
        }
    }
    return out;
}

// Cada célula começa como o retângulo da tela e é recortada pelo semiplano de cada outro ponto.
// O(n²) recortes por frame, simples e rápido o bastante para até ~80 pontos.
export default {
    thumb: { params: { count: 15 } }, // miniatura da galeria
    controls: [
        { id: 'count', label: 'Pontos', min: 10, max: 80, step: 5, value: 35, reset: true },
        { id: 'speed', label: 'Velocidade', min: 0, max: 3, step: 0.1, value: 0.6 },
        { id: 'color', type: 'color', label: 'Cor', value: '#ffaa00' }
    ],
    setup({ w, h }, p, s) {
        s.pts = Array.from({ length: p.count }, (_, i) => {
            const a = Math.random() * Math.PI * 2;
            return { x: Math.random() * w, y: Math.random() * h, dx: Math.cos(a), dy: Math.sin(a), tone: i % 4 };
        });
    },
    frame({ ctx, w, h }, p, s, dt) {
        const pts = s.pts, v = p.speed * dt * 60;
        for (const q of pts) {
            q.x += q.dx * v; q.y += q.dy * v;
            if (q.x < 0 || q.x > w) q.dx *= -1;
            if (q.y < 0 || q.y > h) q.dy *= -1;
        }
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, w, h);

        const fills = [0, 1, 2, 3].map(i => hexA(p.color, 0.04 + i * 0.05)), edges = new Path2D();
        for (const a of pts) {
            let poly = [[0, 0], [w, 0], [w, h], [0, h]];
            for (const b of pts) {
                if (a === b) continue;
                poly = clip(poly, a.x, a.y, b.x, b.y);
                if (!poly.length) break;
            }
            if (poly.length < 3) continue;
            const path = new Path2D();
            poly.forEach(([x, y], i) => i ? path.lineTo(x, y) : path.moveTo(x, y));
            path.closePath();
            ctx.fillStyle = fills[a.tone];
            ctx.fill(path);
            edges.addPath(path);
        }
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1;
        ctx.stroke(edges);

        ctx.fillStyle = '#fff';
        ctx.beginPath();
        for (const a of pts) { ctx.moveTo(a.x + 2, a.y); ctx.arc(a.x, a.y, 2, 0, Math.PI * 2); }
        ctx.fill();
    }
};