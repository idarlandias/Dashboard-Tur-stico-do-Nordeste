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

// ── Bubble Chart (BCG) ───────────────────────────────────────
function drawBubbleChart(canvasId, bubbles, opts = {}) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const W = rect.width || canvas.offsetWidth || 600;
    const H = rect.height || canvas.offsetHeight || 400;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);
    const pad = { top: 30, right: 40, bottom: 55, left: 75 };
    const chartW = W - pad.left - pad.right;
    const chartH = H - pad.top - pad.bottom;

    if (!bubbles.length) return;

    const xs = bubbles.map(b => b.x);
    const ys = bubbles.map(b => b.y);
    const xMin = Math.min(...xs) * 0.8, xMax = Math.max(...xs) * 1.15;
    const yMin = Math.min(...ys) * 0.8, yMax = Math.max(...ys) * 1.15;
    const maxSize = Math.max(...bubbles.map(b => b.size));
    const maxR = Math.min(chartW, chartH) * 0.09;

    function mapX(v) { return pad.left + ((v - xMin) / (xMax - xMin)) * chartW; }
    function mapY(v) { return pad.top + chartH - ((v - yMin) / (yMax - yMin)) * chartH; }

    // Medians for quadrant lines
    const medX = bubbles.reduce((s, b) => s + b.x, 0) / bubbles.length;
    const medY = bubbles.reduce((s, b) => s + b.y, 0) / bubbles.length;

    let progress = 0;
    function animate() {
        progress = Math.min(1, progress + 0.035);
        const p = easeOut(progress);
        ctx.clearRect(0, 0, W, H);

        // Grid
        drawGrid(ctx, pad.left, pad.top, chartW, chartH, 4);

        // Quadrant lines
        ctx.setLineDash([6, 4]);
        ctx.strokeStyle = 'rgba(0,180,216,0.25)';
        ctx.lineWidth = 1;
        const mx = mapX(medX), my = mapY(medY);
        ctx.beginPath(); ctx.moveTo(mx, pad.top); ctx.lineTo(mx, pad.top + chartH); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(pad.left, my); ctx.lineTo(pad.left + chartW, my); ctx.stroke();
        ctx.setLineDash([]);

        // Quadrant labels
        ctx.font = '11px Inter, sans-serif';
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = COLORS.growth;
        ctx.textAlign = 'right';
        ctx.fillText('Estrelas', pad.left + chartW - 8, pad.top + 18);
        ctx.fillStyle = COLORS.sky;
        ctx.textAlign = 'left';
        ctx.fillText('Potenciais', pad.left + 8, pad.top + 18);
        ctx.fillStyle = COLORS.sand;
        ctx.textAlign = 'right';
        ctx.fillText('Consolidados', pad.left + chartW - 8, pad.top + chartH - 8);
        ctx.fillStyle = COLORS.sunset;
        ctx.textAlign = 'left';
        ctx.fillText('Atenção', pad.left + 8, pad.top + chartH - 8);
        ctx.globalAlpha = 1;

        // Bubbles
        bubbles.forEach(b => {
            const bx = mapX(b.x);
            const by = mapY(b.y);
            const r = Math.max(8, Math.sqrt(b.size / maxSize) * maxR) * p;

            ctx.beginPath();
            ctx.arc(bx, by, r, 0, Math.PI * 2);
            ctx.fillStyle = (b.color || COLORS.sky) + '88';
            ctx.fill();
            ctx.strokeStyle = b.color || COLORS.sky;
            ctx.lineWidth = 2;
            ctx.stroke();

            // Label
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 11px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(b.label, bx, by + 4);
        });

        // Axis labels
        ctx.fillStyle = COLORS.muted;
        ctx.font = '11px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(opts.xLabel || 'Eixo X', pad.left + chartW / 2, H - 8);

        ctx.save();
        ctx.translate(14, pad.top + chartH / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText(opts.yLabel || 'Eixo Y', 0, 0);
        ctx.restore();

        // Y axis values
        for (let i = 0; i <= 4; i++) {
            const val = yMin + (yMax - yMin) * (1 - i / 4);
            const yy = pad.top + (chartH / 4) * i;
            drawAxisLabel(ctx, opts.yFormat ? opts.yFormat(val) : val.toFixed(0), pad.left - 8, yy + 4, 'right');
        }
        // X axis values
        for (let i = 0; i <= 4; i++) {
            const val = xMin + (xMax - xMin) * (i / 4);
            const xx = pad.left + (chartW / 4) * i;
            drawAxisLabel(ctx, opts.xFormat ? opts.xFormat(val) : val.toFixed(0), xx, pad.top + chartH + 18);
        }

        if (progress < 1) requestAnimationFrame(animate);
    }
    animate();

    // Tooltip
    const handleMove = (e) => {
        const r2 = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const mx2 = clientX - r2.left, my2 = clientY - r2.top;
        for (const b of bubbles) {
            const bx = mapX(b.x), by = mapY(b.y);
            const br = Math.max(8, Math.sqrt(b.size / maxSize) * maxR);
            if (Math.sqrt((mx2 - bx) ** 2 + (my2 - by) ** 2) <= br) {
                showTooltip(e, `<b>${b.label}</b><br>CAGR: ${b.x.toFixed(1)}%<br>Eficiência: R$ ${b.y.toFixed(0)}/turista<br>Volume: ${b.size.toLocaleString('pt-BR')}`);
                return;
            }
        }
        hideTooltip();
    };
    canvas.addEventListener('mousemove', handleMove);
    canvas.addEventListener('touchmove', handleMove, { passive: true });
    canvas.addEventListener('mouseleave', hideTooltip);
    canvas.addEventListener('touchend', hideTooltip);
}

// ── Heatmap Chart ────────────────────────────────────────────
function drawHeatmapChart(canvasId, rowLabels, colLabels, matrix, opts = {}) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const W = rect.width || canvas.offsetWidth || 600;
    const H = rect.height || canvas.offsetHeight || 320;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);
    const pad = { top: 32, right: 16, bottom: 12, left: 110 };
    const chartW = W - pad.left - pad.right;
    const chartH = H - pad.top - pad.bottom;
    const rows = rowLabels.length;
    const cols = colLabels.length;
    const cellW = chartW / cols;
    const cellH = chartH / rows;

    // Min/max
    let gMin = Infinity, gMax = -Infinity;
    matrix.forEach(row => row.forEach(v => { gMin = Math.min(gMin, v); gMax = Math.max(gMax, v); }));

    function heatColor(v) {
        const t = (v - gMin) / (gMax - gMin);
        // 3-stop gradient: dark blue → orange → red
        let r, g, b;
        if (t < 0.5) {
            const t2 = t * 2;
            r = Math.round(lerp(13, 244, t2));
            g = Math.round(lerp(21, 162, t2));
            b = Math.round(lerp(38, 97, t2));
        } else {
            const t2 = (t - 0.5) * 2;
            r = Math.round(lerp(244, 255, t2));
            g = Math.round(lerp(162, 71, t2));
            b = Math.round(lerp(97, 87, t2));
        }
        return `rgb(${r},${g},${b})`;
    }

    let progress = 0;
    function animate() {
        progress = Math.min(1, progress + 0.04);
        const p = easeOut(progress);
        const visCols = Math.ceil(cols * p);
        ctx.clearRect(0, 0, W, H);

        // Column labels (months)
        ctx.fillStyle = COLORS.muted;
        ctx.font = '11px Inter, sans-serif';
        ctx.textAlign = 'center';
        colLabels.forEach((lbl, c) => {
            ctx.fillText(lbl, pad.left + c * cellW + cellW / 2, pad.top - 10);
        });

        // Row labels (states)
        ctx.textAlign = 'right';
        ctx.fillStyle = COLORS.text;
        ctx.font = '12px Inter, sans-serif';
        rowLabels.forEach((lbl, r) => {
            ctx.fillText(lbl, pad.left - 10, pad.top + r * cellH + cellH / 2 + 4);
        });

        // Cells
        matrix.forEach((row, ri) => {
            row.forEach((val, ci) => {
                if (ci >= visCols) return;
                const x = pad.left + ci * cellW;
                const y = pad.top + ri * cellH;
                ctx.fillStyle = heatColor(val);
                ctx.beginPath();
                ctx.roundRect(x + 1, y + 1, cellW - 2, cellH - 2, 3);
                ctx.fill();

                // Value in cell
                if (cellW > 30 && cellH > 20) {
                    ctx.fillStyle = val > (gMin + gMax) / 2 ? '#fff' : '#ccc';
                    ctx.font = '10px Inter, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText(val, x + cellW / 2, y + cellH / 2 + 3);
                }
            });
        });

        if (progress < 1) requestAnimationFrame(animate);
    }
    animate();

    // Tooltip
    const handleMove = (e) => {
        const r2 = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const mx = clientX - r2.left - pad.left;
        const my = clientY - r2.top - pad.top;
        const ci = Math.floor(mx / cellW);
        const ri = Math.floor(my / cellH);
        if (ci >= 0 && ci < cols && ri >= 0 && ri < rows) {
            showTooltip(e, `<b>${rowLabels[ri]}</b> · ${colLabels[ci]}<br>Índice: <b>${matrix[ri][ci]}</b>`);
        } else hideTooltip();
    };
    canvas.addEventListener('mousemove', handleMove);
    canvas.addEventListener('touchmove', handleMove, { passive: true });
    canvas.addEventListener('mouseleave', hideTooltip);
    canvas.addEventListener('touchend', hideTooltip);
}

// ── Radar Chart ──────────────────────────────────────────────
function drawRadarChart(canvasId, axes, datasets, opts = {}) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const W = rect.width || canvas.offsetWidth || 400;
    const H = rect.height || canvas.offsetHeight || 380;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    const cx = W / 2, cy = H / 2;
    const R = Math.min(W, H) / 2 - 45;
    const n = axes.length;
    const maxVal = opts.maxVal || 100;
    const levels = opts.levels || 5;

    function angleFor(i) { return (Math.PI * 2 * i / n) - Math.PI / 2; }
    function ptFor(i, val) {
        const a = angleFor(i);
        const r = (val / maxVal) * R;
        return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
    }

    let progress = 0;
    function animate() {
        progress = Math.min(1, progress + 0.035);
        const p = easeOut(progress);
        ctx.clearRect(0, 0, W, H);

        // Concentric levels
        for (let l = 1; l <= levels; l++) {
            const lr = (R / levels) * l;
            ctx.beginPath();
            for (let i = 0; i <= n; i++) {
                const a = angleFor(i % n);
                const x = cx + lr * Math.cos(a);
                const y = cy + lr * Math.sin(a);
                i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.strokeStyle = COLORS.border;
            ctx.lineWidth = 1;
            ctx.stroke();

            // Level value
            if (l < levels) {
                const val = Math.round((maxVal / levels) * l);
                ctx.fillStyle = COLORS.muted;
                ctx.font = '9px Inter, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(val, cx + 2, cy - lr + 10);
            }
        }

        // Axis lines + labels
        for (let i = 0; i < n; i++) {
            const a = angleFor(i);
            const ex = cx + R * Math.cos(a);
            const ey = cy + R * Math.sin(a);

            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(ex, ey);
            ctx.strokeStyle = COLORS.border;
            ctx.lineWidth = 1;
            ctx.stroke();

            // Label
            const lx = cx + (R + 20) * Math.cos(a);
            const ly = cy + (R + 20) * Math.sin(a);
            ctx.fillStyle = COLORS.text;
            ctx.font = '12px Inter, sans-serif';
            ctx.textAlign = Math.cos(a) > 0.1 ? 'left' : Math.cos(a) < -0.1 ? 'right' : 'center';
            ctx.textBaseline = Math.sin(a) > 0.1 ? 'top' : Math.sin(a) < -0.1 ? 'bottom' : 'middle';
            ctx.fillText(axes[i], lx, ly);
        }

        // Datasets (fill + stroke)
        datasets.forEach(ds => {
            ctx.beginPath();
            ds.data.forEach((val, i) => {
                const pt = ptFor(i, val * p);
                i === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y);
            });
            ctx.closePath();
            ctx.fillStyle = (ds.color || COLORS.sky) + '33';
            ctx.fill();
            ctx.strokeStyle = ds.color || COLORS.sky;
            ctx.lineWidth = 2.5;
            ctx.stroke();

            // Dots
            ds.data.forEach((val, i) => {
                const pt = ptFor(i, val * p);
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

    // Tooltip
    const handleMove = (e) => {
        const r2 = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const mx = clientX - r2.left, my = clientY - r2.top;
        for (let i = 0; i < n; i++) {
            for (const ds of datasets) {
                const pt = ptFor(i, ds.data[i]);
                if (Math.sqrt((mx - pt.x) ** 2 + (my - pt.y) ** 2) <= 12) {
                    showTooltip(e, `<b>${axes[i]}</b><br>${ds.label}: <b>${ds.data[i].toFixed(0)}/100</b>`);
                    return;
                }
            }
        }
        hideTooltip();
    };
    canvas.addEventListener('mousemove', handleMove);
    canvas.addEventListener('touchmove', handleMove, { passive: true });
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
