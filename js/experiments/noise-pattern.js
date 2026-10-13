export function initNoisePattern(canvas, controlsContainer) {
    const ctx = canvas.getContext('2d');

    const params = {
        scale: 40,
        complexity: 3,
        speed: 0.02,
        colorScheme: 'cyber' // 'cyber', 'fire', 'mono'
    };

    let animationFrameId;
    let time = 0;

    // Resolução menor para processamento rápido no canvas
    const resolution = 8;
    
    canvas.width = canvas.parentElement.clientWidth - 40;
    canvas.height = canvas.parentElement.clientHeight - 40;

    const cols = Math.floor(canvas.width / resolution);
    const rows = Math.floor(canvas.height / resolution);

    // 1. Controles na Sidebar
    controlsContainer.innerHTML = `
        <div class="control-group">
            <label>Escala: <span id="val-scale">${params.scale}</span></label>
            <input type="range" id="param-scale" min="10" max="100" step="5" value="${params.scale}">
        </div>
        <div class="control-group">
            <label>Complexidade: <span id="val-complexity">${params.complexity}</span></label>
            <input type="range" id="param-complexity" min="1" max="6" step="1" value="${params.complexity}">
        </div>
        <div class="control-group">
            <label>Velocidade: <span id="val-speed">${params.speed}</span></label>
            <input type="range" id="param-speed" min="0.005" max="0.08" step="0.005" value="${params.speed}">
        </div>
        <div class="control-group">
            <label>Paleta de Cores</label>
            <select id="param-palette">
                <option value="cyber">Cyberpunk (Cyan/Magenta)</option>
                <option value="fire">Chama (Laranja/Vermelho)</option>
                <option value="mono">Monocromático</option>
            </select>
        </div>
    `;

    // 2. Eventos
    controlsContainer.addEventListener('input', (e) => {
        const id = e.target.id;
        const val = e.target.value;

        if (id === 'param-scale') {
            params.scale = parseInt(val);
            document.getElementById('val-scale').innerText = val;
        } else if (id === 'param-complexity') {
            params.complexity = parseInt(val);
            document.getElementById('val-complexity').innerText = val;
        } else if (id === 'param-speed') {
            params.speed = parseFloat(val);
            document.getElementById('val-speed').innerText = val;
        } else if (id === 'param-palette') {
            params.colorScheme = val;
        }
    });

    // Função pseudo-ruído baseada em interferência harmônica
    function getNoise(x, y, t) {
        let value = 0;
        let frequency = 1;
        let amplitude = 1;
        let totalAmplitude = 0;

        for (let i = 0; i < params.complexity; i++) {
            value += Math.sin(x * frequency * 0.01 + t) * Math.cos(y * frequency * 0.01 - t) * amplitude;
            totalAmplitude += amplitude;
            amplitude *= 0.5;
            frequency *= 2;
        }

        return (value / totalAmplitude + 1) / 2; // Normaliza entre 0 e 1
    }

    // 3. Loop de Renderização
    function draw() {
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        time += params.speed;

        for (let i = 0; i < cols; i++) {
            for (let j = 0; j < rows; j++) {
                const x = i * resolution;
                const y = j * resolution;
                
                const n = getNoise(x, y, time);
                
                // Mapeia cor com base na paleta escolhida
                let r = 0, g = 0, b = 0;
                if (params.colorScheme === 'cyber') {
                    r = Math.floor(n * 255);
                    g = Math.floor((1 - n) * 200);
                    b = 255;
                } else if (params.colorScheme === 'fire') {
                    r = 255;
                    g = Math.floor(n * 150);
                    b = Math.floor((1 - n) * 50);
                } else {
                    const c = Math.floor(n * 255);
                    r = c; g = c; b = c;
                }

                ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
                ctx.fillRect(x, y, resolution - 1, resolution - 1);
            }
        }

        animationFrameId = requestAnimationFrame(draw);
    }

    draw();

    return function cleanup() {
        cancelAnimationFrame(animationFrameId);
    };
}