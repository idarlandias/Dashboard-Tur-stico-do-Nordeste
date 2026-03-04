// ============================================================
// ObIT-NE – Lógica de Gráficos (Canvas puro, sem dependências)
// ============================================================

const COLORS = {
    ocean: '#0077B6', sky: '#00B4D8', foam: '#90E0EF', sand: '#F4A261',
    sunset: '#E76F51', growth: '#06D6A0', purple: '#845EC2',
    bg: '#111827', bg2: '#1A2235', border: 'rgba(0,180,216,.18)',
    text: '#E8EDF7', muted: '#8896B3',
};

// ── Utilitários ───────────────────────────────────────────────
function hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
    return `${r},${g},${b}`;
}

function lerp(a, b, t) { return a + (b - a) * t; }

let animFrame = 0;
function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

// ── Grid helper ───────────────────────────────────────────────
function drawGrid(ctx, x, y, w, h, lines = 5) {
    ctx.strokeStyle = COLORS.border;
    ctx.lineWidth = 1;
    for (let i = 0; i <= lines; i++) {
        const yy = y + (h / lines) * i;
        ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x + w, yy); ctx.stroke();
    }
}

function drawAxisLabel(ctx, text, x, y, align = 'center', color = COLORS.muted) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = align;
    ctx.fillText(text, x, y);
    ctx.restore();
}

// ── Bar Chart ─────────────────────────────────────────────────
function drawBarChart(canvasId, labels, datasets, opts = {}) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const W = rect.width || canvas.offsetWidth || (canvas.parentElement && canvas.parentElement.offsetWidth) || 600;
    const H = rect.height || canvas.offsetHeight || (canvas.parentElement && canvas.parentElement.offsetHeight) || 240;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);
    const pad = { top: 20, right: 16, bottom: 50, left: 52 };
    const chartW = W - pad.left - pad.right;
    const chartH = H - pad.top - pad.bottom;

    const maxVal = opts.maxVal || Math.max(...datasets.flatMap(d => d.data)) * 1.15;
    const barGroups = labels.length;
    const groupW = chartW / barGroups;
    const numBars = datasets.length;
    const barW = Math.max(6, (groupW * .65) / numBars);
    const groupGap = (groupW - barW * numBars) / 2;

    let progress = 0;
    function animate() {
        progress = Math.min(1, progress + .04);
        const p = easeOut(progress);
        ctx.clearRect(0, 0, W, H);
        drawGrid(ctx, pad.left, pad.top, chartW, chartH, 4);

        // Y-axis labels
        for (let i = 0; i <= 4; i++) {
            const val = (maxVal / 4) * (4 - i);
            const yy = pad.top + (chartH / 4) * i;
            drawAxisLabel(ctx, opts.yFormat ? opts.yFormat(val) : Math.round(val), pad.left - 8, yy + 4, 'right');
        }

        datasets.forEach((ds, di) => {
            ds.data.forEach((val, gi) => {
                const bH = (val / maxVal) * chartH * p;
                const bX = pad.left + gi * groupW + groupGap + di * barW;
                const bY = pad.top + chartH - bH;

                // Bar fill
                const grad = ctx.createLinearGradient(bX, bY, bX, pad.top + chartH);
                grad.addColorStop(0, ds.color || COLORS.sky);
                grad.addColorStop(1, ds.color2 || COLORS.ocean);
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.roundRect(bX, bY, barW - 2, bH, [4, 4, 0, 0]);
                ctx.fill();
            });
        });

        // X-axis labels
        labels.forEach((lbl, gi) => {
            const lx = pad.left + gi * groupW + groupW / 2;
            drawAxisLabel(ctx, lbl, lx, pad.top + chartH + 18);
        });

        if (progress < 1) requestAnimationFrame(animate);
    }
    animate();

    // Tooltip
    const handleMove = (e) => {
        const r = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const mx = clientX - r.left, my = clientY - r.top;
        let found = false;
        datasets.forEach((ds, di) => {
            ds.data.forEach((val, gi) => {
                const bH = (val / maxVal) * chartH;
                const bX = pad.left + gi * groupW + groupGap + di * barW;
                const bY = pad.top + chartH - bH;
                if (mx >= bX && mx <= bX + barW - 2 && my >= bY && my <= pad.top + chartH) {
                    showTooltip(e, `<b>${ds.label || ''}</b><br>${labels[gi]}: <b>${opts.yFormat ? opts.yFormat(val) : val}</b>`);
                    found = true;
                }
            });
        });
        if (!found) hideTooltip();
    };
    canvas.addEventListener('mousemove', handleMove);
    canvas.addEventListener('touchmove', handleMove, { passive: true });
    canvas.addEventListener('touchstart', handleMove, { passive: true });
    canvas.addEventListener('mouseleave', hideTooltip);
    canvas.addEventListener('touchend', hideTooltip);
}

// ── Line Chart ────────────────────────────────────────────────
function drawLineChart(canvasId, labels, datasets, opts = {}) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const W = rect.width || canvas.offsetWidth || (canvas.parentElement && canvas.parentElement.offsetWidth) || 600;
    const H = rect.height || canvas.offsetHeight || (canvas.parentElement && canvas.parentElement.offsetHeight) || 240;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);
    const pad = { top: 20, right: 24, bottom: 44, left: 56 };
    const chartW = W - pad.left - pad.right;
    const chartH = H - pad.top - pad.bottom;
    const n = labels.length;
    const maxVal = opts.maxVal || Math.max(...datasets.flatMap(d => d.data)) * 1.15;

    function ptX(i) { return pad.left + (i / (n - 1)) * chartW; }
    function ptY(v) { return pad.top + chartH - (v / maxVal) * chartH; }

    let progress = 0;
    function animate() {
        progress = Math.min(1, progress + .03);
        const p = easeOut(progress);
        ctx.clearRect(0, 0, W, H);
        drawGrid(ctx, pad.left, pad.top, chartW, chartH, 4);

        for (let i = 0; i <= 4; i++) {
            const val = (maxVal / 4) * (4 - i);
            const yy = pad.top + (chartH / 4) * i;
            drawAxisLabel(ctx, opts.yFormat ? opts.yFormat(val) : Math.round(val), pad.left - 8, yy + 4, 'right');
        }

        labels.forEach((lbl, i) => {
            drawAxisLabel(ctx, lbl, ptX(i), pad.top + chartH + 18);
        });

        datasets.forEach(ds => {
            const pts = ds.data.map((v, i) => ({ x: ptX(i), y: ptY(v) }));
            const visiblePts = Math.max(2, Math.round(pts.length * p));

            // Area fill
            const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + chartH);
            grad.addColorStop(0, `rgba(${hexToRgb(ds.color || COLORS.sky)},.28)`);
            grad.addColorStop(1, `rgba(${hexToRgb(ds.color || COLORS.sky)},0)`);
            ctx.beginPath();
            ctx.moveTo(pts[0].x, pad.top + chartH);
            pts.slice(0, visiblePts).forEach(pt => ctx.lineTo(pt.x, pt.y));
            ctx.lineTo(pts[Math.min(visiblePts - 1, pts.length - 1)].x, pad.top + chartH);
            ctx.closePath();
            ctx.fillStyle = grad;
            ctx.fill();

            // Line
            ctx.beginPath();
            ctx.strokeStyle = ds.color || COLORS.sky;
            ctx.lineWidth = 2.5;
            ctx.lineJoin = 'round';
            pts.slice(0, visiblePts).forEach((pt, i) => i === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y));
            ctx.stroke();

            // Dots
            pts.slice(0, visiblePts).forEach(pt => {
                ctx.beginPath();
                ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
                ctx.fillStyle = ds.color || COLORS.sky;
                ctx.fill();
                ctx.strokeStyle = COLORS.bg;
                ctx.lineWidth = 2;
                ctx.stroke();
            });
        });

        if (progress < 1) requestAnimationFrame(animate);
    }
    animate();

    const handleMove = (e) => {
        const r = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const mx = clientX - r.left;
        const i = Math.round(((mx - pad.left) / chartW) * (n - 1));
        if (i >= 0 && i < n) {
            const lines = datasets.map(ds => `${ds.label || ''}: <b>${opts.yFormat ? opts.yFormat(ds.data[i]) : ds.data[i]}</b>`).join('<br>');
            showTooltip(e, `<b>${labels[i]}</b><br>${lines}`);
        } else hideTooltip();
    };
    canvas.addEventListener('mousemove', handleMove);
    canvas.addEventListener('touchmove', handleMove, { passive: true });
    canvas.addEventListener('touchstart', handleMove, { passive: true });
    canvas.addEventListener('mouseleave', hideTooltip);
    canvas.addEventListener('touchend', hideTooltip);
}

// ── Donut Chart ───────────────────────────────────────────────
function drawDonutChart(canvasId, labels, data, colors) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const W = rect.width || canvas.offsetWidth || (canvas.parentElement && canvas.parentElement.offsetWidth) || 600;
    const H = rect.height || canvas.offsetHeight || (canvas.parentElement && canvas.parentElement.offsetHeight) || 240;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);
    const cx = W / 2, cy = H / 2;
    const R = Math.min(W, H) / 2 - 10;
    const r = R * .6;
    const total = data.reduce((a, b) => a + b, 0);

    let prog = 0;
    function animate() {
        prog = Math.min(1, prog + .04);
        const p = easeOut(prog);
        ctx.clearRect(0, 0, W, H);
        let startAngle = -Math.PI / 2;
        data.forEach((val, i) => {
            const slice = (val / total) * Math.PI * 2 * p;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.arc(cx, cy, R, startAngle, startAngle + slice);
            ctx.arc(cx, cy, r, startAngle + slice, startAngle, true);
            ctx.closePath();
            ctx.fillStyle = colors[i];
            ctx.fill();
            startAngle += slice;
        });
        // Center label
        ctx.fillStyle = COLORS.text;
        ctx.font = `bold 22px Syne, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('100%', cx, cy + 4);
        ctx.fillStyle = COLORS.muted;
        ctx.font = '10px Inter, sans-serif';
        ctx.fillText('ATRAÇÕES', cx, cy + 18);
        if (prog < 1) requestAnimationFrame(animate);
    }
    animate();

    const handleMove = (e) => {
        const rect2 = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const mx = clientX - rect2.left - cx, my = clientY - rect2.top - cy;
        const dist = Math.sqrt(mx * mx + my * my);
        if (dist > r && dist < R) {
            let angle = Math.atan2(my, mx) + Math.PI / 2;
            if (angle < 0) angle += Math.PI * 2;
            let start = 0;
            for (let i = 0; i < data.length; i++) {
                const slice = (data[i] / total) * Math.PI * 2;
                if (angle >= start && angle < start + slice) {
                    showTooltip(e, `<b>${labels[i]}</b><br>${((data[i] / total) * 100).toFixed(1)}%`);
                    return;
                }
                start += slice;
            }
        }
        hideTooltip();
    };
    canvas.addEventListener('mousemove', handleMove);
    canvas.addEventListener('touchmove', handleMove, { passive: true });
    canvas.addEventListener('touchstart', handleMove, { passive: true });
    canvas.addEventListener('mouseleave', hideTooltip);
    canvas.addEventListener('touchend', hideTooltip);
}

// ── Tooltip ───────────────────────────────────────────────────
let tooltipEl;
function getTooltip() {
    if (!tooltipEl) {
        tooltipEl = document.createElement('div');
        tooltipEl.className = 'chart-tooltip';
        tooltipEl.setAttribute('aria-hidden', 'true');
        document.body.appendChild(tooltipEl);
    }
    return tooltipEl;
}

function showTooltip(e, html) {
    const t = getTooltip();
    t.innerHTML = html;
    t.style.display = 'block';
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    t.style.left = (clientX + 14) + 'px';
    t.style.top = (clientY - 10) + 'px';
}

function hideTooltip() {
    const t = getTooltip();
    if (t) t.style.display = 'none';
}
