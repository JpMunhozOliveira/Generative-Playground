// Antes: translate/save/restore + stroke por galho (até 4096 strokes/frame).
// Agora: coordenadas explícitas e um stroke por nível de profundidade.
export default {
    controls: [
        { id: 'depth', label: 'Profundidade', min: 4, max: 12, value: 10 },
        { id: 'angle', label: 'Ângulo', min: 5, max: 60, value: 25 },
        { id: 'wind', label: 'Vento', min: 0, max: 15, step: 0.5, value: 5 },
        { id: 'color', type: 'color', label: 'Cor', value: '#00ffaa' }
    ],
    setup(rt, p, s) { s.w ??= 0; },
    frame({ ctx, w, h }, p, s, dt) {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, w, h);
        s.w += dt * 1.2;
        const paths = Array.from({ length: p.depth + 1 }, () => new Path2D()), rad = Math.PI / 180;
        (function branch(x, y, ang, len, d) {
            if (!d) return;
            const x2 = x + Math.sin(ang) * len, y2 = y - Math.cos(ang) * len;
            paths[d].moveTo(x, y); paths[d].lineTo(x2, y2);
            const r = (p.angle + Math.sin(s.w + d) * p.wind) * rad;
            branch(x2, y2, ang + r, len * 0.67, d - 1);
            branch(x2, y2, ang - r, len * 0.67, d - 1);
        })(w / 2, h - 50, 0, h * 0.17, p.depth);

        ctx.strokeStyle = p.color;
        ctx.lineCap = 'round';
        for (let d = p.depth; d > 0; d--) {
            ctx.lineWidth = 0.5 + d * 0.25;
            ctx.stroke(paths[d]);
        }
    }
};