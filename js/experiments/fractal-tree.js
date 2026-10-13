export function initFractalTree(canvas, controlsContainer) {
    const ctx = canvas.getContext('2d');
    const params = { depth: 10, angle: 25, length: 120, color: '#00ffaa' };
    let animationFrameId, wind = 0;

    canvas.width = canvas.parentElement.clientWidth - 40;
    canvas.height = canvas.parentElement.clientHeight - 40;

    controlsContainer.innerHTML = `
        <div class="control-group"><label>Profundidade: <span id="val-depth">${params.depth}</span></label><input type="range" id="param-depth" min="4" max="12" step="1" value="${params.depth}"></div>
        <div class="control-group"><label>Ângulo: <span id="val-angle">${params.angle}</span>°</label><input type="range" id="param-angle" min="5" max="60" step="1" value="${params.angle}"></div>
        <div class="control-group"><label>Cor</label><input type="color" id="param-color" value="${params.color}"></div>
    `;

    controlsContainer.addEventListener('input', (e) => {
        if (e.target.id === 'param-depth') { params.depth = parseInt(e.target.value); document.getElementById('val-depth').innerText = e.target.value; }
        if (e.target.id === 'param-angle') { params.angle = parseInt(e.target.value); document.getElementById('val-angle').innerText = e.target.value; }
        if (e.target.id === 'param-color') { params.color = e.target.value; }
    });

    function branch(len, depth) {
        if (depth === 0) return;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -len);
        ctx.stroke();

        ctx.translate(0, -len);

        const rad = (params.angle + Math.sin(wind + depth) * 5) * Math.PI / 180;

        ctx.save();
        ctx.rotate(rad);
        branch(len * 0.67, depth - 1);
        ctx.restore();

        ctx.save();
        ctx.rotate(-rad);
        branch(len * 0.67, depth - 1);
        ctx.restore();

        ctx.translate(0, len);
    }

    function draw() {
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        wind += 0.02;
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height - 50);
        ctx.strokeStyle = params.color;
        ctx.lineWidth = 2;
        branch(params.length, params.depth);
        ctx.restore();

        animationFrameId = requestAnimationFrame(draw);
    }
    draw();

    return () => cancelAnimationFrame(animationFrameId);
}