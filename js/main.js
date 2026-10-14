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
    voronoi: () => import('./experiments/voronoi.js'),
    reactionDiffusion: () => import('./experiments/reaction-diffusion.js'),
    physarum: () => import('./experiments/physarum.js'),
    fractal: () => import('./experiments/fractal.js'),
    boids: () => import('./experiments/boids.js'),
    life: () => import('./experiments/game-of-life.js')
};

// URL no formato #experimento?param=valor&... (só os parâmetros alterados)
const parseHash = () => {
    const [name, qs = ''] = location.hash.slice(1).split('?');
    return { name, params: Object.fromEntries(new URLSearchParams(qs)) };
};
const setHash = (name, query) => history.replaceState(null, '', '#' + name + (query ? '?' + query : ''));

document.addEventListener('DOMContentLoaded', () => {
    const $ = id => document.getElementById(id);
    const [selector, canvas, panel, fps, pauseBtn, randomBtn, exportBtn, linkBtn, modal] =
        ['experimentSelector', 'renderCanvas', 'controlsPanel', 'fps', 'pauseBtn', 'randomBtn', 'exportBtn', 'linkBtn', 'infoModal'].map($);

    let current = null, token = 0;

    async function load(name, initial = {}) {
        const my = ++token;
        current?.stop();
        current = null;
        const mod = await loaders[name]?.();
        if (!mod || my !== token) return; // ignora cargas obsoletas
        current = run(mod.default, canvas, panel, fps, { initial, onChange: q => setHash(name, q) });
        pauseBtn.textContent = 'Pausar';
        setHash(name, current.query());
    }

    function togglePause() {
        if (!current) return;
        current.rt.paused = !current.rt.paused;
        pauseBtn.textContent = current.rt.paused ? 'Continuar' : 'Pausar';
    }

    selector.addEventListener('change', e => load(e.target.value));
    pauseBtn.addEventListener('click', togglePause);
    randomBtn.addEventListener('click', () => current?.randomize());

    exportBtn.addEventListener('click', () => {
        canvas.toBlob(blob => {
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `${selector.value}-${Date.now()}.png`;
            a.click();
            setTimeout(() => URL.revokeObjectURL(a.href), 1000);
        }, 'image/png');
    });

    let linkT = 0;
    linkBtn.addEventListener('click', async () => {
        if (current) setHash(selector.value, current.query()); // não espera o debounce
        try {
            await navigator.clipboard.writeText(location.href);
            linkBtn.textContent = 'Copiado!';
        } catch {
            linkBtn.textContent = 'Falhou';
        }
        clearTimeout(linkT);
        linkT = setTimeout(() => { linkBtn.textContent = 'Copiar link'; }, 1500);
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
        if (e.key === 'Escape') return closeModal();
        if (/INPUT|SELECT|BUTTON/.test(e.target.tagName) || e.ctrlKey || e.metaKey || e.altKey) return;
        if (e.code === 'Space') { e.preventDefault(); togglePause(); }
        else if (e.key.toLowerCase() === 'r') current?.randomize();
    });

    // Link colado na mesma aba (replaceState não dispara hashchange, só navegação real)
    function loadFromHash() {
        const { name, params } = parseHash();
        if (loaders[name]) selector.value = name; // link direto para um experimento
        load(selector.value, name === selector.value ? params : {});
    }
    window.addEventListener('hashchange', loadFromHash);
    loadFromHash();
});
