import { initMandala } from './experiments/mandala.js';
import { initParticleSystem } from './experiments/particle-system.js';
import { initNoisePattern } from './experiments/noise-pattern.js';

const experiments = {
    mandala: initMandala,
    particles: initParticleSystem,
    noise: initNoisePattern
};

let currentCleanup = null;

function loadExperiment(name) {
    if (typeof currentCleanup === 'function') {
        currentCleanup();
    }
    
    const canvas = document.getElementById('renderCanvas');
    const controlsContainer = document.getElementById('controlsPanel');
    
    if (experiments[name]) {
        currentCleanup = experiments[name](canvas, controlsContainer);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const selector = document.getElementById('experimentSelector');
    const exportBtn = document.getElementById('exportBtn');
    const canvas = document.getElementById('renderCanvas');

    selector.addEventListener('change', (e) => loadExperiment(e.target.value));
    
    // Exportação PNG
    exportBtn.addEventListener('click', () => {
        const link = document.createElement('a');
        link.download = `${selector.value}-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    });

    loadExperiment(selector.value);
});