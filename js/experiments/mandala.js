export function initMandala(canvas, controlsContainer) {
    const ctx = canvas.getContext('2d');
    
    // Parâmetros do Experimento
    const params = {
        petals: 12,
        layers: 5,
        speed: 0.005,
        strokeColor: '#00ffcc',
        lineWidth: 1.5,
        zoom: 0.8
    };

    let animationFrameId;
    let angleOffset = 0;

    // Configura tamanho do canvas para caber no viewport
    canvas.width = canvas.parentElement.clientWidth - 40;
    canvas.height = canvas.parentElement.clientHeight - 40;

    // 1. Injeta os Controles na Sidebar
    controlsContainer.innerHTML = `
        <div class="control-group">
            <label>Pétalas: <span id="val-petals">${params.petals}</span></label>
            <input type="range" id="param-petals" min="3" max="36" value="${params.petals}">
        </div>
        <div class="control-group">
            <label>Camadas: <span id="val-layers">${params.layers}</span></label>
            <input type="range" id="param-layers" min="1" max="10" value="${params.layers}">
        </div>
        <div class="control-group">
            <label>Velocidade Rotação</label>
            <input type="range" id="param-speed" min="0" max="0.02" step="0.001" value="${params.speed}">
        </div>
        <div class="control-group">
            <label>Espessura Linha</label>
            <input type="range" id="param-lineWidth" min="0.5" max="5" step="0.5" value="${params.lineWidth}">
        </div>
        <div class="control-group">
            <label>Cor</label>
            <input type="color" id="param-color" value="${params.strokeColor}">
        </div>
    `;

    // 2. Escuta eventos dos controles
    controlsContainer.addEventListener('input', (e) => {
        const id = e.target.id;
        const val = e.target.value;

        if (id === 'param-petals') {
            params.petals = parseInt(val);
            document.getElementById('val-petals').innerText = val;
        } else if (id === 'param-layers') {
            params.layers = parseInt(val);
            document.getElementById('val-layers').innerText = val;
        } else if (id === 'param-speed') {
            params.speed = parseFloat(val);
        } else if (id === 'param-lineWidth') {
            params.lineWidth = parseFloat(val);
        } else if (id === 'param-color') {
            params.strokeColor = val;
        }
    });

    // 3. Loop de Renderização
    function draw() {
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const maxRadius = Math.min(centerX, centerY) * params.zoom;

        ctx.strokeStyle = params.strokeColor;
        ctx.lineWidth = params.lineWidth;

        angleOffset += params.speed;

        ctx.save();
        ctx.translate(centerX, centerY);

        const angleStep = (Math.PI * 2) / params.petals;

        for (let i = 0; i < params.petals; i++) {
            ctx.save();
            ctx.rotate(i * angleStep + angleOffset);

            // Desenha formas repetidas em camadas
            for (let l = 1; l <= params.layers; l++) {
                const layerRadius = (maxRadius / params.layers) * l;
                const wave = Math.sin(angleOffset * 2 + l) * 20;

                ctx.beginPath();
                ctx.moveTo(0, 0);
                // Curva de Bézier para criar a pétala
                ctx.quadraticCurveTo(layerRadius / 2 + wave, layerRadius / 2, 0, layerRadius);
                ctx.quadraticCurveTo(-layerRadius / 2 - wave, layerRadius / 2, 0, 0);
                ctx.stroke();
            }

            ctx.restore();
        }

        ctx.restore();

        animationFrameId = requestAnimationFrame(draw);
    }

    draw();

    // Retorna função de limpeza para cancelar o loop ao trocar de experimento
    return function cleanup() {
        cancelAnimationFrame(animationFrameId);
    };
}