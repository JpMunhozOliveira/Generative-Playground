export default {
    thumb: { params: { count: 40, dist: 45 } }, // miniatura da galeria
    controls: [
        { id: 'count', label: 'Partículas', min: 50, max: 400, step: 10, value: 150, reset: true },
        { id: 'speed', label: 'Velocidade', min: 0.5, max: 4, step: 0.5, value: 1.5 },
        { id: 'dist', label: 'Distância de Conexão', min: 50, max: 200, step: 10, value: 100 },
        { id: 'color', type: 'color', label: 'Cor', value: '#00ffcc' }
    ],
    setup({ w, h }, p, s) {
        s.pts = Array.from({ length: p.count }, () => {
            const a = Math.random() * Math.PI * 2;
            return { x: Math.random() * w, y: Math.random() * h, dx: Math.cos(a), dy: Math.sin(a) };
        });
    },
    frame({ ctx, w, h }, p, s, dt) {
        const pts = s.pts, n = pts.length, v = p.speed * dt * 60, D2 = p.dist * p.dist;
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, w, h);

        for (const q of pts) {
            q.x += q.dx * v; q.y += q.dy * v;
            if (q.x < 0 || q.x > w) q.dx *= -1;
            if (q.y < 0 || q.y > h) q.dy *= -1;
        }

        // Linhas agrupadas em 3 níveis de opacidade -> 3 strokes em vez de milhares
        const buckets = [new Path2D(), new Path2D(), new Path2D()];
        for (let i = 0; i < n; i++) {
            const a = pts[i];
            for (let j = i + 1; j < n; j++) {
                const b = pts[j], dx = a.x - b.x, dy = a.y - b.y, d2 = dx * dx + dy * dy; // sem sqrt
                if (d2 < D2) {
                    const path = buckets[Math.min(2, (3 * (1 - d2 / D2)) | 0)];
                    path.moveTo(a.x, a.y); path.lineTo(b.x, b.y);
                }
            }
        }
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1;
        [0.08, 0.22, 0.45].forEach((alpha, k) => { ctx.globalAlpha = alpha; ctx.stroke(buckets[k]); });
        ctx.globalAlpha = 1;

        ctx.fillStyle = p.color;
        ctx.beginPath();
        for (const q of pts) { ctx.moveTo(q.x + 2, q.y); ctx.arc(q.x, q.y, 2, 0, Math.PI * 2); }
        ctx.fill();
    }
};