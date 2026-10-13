export function initFlowField(canvas, controlsContainer) {
    const ctx = canvas.getContext('2d');
    const params = { count: 800, speed: 2, scale: 0.005, strokeColor: '#00ffcc' };
    let animationFrameId, particles = [];

    canvas.width = canvas.parentElement.clientWidth - 40;
    canvas.height = canvas.parentElement.clientHeight - 40;

    class FlowParticle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.vx = 0; this.vy = 0;
        }
        update() {
            const angle = (Math.cos(this.x * params.scale) + Math.sin(this.y * params.scale)) * Math.PI * 2;
            this.vx = Math.cos(angle) * params.speed;
            this.vy = Math.sin(angle) * params.speed;
            this.x += this.vx;
            this.y += this.vy;

            if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
            }
        }
        draw() {
            ctx.fillStyle = params.strokeColor;
            ctx.fillRect(this.x, this.y, 1.5, 1.5);
        }
    }

    function init() {
        particles = [];
        for (let i = 0; i < params.count; i++) particles.push(new FlowParticle());
    }

    controlsContainer.innerHTML = `
        <div class="control-group"><label>Partículas: <span id="val-count">${params.count}</span></label><input type="range" id="param-count" min="200" max="2000" step="100" value="${params.count}"></div>
        <div class="control-group"><label>Velocidade: <span id="val-speed">${params.speed}</span></label><input type="range" id="param-speed" min="0.5" max="5" step="0.5" value="${params.speed}"></div>
        <div class="control-group"><label>Cor</label><input type="color" id="param-color" value="${params.strokeColor}"></div>
    `;

    controlsContainer.addEventListener('input', (e) => {
        if (e.target.id === 'param-count') { params.count = parseInt(e.target.value); document.getElementById('val-count').innerText = e.target.value; init(); }
        if (e.target.id === 'param-speed') { params.speed = parseFloat(e.target.value); document.getElementById('val-speed').innerText = e.target.value; }
        if (e.target.id === 'param-color') { params.strokeColor = e.target.value; }
    });

    init();
    function draw() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)'; // Efeito de rastro
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => { p.update(); p.draw(); });
        animationFrameId = requestAnimationFrame(draw);
    }
    draw();

    return () => cancelAnimationFrame(animationFrameId);
}