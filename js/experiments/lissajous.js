export default {
    controls: [
        { id: 'fx', label: 'Freq X', min: 1, max: 10, value: 3 },
        { id: 'fy', label: 'Freq Y', min: 1, max: 10, value: 4 },
        { id: 'delta', label: 'Fase', min: 0, max: 6.28, step: 0.05, value: 1.57 },
        { id: 'speed', label: 'Velocidade', min: 0, max: 2, step: 0.1, value: 0.6 },
        { id: 'color', type: 'color', label: 'Cor', value: '#00ffff' }
    ],
    setup(rt, p, s) { s.t ??= 0; },
    frame({ ctx, w, h }, p, s, dt) {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, w, h);
        s.t += p.speed * dt;
        const cx = w / 2, cy = h / 2, R = Math.min(cx, cy) * 0.8, N = 1200, k = Math.PI * 2 / N;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i <= N; i++) {
            const a = i * k, x = cx + R * Math.sin(p.fx * a + s.t + p.delta), y = cy + R * Math.sin(p.fy * a);
            i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        }
        ctx.stroke();
    }
};