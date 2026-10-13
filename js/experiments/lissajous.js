export function initLissajous(canvas, controlsContainer) {
    const ctx = canvas.getContext('2d');
    const params = { freqX: 3, freqY: 4, delta: Math.PI / 2, color: '#00ffff' };
    let animationFrameId, time = 0;

    canvas.width = canvas.parentElement.clientWidth - 40;
    canvas.height = canvas.parentElement.clientHeight - 40;

    controlsContainer.innerHTML = `
        <div class="control-group"><label>Freq X: <span id="val-fx">${params.freqX}</span></label><input type="range" id="param-fx" min="1" max="10" step="1" value="${params.freqX}"></div>
        <div class="control-group"><label>Freq Y: <span id="val-fy">${params.freqY}</span></label><input type="range" id="param-fy" min="1" max="10" step="1" value="${params.freqY}"></div>
        <div class="control-group"><label>Cor</label><input type="color" id="param-color" value="${params.color}"></div>
    `;

    controlsContainer.addEventListener('input', (e) => {
        if (e.target.id === 'param-fx') { params.freqX = parseInt(e.target.value); document.getElementById('val-fx').innerText = e.target.value; }
        if (e.target.id === 'param-fy') { params.freqY = parseInt(e.target.value); document.getElementById('val-fy').innerText = e.target.value; }
        if (e.target.id === 'param-color') { params.color = e.target.value; }
    });

    function draw() {
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        const radius = Math.min(cx, cy) * 0.8;

        time += 0.01;
        ctx.strokeStyle = params.color;
        ctx.lineWidth = 2;
        ctx.beginPath();

        for (let a = 0; a < Math.PI * 2; a += 0.01) {
            let x = cx + radius * Math.sin(params.freqX * a + time + params.delta);
            let y = cy + radius * Math.sin(params.freqY * a);
            if (a === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();

        animationFrameId = requestAnimationFrame(draw);
    }
    draw();

    return () => cancelAnimationFrame(animationFrameId);
}