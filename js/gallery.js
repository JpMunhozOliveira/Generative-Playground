import { preview } from './core.js';

const TW = 200, TH = 125; // tamanho de simulação das miniaturas (px CSS); o CSS ajusta a exibição

/**
 * Galeria com miniaturas híbridas: na primeira abertura cada experimento é simulado uma vez, por alguns
 * quadros, gerando um instantâneo estático (um por vez, em fatias que não travam a interface).
 * Só a miniatura sob o mouse (ou com foco do teclado) anima ao vivo.
 */
export function createGallery({ modal, grid, experiments, onPick }) {
    const tiles = {};
    for (const [key, { name }] of Object.entries(experiments)) {
        const btn = document.createElement('button');
        btn.className = 'tile';
        btn.dataset.key = key;
        btn.innerHTML = `<canvas width="${TW}" height="${TH}" aria-hidden="true"></canvas><span></span>`;
        btn.querySelector('span').textContent = name;
        grid.append(btn);
        tiles[key] = { btn, canvas: btn.querySelector('canvas'), pv: null };
    }

    let live = null, generating = null;
    const play = key => {
        if (live === tiles[key]) return;
        live?.pv?.stop();
        live = tiles[key];
        live.pv?.play(); // se ainda não foi gerada, começa assim que ficar pronta
    };
    const stopLive = () => { live?.pv?.stop(); live = null; };
    const tileKey = e => e.target.closest('.tile')?.dataset.key;

    grid.addEventListener('click', e => { const k = tileKey(e); if (k) onPick(k); });
    grid.addEventListener('pointerover', e => { const k = tileKey(e); if (k) play(k); });
    grid.addEventListener('pointerleave', stopLive);
    grid.addEventListener('focusin', e => { const k = tileKey(e); if (k) play(k); });

    async function generate() {
        for (const [key, { load }] of Object.entries(experiments)) {
            const t = tiles[key];
            try {
                const pv = preview((await load()).default, t.canvas, TW, TH);
                await pv.warmup();
                t.pv = pv; // só fica disponível para animar depois do aquecimento
                t.canvas.classList.add('ready');
                if (live === t) t.pv.play();
            } catch (err) {
                console.error(`Miniatura de "${key}" falhou:`, err);
            }
        }
    }

    return {
        get isOpen() { return modal.style.display === 'flex'; },
        open(current) {
            for (const [k, t] of Object.entries(tiles)) t.btn.setAttribute('aria-current', k === current);
            modal.style.display = 'flex';
            tiles[current]?.btn.focus();
            generating ??= generate();
        },
        close() {
            stopLive();
            modal.style.display = 'none';
        }
    };
}
