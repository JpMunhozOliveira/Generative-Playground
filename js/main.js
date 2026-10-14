import { run } from './core.js';
import { createGallery } from './gallery.js';
import { experimentDescriptions } from './descriptions.js';

// Carregamento sob demanda: só baixa o código do experimento quando ele (ou a galeria) é aberto
const EXPERIMENTS = {
    mandala: { name: 'Mandala', load: () => import('./experiments/mandala.js') },
    particles: { name: 'Sistema de Partículas', load: () => import('./experiments/particle-system.js') },
    noise: { name: 'Padrão de Ruído', load: () => import('./experiments/noise-pattern.js') },
    flowField: { name: 'Flow Field', load: () => import('./experiments/flow-field.js') },
    attractor: { name: 'Atrator Caótico', load: () => import('./experiments/attractor.js') },
    lissajous: { name: 'Curvas Lissajous', load: () => import('./experiments/lissajous.js') },
    fractalTree: { name: 'Árvore Fractal', load: () => import('./experiments/fractal-tree.js') },
    voronoi: { name: 'Diagrama de Voronoi', load: () => import('./experiments/voronoi.js') },
    reactionDiffusion: { name: 'Reação-Difusão', load: () => import('./experiments/reaction-diffusion.js') },
    physarum: { name: 'Physarum', load: () => import('./experiments/physarum.js') },
    fractal: { name: 'Fractal Julia/Mandelbrot', load: () => import('./experiments/fractal.js') },
    boids: { name: 'Boids (Revoada)', load: () => import('./experiments/boids.js') },
    life: { name: 'Jogo da Vida', load: () => import('./experiments/game-of-life.js') },
    dla: { name: 'DLA (Crescimento)', load: () => import('./experiments/dla.js') }
};

// URL no formato #experimento?param=valor&... (só os parâmetros alterados)
const parseHash = () => {
    const [name, qs = ''] = location.hash.slice(1).split('?');
    return { name, params: Object.fromEntries(new URLSearchParams(qs)) };
};
const setHash = (name, query) => history.replaceState(null, '', '#' + name + (query ? '?' + query : ''));

document.addEventListener('DOMContentLoaded', () => {
    const $ = id => document.getElementById(id);
    const [canvas, panel, fps, pauseBtn, randomBtn, exportBtn, linkBtn, modal] =
        ['renderCanvas', 'controlsPanel', 'fps', 'pauseBtn', 'randomBtn', 'exportBtn', 'linkBtn', 'infoModal'].map($);

    let current = null, currentKey = 'mandala', token = 0;

    async function load(name, initial = {}) {
        const my = ++token;
        currentKey = name;
        $('experimentName').textContent = EXPERIMENTS[name].name;
        current?.stop();
        current = null;
        const mod = await EXPERIMENTS[name].load();
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

    const gallery = createGallery({
        modal: $('galleryModal'), grid: $('galleryGrid'), experiments: EXPERIMENTS,
        onPick: key => { closeGallery(); if (key !== currentKey) load(key); }
    });
    // O experimento principal congela enquanto a galeria está aberta (CPU livre para as miniaturas)
    function openGallery() {
        if (current) current.rt.frozen = true;
        gallery.open(currentKey);
    }
    function closeGallery() {
        if (!gallery.isOpen) return;
        gallery.close();
        if (current) current.rt.frozen = false;
        $('experimentBtn').focus();
    }
    $('experimentBtn').addEventListener('click', openGallery);
    $('closeGallery').addEventListener('click', closeGallery);
    $('galleryModal').addEventListener('click', e => { if (e.target === e.currentTarget) closeGallery(); });

    pauseBtn.addEventListener('click', togglePause);
    randomBtn.addEventListener('click', () => current?.randomize());

    exportBtn.addEventListener('click', () => {
        canvas.toBlob(blob => {
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `${currentKey}-${Date.now()}.png`;
            a.click();
            setTimeout(() => URL.revokeObjectURL(a.href), 1000);
        }, 'image/png');
    });

    let linkT = 0;
    linkBtn.addEventListener('click', async () => {
        if (current) setHash(currentKey, current.query()); // não espera o debounce
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
        const info = experimentDescriptions[currentKey];
        if (info) { $('modalTitle').textContent = info.title; $('modalDescription').textContent = info.desc; }
        modal.style.display = 'flex';
    });
    $('closeModal').addEventListener('click', closeModal);
    modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') { closeModal(); closeGallery(); return; }
        if (gallery.isOpen || /INPUT|SELECT/.test(e.target.tagName) || e.ctrlKey || e.metaKey || e.altKey) return;
        const key = e.key.toLowerCase();
        if (e.code === 'Space') {
            if (e.target.tagName === 'BUTTON') return; // espaço já aciona o botão focado
            e.preventDefault(); togglePause();
        }
        else if (key === 'r') current?.randomize();
        else if (key === 'g') openGallery();
    });

    // Link colado na mesma aba (replaceState não dispara hashchange, só navegação real)
    function loadFromHash() {
        const { name, params } = parseHash();
        closeGallery();
        if (EXPERIMENTS[name]) load(name, params); // link direto para um experimento
        else load(currentKey);
    }
    window.addEventListener('hashchange', loadFromHash);
    loadFromHash();
});
