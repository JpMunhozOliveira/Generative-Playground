export default {
    controls: [
        { id: 'petals', label: 'Pétalas', min: 3, max: 36, value: 12 },
        { id: 'layers', label: 'Camadas', min: 1, max: 10, value: 5 },
        { id: 'speed', label: 'Velocidade Rotação', min: 0, max: 0.02, step: 0.001, value: 0.005 },
        { id: 'lineWidth', label: 'Espessura Linha', min: 0.5, max: 5, step: 0.5, value: 1.5 },
        { id: 'color', type: 'color', label: 'Cor', value: '#00ffcc' }
    ],
    setup(rt, p, s) { s.a ??= 0; },
    frame({ ctx, w, h }, p, s, dt) {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, w, h);
        s.a += p.speed * dt * 60;
        const R = Math.min(w, h) / 2 * 0.8, step = Math.PI * 2 / p.petals;

        ctx.save();
        ctx.translate(w / 2, h / 2);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.lineWidth;
        ctx.beginPath(); // um único path e um único stroke para tudo
        for (let i = 0; i < p.petals; i++) {
            ctx.save();
            ctx.rotate(i * step + s.a);
            for (let l = 1; l <= p.layers; l++) {
                const r = R / p.layers * l, wave = Math.sin(s.a * 2 + l) * 20;
                ctx.moveTo(0, 0);
                ctx.quadraticCurveTo(r / 2 + wave, r / 2, 0, r);
                ctx.quadraticCurveTo(-r / 2 - wave, r / 2, 0, 0);
            }
            ctx.restore();
        }
        ctx.stroke();
        ctx.restore();
    }
};