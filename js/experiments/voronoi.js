export function initVoronoi(canvas, controlsContainer) {
    const ctx = canvas.getContext('2d');
    const params = { count: 35, speed: 1, color: '#ffaa00' };
    let animationFrameId, points = [];

    canvas.width = canvas.parentElement.clientWidth - 40;
    canvas.height = canvas.parentElement.clientHeight - 40;

    for (let i = 0; i < params.count; i++) {
        points.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * params.speed,
            vy: (Math.random() - 0.5) * params.speed
        });
    }

    controlsContainer.innerHTML = `
        <div class="control-group"><label>Pontos: <span id="val-count">${params.count}</span></label><input type="range" id="param-count" min="10" max="80" step="5" value="${params.count}"></div>
        <div class="control-group"><label>Cor</label><input type="color" id="param-color" value="${params.color}"></div>
    `;

    controlsContainer.addEventListener('input', (e) => {
        if (e.target.id === 'param-color') { params.color = e.target.value; }
    });

    function draw() {
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        points.forEach(p => {
            p.x += p.vx; p.y += p.vy;
            if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
            if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        });

        // Desenha pontos conectados em rede estilo Delaunay/Voronoi simples
        ctx.strokeStyle = params.color;
        ctx.lineWidth = 1;
        for (let i = 0; i < points.length; i++) {
            for (let j = i + 1; j < points.length; j++) {
                let d = Math.hypot(points[i].x - points[j].x, points[i].y - points[j].y);
                if (d < 120) {
                    ctx.strokeStyle = params.color + Math.floor((1 - d/120) * 255).toString(16).padStart(2, '0');
                    ctx.beginPath();
                    ctx.moveTo(points[i].x, points[i].y);
                    ctx.lineTo(points[j].x, points[j].y);
                    ctx.stroke();
                }
            }
        }

        animationFrameId = requestAnimationFrame(draw);
    }
    draw();

    return () => cancelAnimationFrame(animationFrameId);
}