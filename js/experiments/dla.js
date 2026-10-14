import { hexRgb, pixelBuffer } from '../core.js';

// DLA (agregação limitada por difusão): partículas fazem passeio aleatório até encostar na estrutura
// e grudar. Pontas expostas capturam mais partículas que os vales, então os galhos se ramificam
// sozinhos — o mesmo processo de corais, raios, cristais de gelo e depósitos minerais.
const SCALE = 2; // 1 célula = 2x2 px CSS

// Posição relativa (0 no centro/base, 1 na borda), usada para o gradiente de cor
const frac = (s, x, y) => s.mode === 'centro'
    ? Math.min(1, Math.hypot(x - s.cx, y - s.cy) / (Math.min(s.W, s.H) / 2))
    : (s.H - 1 - y) / (s.H - 1);

function paint(s, x, y) {
    const f = frac(s, x, y), [a, b] = s.cols, q = (y * s.W + x) * 4, d = s.buf.img.data;
    d[q] = a[0] + (b[0] - a[0]) * f; d[q + 1] = a[1] + (b[1] - a[1]) * f; d[q + 2] = a[2] + (b[2] - a[2]) * f; d[q + 3] = 255;
}

function stick(s, x, y) {
    s.G[y * s.W + x] = 1;
    if (s.cols) paint(s, x, y);
    if (s.mode === 'centro') s.reach = Math.max(s.reach, Math.ceil(Math.hypot(x - s.cx, y - s.cy)));
    else s.reach = Math.min(s.reach, y);
}

// Nasce logo além da estrutura: um anel ao redor (centro) ou uma faixa acima (base)
function spawn(s, i) {
    if (s.mode === 'centro') {
        const a = Math.random() * Math.PI * 2, r = s.reach + 5;
        s.wx[i] = Math.min(s.W - 2, Math.max(1, Math.round(s.cx + r * Math.cos(a))));
        s.wy[i] = Math.min(s.H - 2, Math.max(1, Math.round(s.cy + r * Math.sin(a))));
    } else {
        s.wx[i] = Math.random() * s.W | 0;
        s.wy[i] = Math.max(0, s.reach - 5);
    }
}

// Muitas partículas ao redor de uma semente pequena a engolem numa bolha compacta: no modo centro o
// número de partículas ativas cresce com o raio da estrutura, preservando os galhos finos. A linha
// da base já é larga desde o início e usa todas.
const active = s => s.mode === 'centro' ? Math.min(s.wx.length, 10 + 6 * s.reach) : s.wx.length;

function init(s, p) {
    const { W, H } = s;
    Object.assign(s, { mode: p.seed, G: new Uint8Array(W * H), wx: new Int32Array(p.walkers), wy: new Int32Array(p.walkers),
        cx: W >> 1, cy: H >> 1, done: 0, colKey: null, cols: null });
    s.buf = pixelBuffer(s, W, H);
    s.buf.img.data.fill(0);
    if (s.mode === 'centro') { s.reach = 0; stick(s, s.cx, s.cy); }
    else { s.reach = H - 1; for (let x = 0; x < W; x++) stick(s, x, H - 1); }
    for (let i = 0; i < p.walkers; i++) spawn(s, i);
}

export default {
    thumb: { params: { walkers: 600, speed: 60 }, warmup: 40 }, // miniatura da galeria
    controls: [
        { id: 'seed', type: 'select', label: 'Semente', value: 'centro', reset: true,
          options: [['centro', 'Ponto central'], ['base', 'Linha na base']] },
        { id: 'walkers', label: 'Partículas em movimento', min: 200, max: 3000, step: 100, value: 1000, reset: true, random: false },
        { id: 'speed', label: 'Passos por frame', min: 1, max: 60, value: 30 },
        { id: 'stick', label: 'Aderência', min: 0.05, max: 1, step: 0.05, value: 1 },
        { id: 'color', type: 'color', label: 'Cor da origem', value: '#ffffff' },
        { id: 'color2', type: 'color', label: 'Cor das pontas', value: '#0077ff' }
    ],
    setup({ w, h }, p, s) {
        s.W = Math.ceil(w / SCALE); s.H = Math.ceil(h / SCALE);
        init(s, p);
    },
    frame({ ctx, w, h }, p, s, dt) {
        const { W, H, G, wx, wy } = s, centro = s.mode === 'centro';

        // Cores mudaram: repinta a estrutura inteira (pintura incremental vale só para cores fixas)
        const key = p.color + p.color2;
        if (s.colKey !== key) {
            s.cols = [hexRgb(p.color), hexRgb(p.color2)]; s.colKey = key;
            for (let y = 0, i = 0; y < H; y++) for (let x = 0; x < W; x++, i++) if (G[i]) paint(s, x, y);
        }

        const full = centro ? s.reach >= Math.min(W, H) / 2 - 2 : s.reach <= 2;
        if (full) {
            s.done += dt;
            if (s.done > 3) init(s, p); // segura a forma pronta por 3 s e recomeça
        } else {
            const steps = Math.round(p.speed * dt * 60);
            for (let i = 0, n = active(s); i < n; i++) {
                let x = wx[i], y = wy[i];
                if (G[y * W + x]) { spawn(s, i); x = wx[i]; y = wy[i]; } // a estrutura cresceu por cima dela
                for (let k = 0; k < steps; k++) {
                    const r = Math.random() * 4 | 0;
                    let nx = r === 0 ? x + 1 : r === 1 ? x - 1 : x, ny = r === 2 ? y + 1 : r === 3 ? y - 1 : y;
                    if (!centro) nx = (nx + W) % W;
                    // Saiu da região útil: renasce perto da estrutura
                    const lost = centro
                        ? nx < 1 || ny < 1 || nx >= W - 1 || ny >= H - 1 || Math.hypot(nx - s.cx, ny - s.cy) > s.reach + 20
                        : ny < s.reach - 20 || ny < 0 || ny >= H - 1;
                    if (lost) { spawn(s, i); x = wx[i]; y = wy[i]; continue; }
                    if (G[ny * W + nx]) continue; // não entra numa célula ocupada
                    x = nx; y = ny;
                    const xl = x ? x - 1 : W - 1, xr = x < W - 1 ? x + 1 : 0, row = y * W;
                    if ((G[row + xl] || G[row + xr] || (y && G[row - W + x]) || (y < H - 1 && G[row + W + x])) && Math.random() < p.stick) {
                        stick(s, x, y);
                        spawn(s, i); x = wx[i]; y = wy[i];
                    }
                }
                wx[i] = x; wy[i] = y;
            }
        }

        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, w, h);
        s.buf.octx.putImageData(s.buf.img, 0, 0);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(s.buf.off, 0, 0, W * SCALE, H * SCALE);
        if (!full) { // partículas ainda vagando, bem discretas
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.beginPath();
            for (let i = 0, n = active(s); i < n; i++) ctx.rect(wx[i] * SCALE, wy[i] * SCALE, SCALE, SCALE);
            ctx.fill();
        }
    }
};
