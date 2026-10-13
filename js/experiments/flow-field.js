export default {
    controls: [
        { id: 'count', label: 'Partículas', min: 200, max: 3000, step: 100, value: 1000, reset: true },
        { id: 'speed', label: 'Velocidade', min: 0.5, max: 5, step: 0.5, value: 2 },
        { id: 'scale', label: 'Escala do campo', min: 1, max: 15, value: 5 },
        { id: 'trail', label: 'Fade do rastro', min: 0.01, max: 0.2, step: 0.01, value: 0.05 },
        { id: 'color', type: 'color', label: 'Cor', value: '#00ffcc' }
    ],
    setup({ ctx, w, h }, p, s) {
        s.t ??= 0;
        s.pts = new Float32Array(p.count * 2).map((_, i) => Math.random() * (i % 2 ? h : w));
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, w, h);
    },
    frame({ ctx, w, h }, p, s, dt) {
        const k = p.scale * 0.001, v = p.speed * dt * 60, P = s.pts;
        s.t += dt * 0.1; // o campo evolui lentamente
        ctx.fillStyle = `rgba(0,0,0,${p.trail})`;
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = p.color;
        ctx.beginPath(); // todas as partículas num único fill
        for (let i = 0; i < P.length; i += 2) {
            let x = P[i], y = P[i + 1];
            const a = (Math.cos(x * k + s.t) + Math.sin(y * k - s.t)) * Math.PI * 2;
            x += Math.cos(a) * v; y += Math.sin(a) * v;
            if (x < 0 || x > w || y < 0 || y > h) { x = Math.random() * w; y = Math.random() * h; }
            P[i] = x; P[i + 1] = y;
            ctx.rect(x, y, 1.5, 1.5);
        }
        ctx.fill();
    }
};