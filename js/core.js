// Núcleo compartilhado: canvas (HiDPI + resize), controles declarativos, loop e cleanup.
export const hexRgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
export const hexA = (h, a) => `rgba(${hexRgb(h)},${a})`;

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
 * Controles com `random: false` ficam de fora do Aleatorizar.
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
        p[c.id] = c.type === 'color' || c.type === 'select' ? el.value : parseFloat(el.value);
        const out = el.parentElement.querySelector('output');
        if (out) out.textContent = el.value;
        rt.dirty = true;
        if (c.reset) exp.setup?.(rt, p, s);
        notify();
    }, { signal: ac.signal });

    function randomize() {
        const old = { ...p };
        for (const c of exp.controls) if (c.random !== false) p[c.id] = randomValue(c);
        exp.randomize?.(p);
        for (const c of exp.controls) {
            const el = panel.querySelector(`[data-id="${c.id}"]`);
            el.value = p[c.id];
            const out = el.parentElement.querySelector('output');
            if (out) out.textContent = p[c.id];
        }
        rt.dirty = true;
        if (exp.controls.some(c => c.reset && p[c.id] !== old[c.id])) exp.setup?.(rt, p, s);
        notify();
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
