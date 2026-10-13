// Núcleo compartilhado: canvas (HiDPI + resize), controles declarativos, loop e cleanup.
export const hexRgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
export const hexA = (h, a) => `rgba(${hexRgb(h)},${a})`;

function controlHTML(c) {
    const head = `<div class="control-group"><label>${c.label}`;
    if (c.type === 'color') return `${head}</label><input type="color" data-id="${c.id}" value="${c.value}"></div>`;
    if (c.type === 'select') return `${head}</label><select data-id="${c.id}">${c.options.map(([k, t]) =>
        `<option value="${k}"${k === c.value ? ' selected' : ''}>${t}</option>`).join('')}</select></div>`;
    return `${head}: <output>${c.value}</output></label><input type="range" data-id="${c.id}" min="${c.min}" max="${c.max}" step="${c.step ?? 1}" value="${c.value}"></div>`;
}

/**
 * Executa um experimento { controls, static?, setup?(rt,p,s), frame(rt,p,s,dt) }.
 * rt = { canvas, ctx, w, h, paused, dirty } (w/h em px CSS), p = parâmetros, s = estado do experimento.
 */
export function run(exp, canvas, panel, fpsEl) {
    const ac = new AbortController();
    const ctx = canvas.getContext('2d');
    const rt = { canvas, ctx, w: 0, h: 0, dpr: 0, paused: false, dirty: true };
    const p = {}, s = {}, byId = {};
    for (const c of exp.controls) { p[c.id] = c.value; byId[c.id] = c; }
    panel.innerHTML = exp.controls.map(controlHTML).join('');

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
    }, { signal: ac.signal });

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

    return { rt, stop() { ac.abort(); cancelAnimationFrame(raf); cancelAnimationFrame(pending); ro.disconnect(); } };
}