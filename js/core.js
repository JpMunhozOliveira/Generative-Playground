// Núcleo compartilhado: canvas (HiDPI + resize), controles declarativos, loop e cleanup.
export const hexRgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
export const hexA = (h, a) => `rgba(${hexRgb(h)},${a})`;

// ImageData + canvas auxiliar de W x H, recriados só quando o tamanho muda
export function pixelBuffer(s, W, H) {
    if (!s.buf || s.buf.img.width !== W || s.buf.img.height !== H) {
        const off = Object.assign(document.createElement('canvas'), { width: W, height: H });
        const octx = off.getContext('2d');
        s.buf = { off, octx, img: octx.createImageData(W, H) };
    }
    return s.buf;
}

const TWEEN_MS = 800;
const ease = t => t < 0.5 ? 4 * t * t * t : 1 - (2 - 2 * t) ** 3 / 2; // easeInOutCubic
const lerpColor = (a, b, k) => {
    const B = hexRgb(b);
    return '#' + hexRgb(a).map((v, i) => Math.round(v + (B[i] - v) * k).toString(16).padStart(2, '0')).join('');
};

const decimals = n => (String(n).split('.')[1] || '').length;

// Arredonda para o step do slider e limita a [min, max]
function snap(c, v) {
    const step = c.step ?? 1;
    v = Math.min(c.max, Math.max(c.min, c.min + Math.round((v - c.min) / step) * step));
    return Number(v.toFixed(decimals(step)));
}

// Converte um valor vindo de fora (URL) para o tipo do controle; undefined se inválido
function coerce(c, raw) {
    if (raw == null) return undefined;
    if (c.type === 'color') return /^#[0-9a-f]{6}$/i.test(raw) ? raw.toLowerCase() : undefined;
    if (c.type === 'select') return c.options.some(([k]) => k === raw) ? raw : undefined;
    const v = parseFloat(raw);
    return Number.isFinite(v) ? snap(c, v) : undefined;
}

// Matiz aleatória com saturação e brilho máximos (HSV -> hex)
function randomColor() {
    const h = Math.random() * 6;
    return '#' + [5, 3, 1].map(n => {
        const k = (n + h) % 6;
        return Math.round(255 * (1 - Math.max(0, Math.min(k, 4 - k, 1)))).toString(16).padStart(2, '0');
    }).join('');
}

function randomValue(c) {
    if (c.type === 'color') return randomColor();
    if (c.type === 'select') return c.options[(Math.random() * c.options.length) | 0][0];
    return snap(c, c.min + Math.random() * (c.max - c.min));
}

function controlHTML(c, value) {
    const id = `ctl-${c.id}`, head = `<div class="control-group"><label for="${id}">${c.label}`;
    if (c.type === 'color') return `${head}</label><input type="color" id="${id}" data-id="${c.id}" value="${value}"></div>`;
    if (c.type === 'select') return `${head}</label><select id="${id}" data-id="${c.id}">${c.options.map(([k, t]) =>
        `<option value="${k}"${k === value ? ' selected' : ''}>${t}</option>`).join('')}</select></div>`;
    return `${head}: <output>${value}</output></label><input type="range" id="${id}" data-id="${c.id}" min="${c.min}" max="${c.max}" step="${c.step ?? 1}" value="${value}"></div>`;
}

/**
 * Executa um experimento { controls, static?, setup?(rt,p,s), frame(rt,p,s,dt), randomize?(p) }.
 * rt = { canvas, ctx, w, h, dpr, paused, dirty } (w/h em px CSS), p = parâmetros, s = estado do experimento.
 * Controles com `random: false` ficam de fora do Aleatorizar. Ao aleatorizar, sliders e cores deslizam até o
 * novo valor (sliders de passo inteiro avançam de passo em passo); selects e controles `reset` mudam na hora.
 * opts.initial = valores iniciais (strings, ex. vindos da URL); opts.onChange(query) recebe os parâmetros
 * que diferem do padrão, serializados como query string.
 */
export function run(exp, canvas, panel, fpsEl, { initial = {}, onChange } = {}) {
    const ac = new AbortController();
    const ctx = canvas.getContext('2d');
    const rt = { canvas, ctx, w: 0, h: 0, dpr: 0, paused: false, dirty: true };
    const p = {}, s = {}, byId = {};
    for (const c of exp.controls) { byId[c.id] = c; p[c.id] = coerce(c, initial[c.id]) ?? c.value; }
    panel.innerHTML = exp.controls.map(c => controlHTML(c, p[c.id])).join('');

    // Atualiza o input e o <output> de um controle a partir de p
    function show(c) {
        const el = panel.querySelector(`[data-id="${c.id}"]`), v = c.type ? p[c.id] : snap(c, p[c.id]);
        el.value = v;
        const out = el.parentElement.querySelector('output');
        if (out) out.textContent = v;
    }

    const query = () => new URLSearchParams(exp.controls
        .filter(c => p[c.id] !== c.value).map(c => [c.id, p[c.id]])).toString();

    // replaceState a cada movimento de slider é limitado pelos navegadores -> debounce
    let notifyT = 0;
    const notify = () => { clearTimeout(notifyT); notifyT = setTimeout(() => onChange?.(query()), 200); };

    function measure() {
        const par = canvas.parentElement;
        const w = Math.max(100, par.clientWidth - 40), h = Math.max(100, par.clientHeight - 40);
        const dpr = window.devicePixelRatio || 1;
        if (w === rt.w && h === rt.h && dpr === rt.dpr) return;
        Object.assign(rt, { w, h, dpr, dirty: true });
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        exp.setup?.(rt, p, s);
    }
    measure();

    let pending = 0;
    const ro = new ResizeObserver(() => { cancelAnimationFrame(pending); pending = requestAnimationFrame(measure); });
    ro.observe(canvas.parentElement);

    // Um único listener por execução (removido via AbortController -> sem vazamentos)
    panel.addEventListener('input', e => {
        const el = e.target, c = byId[el.dataset.id];
        if (!c) return;
        tween.delete(c); // o usuário assumiu este controle
        p[c.id] = c.type === 'color' || c.type === 'select' ? el.value : parseFloat(el.value);
        const out = el.parentElement.querySelector('output');
        if (out) out.textContent = el.value;
        rt.dirty = true;
        if (c.reset) exp.setup?.(rt, p, s);
        notify();
    }, { signal: ac.signal });

    // Controle -> [valor inicial, valor final] da animação em andamento
    const tween = new Map();
    let tweenT0 = 0;

    function randomize() {
        const next = { ...p };
        for (const c of exp.controls) if (c.random !== false) next[c.id] = randomValue(c);
        exp.randomize?.(next);
        tween.clear();
        let reset = false;
        for (const c of exp.controls) {
            if (next[c.id] === p[c.id]) continue;
            if (c.type === 'select' || c.reset) { p[c.id] = next[c.id]; reset ||= c.reset; show(c); }
            else tween.set(c, [p[c.id], next[c.id]]);
        }
        tweenT0 = performance.now();
        rt.dirty = true;
        if (reset) exp.setup?.(rt, p, s);
        if (!tween.size) notify();
    }

    function stepTween(now) {
        const k = Math.min(1, Math.max(0, (now - tweenT0) / TWEEN_MS)), e = ease(k);
        for (const [c, [a, b]] of tween) {
            p[c.id] = k === 1 ? b
                : c.type === 'color' ? lerpColor(a, b, e)
                : (c.step ?? 1) >= 1 ? snap(c, a + (b - a) * e) // ex.: profundidade da árvore precisa ser inteira
                : a + (b - a) * e;
            show(c);
        }
        rt.dirty = true;
        if (k === 1) { tween.clear(); notify(); }
    }

    let raf, last = performance.now(), fpsT = last, frames = 0;
    const tick = now => {
        raf = requestAnimationFrame(tick);
        const dt = Math.min((now - last) / 1000, 0.05); // independente da taxa de atualização
        last = now;
        if (++frames && now - fpsT >= 500) {
            if (fpsEl) fpsEl.textContent = Math.round(frames * 1000 / (now - fpsT)) + ' FPS';
            frames = 0; fpsT = now;
        }
        if (tween.size) stepTween(now);
        if ((exp.static || rt.paused) && !rt.dirty) return; // só redesenha se necessário
        exp.frame(rt, p, s, rt.paused ? 0 : dt);
        rt.dirty = false;
    };
    raf = requestAnimationFrame(tick);

    return {
        rt, randomize, query,
        stop() { ac.abort(); clearTimeout(notifyT); cancelAnimationFrame(raf); cancelAnimationFrame(pending); ro.disconnect(); }
    };
}
