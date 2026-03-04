// ============================================================
// ObIT-NE – Lógica principal: filtros, KPIs e render de seções
// ============================================================

// ── Estado global ─────────────────────────────────────────────
let estado = 'Todos';
let periodo = '2025';
let indicador = 'turistas';

// ── Inicialização ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    populateSelects();
    bindEvents();
    render();
});

function periodoIdx(p) { return PERIODOS.indexOf(p); }

// ── População de selects ──────────────────────────────────────
function populateSelects() {
    const selEstado = document.getElementById('sel-estado');
    const selPeriodo = document.getElementById('sel-periodo');

    selEstado.innerHTML = '<option value="Todos">Todos os estados</option>';
    ESTADOS.forEach(e => {
        const opt = document.createElement('option');
        opt.value = e; opt.textContent = e;
        selEstado.appendChild(opt);
    });

    selPeriodo.innerHTML = '';
    PERIODOS.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p; opt.textContent = p;
        selPeriodo.appendChild(opt);
    });
    selPeriodo.value = '2025';
}

// ── Bind de eventos ───────────────────────────────────────────
function bindEvents() {
    document.getElementById('sel-estado').addEventListener('change', e => { estado = e.target.value; render(); });
    document.getElementById('sel-periodo').addEventListener('change', e => { periodo = e.target.value; render(); });

    document.querySelectorAll('.chip').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            indicador = chip.dataset.ind;
            render();
        });
    });

    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
            item.classList.add('active');
            const target = item.dataset.section;
            document.querySelectorAll('.dash-section').forEach(s => {
                s.style.display = s.id === target ? '' : 'none';
            });
        });
    });

    document.getElementById('btn-export').addEventListener('click', () => {
        alert('📊 Exportação de relatório em PDF/Excel\n\n(Funcionalidade de portfólio – integração com backend em produção)');
    });
}

// ── Render principal ──────────────────────────────────────────
function render() {
    renderKPIs();
    renderCharts();
    renderRanking();
    renderSazonalidade();
    renderProspecoes2026();
}

// ── Prospecoes 2026 ───────────────────────────────────────────
function renderProspecoes2026() {
    const container = document.getElementById('matriz-investimento');
    if (!container || typeof prospecoes2026 === 'undefined') return;

    container.innerHTML = prospecoes2026.map((d, i) => {
        const barWidth = (d.indice).toFixed(0);
        const barColor = d.cor || '#00B4D8';
        const badgeCls = d.classificacao === 'ALTA' ? 'badge-alta'
            : d.classificacao === 'MEDIA-ALTA' ? 'badge-media-alta'
                : 'badge-media';
        return `
<div class="invest-row" style="padding:10px 12px; border-bottom:1px solid rgba(255,255,255,0.05);">
  <div style="display:flex; align-items:center; gap:12px; margin-bottom:6px;">
    <span style="font-size:1.3rem; min-width:28px;">${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (i + 1) + '.'}</span>
    <div style="flex:1;">
      <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
        <strong style="color:#e0f0ff; font-size:0.95rem;">${d.estado}</strong>
        <span style="font-size:0.7rem; font-weight:700; padding:2px 8px; border-radius:20px; background:${barColor}22; color:${barColor}; border:1px solid ${barColor}44;">${d.classificacao}</span>
        <span style="font-size:0.75rem; color:#90a4ae;">CAGR ${d.cagr}% · Proj. +${d.variacao}%</span>
      </div>
      <div style="margin-top:5px; background:rgba(255,255,255,0.07); border-radius:4px; height:8px; overflow:hidden;">
        <div style="height:100%; width:${barWidth}%; background:linear-gradient(90deg, ${barColor}, ${barColor}aa); border-radius:4px; transition:width 0.6s ease;"></div>
      </div>
      <div style="margin-top:2px; display:flex; justify-content:space-between;">
        <span style="font-size:0.72rem; color:#b0bec5;">${d.rationale.substring(0, 90)}…</span>
        <span style="font-size:0.8rem; font-weight:700; color:${barColor}; white-space:nowrap; margin-left:8px;">${d.indice}/100</span>
      </div>
    </div>
  </div>
</div>`;
    }).join('');
}

// ── KPIs ──────────────────────────────────────────────────────
function renderKPIs() {
    const idx = periodoIdx(periodo);
    const estados = estado === 'Todos' ? ESTADOS : [estado];

    const totalTuristas = estados.reduce((s, e) => s + turistas[e][idx], 0);
    const totalReceita = estados.reduce((s, e) => s + receita[e][idx], 0);
    const mediaOcupacao = estados.reduce((s, e) => s + ocupacao[e][idx], 0) / estados.length;
    const totalEmpregos = estados.reduce((s, e) => s + empregos[e][idx], 0);

    // Variação vs ano anterior (se existir)
    const idxPrev = idx > 0 ? idx - 1 : null;
    function varPct(curr, prev) {
        if (prev === null) return null;
        return (((curr - prev) / prev) * 100).toFixed(1);
    }

    const prevTuristas = idxPrev !== null ? estados.reduce((s, e) => s + turistas[e][idxPrev], 0) : null;
    const prevReceita = idxPrev !== null ? estados.reduce((s, e) => s + receita[e][idxPrev], 0) : null;
    const prevOcup = idxPrev !== null ? estados.reduce((s, e) => s + ocupacao[e][idxPrev], 0) / estados.length : null;
    const prevEmp = idxPrev !== null ? estados.reduce((s, e) => s + empregos[e][idxPrev], 0) : null;

    function fmt(n, suf = '') { return n >= 1000 ? (n / 1000).toFixed(1) + 'k' + suf : n + suf; }

    setKPI('kpi-turistas', fmt(totalTuristas) + ' mil', varPct(totalTuristas, prevTuristas));
    setKPI('kpi-receita', 'R$ ' + fmt(totalReceita * 1) + ' mi', varPct(totalReceita, prevReceita));
    setKPI('kpi-ocupacao', mediaOcupacao.toFixed(1) + '%', varPct(mediaOcupacao, prevOcup));
    setKPI('kpi-empregos', fmt(totalEmpregos) + ' mil', varPct(totalEmpregos, prevEmp));
}

function setKPI(id, val, pct) {
    const card = document.getElementById(id);
    if (!card) return;
    card.querySelector('.kpi-value').textContent = val;
    const trend = card.querySelector('.kpi-trend');
    if (pct !== null) {
        const up = parseFloat(pct) >= 0;
        trend.className = 'kpi-trend' + (up ? '' : ' down');
        trend.innerHTML = `${up ? '▲' : '▼'} ${Math.abs(pct)}% vs ${PERIODOS[periodoIdx(periodo) - 1] || ''}`;
        trend.style.display = '';
    } else {
        trend.style.display = 'none';
    }
}

// ── Gráficos ──────────────────────────────────────────────────
function renderCharts() {
    const idx = periodoIdx(periodo);
    const estados = estado === 'Todos' ? ESTADOS : [estado];
    const ds = { turistas, receita, ocupacao, empregos }[indicador] || turistas;

    // Chart 1: barras por estado no período selecionado
    const labels1 = estados.map(e => e.split(' ')[0]);
    const vals1 = estados.map(e => ds[e][idx]);
    const indLabel = { turistas: 'Turistas (mil)', receita: 'Receita (R$ mi)', ocupacao: 'Ocupação (%)', empregos: 'Empregos (mil)' }[indicador];

    drawBarChart('chart-estados', labels1, [{ label: indLabel, data: vals1, color: '#00B4D8', color2: '#0077B6' }], {
        yFormat: v => v >= 1000 ? (v / 1000).toFixed(1) + 'k' : Math.round(v),
    });

    // Chart 2: linha de evolução temporal
    const timeData = PERIODOS.map(p => {
        return estado === 'Todos'
            ? ESTADOS.reduce((s, e) => s + ds[e][PERIODOS.indexOf(p)], 0)
            : ds[estado][PERIODOS.indexOf(p)];
    });

    drawLineChart('chart-temporal', PERIODOS, [{ label: indLabel, data: timeData, color: '#06D6A0' }], {
        yFormat: v => v >= 1000 ? (v / 1000).toFixed(1) + 'k' : Math.round(v),
    });

    // Donut de categorias
    drawDonutChart('chart-categorias', atracoesCategoria.labels, atracoesCategoria.data, atracoesCategoria.colors);
}

// ── Ranking ───────────────────────────────────────────────────
function renderRanking() {
    const list = document.getElementById('ranking-list');
    if (!list) return;
    const maxV = rankingDestinos[0].visitas;
    list.innerHTML = rankingDestinos.map((d, i) => `
    <div class="ranking-item">
      <span class="rank-num${i < 3 ? ' top' : ''}">${i + 1}</span>
      <span class="rank-icon">${d.icon}</span>
      <span class="rank-name">${d.nome}</span>
      <div class="rank-bar-wrap">
        <div class="rank-bar-bg">
          <div class="rank-bar" style="width:${(d.visitas / maxV * 100).toFixed(0)}%"></div>
        </div>
      </div>
      <span class="rank-value">${d.visitas}M</span>
    </div>
  `).join('');
}

// ── Sazonalidade ──────────────────────────────────────────────
function renderSazonalidade() {
    drawBarChart('chart-sazonalidade', sazonalidade.labels,
        [{ label: 'Chegadas (mil)', data: sazonalidade.data, color: '#F4A261', color2: '#E76F51' }],
        { yFormat: v => Math.round(v) }
    );
}

// ── Redimensionamento ─────────────────────────────────────────
window.addEventListener('resize', () => { clearTimeout(window._rt); window._rt = setTimeout(render, 200); });
