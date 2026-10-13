export function initParticleSystem(canvas, controlsContainer) {
    const ctx = canvas.getContext('2d');

    const params = {
        count: 150,
        speed: 1.5,
        connectionDistance: 100,
        particleColor: '#00ffcc',
        lineColor: 'rgba(0, 255, 204, 0.15)',
        particleSize: 2
    };

    let animationFrameId;
    let particles = [];

    canvas.width = canvas.parentElement.clientWidth - 40;
    canvas.height = canvas.parentElement.clientHeight - 40;

    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.vx = (Math.random() - 0.5) * params.speed;
            this.vy = (Math.random() - 0.5) * params.speed;
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;

            if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
            if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
        }

        draw() {
            ctx.fillStyle = params.particleColor;
            ctx.beginPath();
            ctx.arc(this.x, this.y, params.particleSize, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function initParticles() {
        particles = [];
        for (let i = 0; i < params.count; i++) {
            particles.push(new Particle());
        }
    }

    // 1. Controles na Sidebar
    controlsContainer.innerHTML = `
        <div class="control-group">
            <label>Partículas: <span id="val-count">${params.count}</span></label>
            <input type="range" id="param-count" min="50" max="400" step="10" value="${params.count}">
        </div>
        <div class="control-group">
            <label>Velocidade: <span id="val-speed">${params.speed}</span></label>
            <input type="range" id="param-speed" min="0.5" max="4" step="0.5" value="${params.speed}">
        </div>
        <div class="control-group">
            <label>Distância de Conexão: <span id="val-dist">${params.connectionDistance}</span></label>
            <input type="range" id="param-dist" min="50" max="200" step="10" value="${params.connectionDistance}">
        </div>
        <div class="control-group">
            <label>Cor</label>
            <input type="color" id="param-color" value="${params.particleColor}">
        </div>
    `;

    // 2. Eventos
    controlsContainer.addEventListener('input', (e) => {
        const id = e.target.id;
        const val = e.target.value;

        if (id === 'param-count') {
            params.count = parseInt(val);
            document.getElementById('val-count').innerText = val;
            initParticles();
        } else if (id === 'param-speed') {
            params.speed = parseFloat(val);
            document.getElementById('val-speed').innerText = val;
            particles.forEach(p => {
                const angle = Math.atan2(p.vy, p.vx);
                p.vx = Math.cos(angle) * params.speed;
                p.vy = Math.sin(angle) * params.speed;
            });
        } else if (id === 'param-dist') {
            params.connectionDistance = parseInt(val);
            document.getElementById('val-dist').innerText = val;
        } else if (id === 'param-color') {
            params.particleColor = val;
            params.lineColor = val + '26'; // adiciona opacidade hex (~15%)
        }
    });

    initParticles();

    // 3. Loop
    function draw() {
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        for (let i = 0; i < particles.length; i++) {
            particles[i].update();
            particles[i].draw();

            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < params.connectionDistance) {
                    ctx.strokeStyle = params.lineColor;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                }
            }
        }

        animationFrameId = requestAnimationFrame(draw);
    }

    draw();

    return function cleanup() {
        cancelAnimationFrame(animationFrameId);
    };
}