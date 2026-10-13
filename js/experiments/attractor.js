export function initAttractor(canvas, controlsContainer) {
    const ctx = canvas.getContext('2d');
    const params = { a: -1.4, b: 1.6, c: 1.0, d: 0.7, count: 50000, color: '#ff007f' };
    let animationFrameId;

    canvas.width = canvas.parentElement.clientWidth - 40;
    canvas.height = canvas.parentElement.clientHeight - 40;

    controlsContainer.innerHTML = `
        <div class="control-group"><label>Parâmetro A: <span id="val-a">${params.a}</span></label><input type="range" id="param-a" min="-2" max="2" step="0.1" value="${params.a}"></div>
        <div class="control-group"><label>Parâmetro B: <span id="val-b">${params.b}</span></label><input type="range" id="param-b" min="-2" max="2" step="0.1" value="${params.b}"></div>
        <div class="control-group"><label>Cor</label><input type="color" id="param-color" value="${params.color}"></div>
    `;

    controlsContainer.addEventListener('input', (e) => {
        if (e.target.id === 'param-a') { params.a = parseFloat(e.target.value); document.getElementById('val-a').innerText = e.target.value; }
        if (e.target.id === 'param-b') { params.b = parseFloat(e.target.value); document.getElementById('val-b').innerText = e.target.value; }
        if (e.target.id === 'param-color') { params.color = e.target.value; }
    });

    function draw() {
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        let x = 0.1, y = 0.1;
        const scale = Math.min(canvas.width, canvas.height) / 4;
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;

        ctx.fillStyle = params.color;
        ctx.beginPath();
        for (let i = 0; i < params.count; i++) {
            let xn = Math.sin(params.a * y) + params.c * Math.cos(params.a * x);
            let yn = Math.sin(params.b * x) + params.d * Math.cos(params.b * y);
            x = xn; y = yn;

            let px = cx + x * scale;
            let py = cy + y * scale;
            ctx.rect(px, py, 1, 1);
        }
        ctx.fill();

        animationFrameId = requestAnimationFrame(draw);
    }
    draw();

    return () => cancelAnimationFrame(animationFrameId);
}