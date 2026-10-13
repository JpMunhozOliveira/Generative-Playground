import { run } from './core.js';
import { experimentDescriptions } from './descriptions.js';

// Carregamento sob demanda: só baixa o código do experimento selecionado
const loaders = {
    mandala: () => import('./experiments/mandala.js'),
    particles: () => import('./experiments/particle-system.js'),
    noise: () => import('./experiments/noise-pattern.js'),
    flowField: () => import('./experiments/flow-field.js'),
    attractor: () => import('./experiments/attractor.js'),
    lissajous: () => import('./experiments/lissajous.js'),
    fractalTree: () => import('./experiments/fractal-tree.js'),
    voronoi: () => import('./experiments/voronoi.js')
};

document.addEventListener('DOMContentLoaded', () => {
    const $ = id => document.getElementById(id);
    const [selector, canvas, panel, fps, pauseBtn, exportBtn, modal] =
        ['experimentSelector', 'renderCanvas', 'controlsPanel', 'fps', 'pauseBtn', 'exportBtn', 'infoModal'].map($);

    let current = null, token = 0;

    async function load(name) {
        const my = ++token;
        current?.stop();
        current = null;
        const mod = await loaders[name]?.();
        if (!mod || my !== token) return; // ignora cargas obsoletas
        current = run(mod.default, canvas, panel, fps);
        pauseBtn.textContent = 'Pausar';
        history.replaceState(null, '', '#' + name);
    }

    function togglePause() {
        if (!current) return;
        current.rt.paused = !current.rt.paused;
        pauseBtn.textContent = current.rt.paused ? 'Continuar' : 'Pausar';
    }

    selector.addEventListener('change', e => load(e.target.value));
    pauseBtn.addEventListener('click', togglePause);

    exportBtn.addEventListener('click', () => {
        canvas.toBlob(blob => {
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `${selector.value}-${Date.now()}.png`;
            a.click();
            setTimeout(() => URL.revokeObjectURL(a.href), 1000);
        }, 'image/png');
    });

    const closeModal = () => { modal.style.display = 'none'; };
    $('infoBtn').addEventListener('click', () => {
        const info = experimentDescriptions[selector.value];
        if (info) { $('modalTitle').textContent = info.title; $('modalDescription').textContent = info.desc; }
        modal.style.display = 'flex';
    });
    $('closeModal').addEventListener('click', closeModal);
    modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') closeModal();
        else if (e.code === 'Space' && !/INPUT|SELECT|BUTTON/.test(e.target.tagName)) { e.preventDefault(); togglePause(); }
    });

    const initial = location.hash.slice(1);
    if (loaders[initial]) selector.value = initial; // link direto para um experimento
    load(selector.value);
});