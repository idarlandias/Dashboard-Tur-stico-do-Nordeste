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
            // requestAnimationFrame garante que o browser fez o reflow
            // e o canvas tem dimensoes antes de desenhar
            requestAnimationFrame(() => requestAnimationFrame(render));
        });
    });

    // ── Exportação CSV ────────────────────────────────────────
    document.getElementById('btn-export-csv').addEventListener('click', exportCSV);

    // ── Exportação Excel ──────────────────────────────────────
    document.getElementById('btn-export-xls').addEventListener('click', exportExcel);

    // ── Exportação PDF ────────────────────────────────────────
    document.getElementById('btn-export-pdf').addEventListener('click', exportPDF);
}

// ── Helpers de exportação ─────────────────────────────────────
function buildDataRows() {
    // Monta array de objetos com todos os dados por estado e período
    const rows = [];
    ESTADOS.forEach(est => {
        PERIODOS.forEach((ano, idx) => {
            rows.push({
                Estado: est,
                Ano: ano,
                Chegadas_Int: (chegadasInt[est] || [])[idx] || '',
                Receita_Mi_BRL: (receita[est] || [])[idx] || '',
                Ocupacao_Pct: (ocupacao[est] || [])[idx] || '',
                Empregos: (empregos[est] || [])[idx] || '',
            });
        });
    });
    return rows;
}

function exportCSV() {
    const rows = buildDataRows();
    const header = Object.keys(rows[0]).join(';');
    const body = rows.map(r => Object.values(r).join(';')).join('\n');
    const bom = '\uFEFF'; // BOM UTF-8 para Excel abrir com acentos
    const blob = new Blob([bom + header + '\n' + body], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, 'obit-ne_turismo_nordeste.csv');
}

function exportExcel() {
    const rows = buildDataRows();
    // Constrói tabela HTML — Excel abre .xls com HTML nativo
    const header = `<tr>${Object.keys(rows[0]).map(h => `<th style="background:#0077B6;color:#fff;font-weight:bold;padding:6px 10px;">${h}</th>`).join('')}</tr>`;
    const body = rows.map((r, i) => {
        const bg = i % 2 === 0 ? '#EBF5FB' : '#fff';
        return `<tr>${Object.values(r).map(v => `<td style="padding:5px 10px;background:${bg};">${v}</td>`).join('')}</tr>`;
    }).join('');
    const html = `
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:x="urn:schemas-microsoft-com:office:excel"
      xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="UTF-8">
<style>table{border-collapse:collapse;font-family:Arial;font-size:10pt;}td,th{border:1px solid #ccc;}</style>
</head><body>
<h2 style="color:#0077B6;font-family:Arial;">ObIT-NE · Dados Turísticos do Nordeste</h2>
<p style="font-family:Arial;color:#555;font-size:9pt;">Fonte: EMBRATUR/PF + PNAD-IBGE 2024 · Projeções 2026 por Regressão Linear OLS</p>
<table>${header}${body}</table>
<p style="font-family:Arial;color:#999;font-size:8pt;margin-top:8px;">Gerado em: ${new Date().toLocaleString('pt-BR')} · Dashboard ObIT-NE BNB</p>
</body></html>`;
    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    downloadBlob(blob, 'obit-ne_turismo_nordeste.xls');
}

function exportPDF() {
    // Mostra todas as seções temporariamente para o print
    const sections = document.querySelectorAll('.dash-section');
    const prevDisplay = [];
    sections.forEach((s, i) => { prevDisplay[i] = s.style.display; s.style.display = ''; });
    window.print();
    // Restaura após print
    setTimeout(() => {
        sections.forEach((s, i) => { s.style.display = prevDisplay[i]; });
    }, 500);
}

function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
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

    function fmtNum(n) {
        if (n >= 1000000) return (n / 1000000).toFixed(1) + ' mi';
        if (n >= 1000) return (n / 1000).toFixed(1) + ' mil';
        return n.toFixed(0);
    }
    function fmtRec(n) {
        if (n >= 1000) return 'R$ ' + (n / 1000).toFixed(1) + ' bi';
        return 'R$ ' + n + ' mi';
    }

    setKPI('kpi-turistas', fmtNum(totalTuristas), varPct(totalTuristas, prevTuristas));
    setKPI('kpi-receita', fmtRec(totalReceita), varPct(totalReceita, prevReceita));
    setKPI('kpi-ocupacao', mediaOcupacao.toFixed(1) + '%', varPct(mediaOcupacao, prevOcup));
    setKPI('kpi-empregos', fmtNum(totalEmpregos) + ' empregos', varPct(totalEmpregos, prevEmp));
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

    // Donut de categorias — dinâmico por estado selecionado
    const perfilEstado = (atracoesPerEstado && atracoesPerEstado[estado])
        ? atracoesPerEstado[estado]
        : atracoesCategoria.data;
    drawDonutChart('chart-categorias', ATRACAO_LABELS || atracoesCategoria.labels, perfilEstado, ATRACAO_COLORS || atracoesCategoria.colors);

    // Atualiza legenda do donut
    const legend = document.getElementById('donut-legend');
    if (legend) {
        const labels = ATRACAO_LABELS || atracoesCategoria.labels;
        const colors = ATRACAO_COLORS || atracoesCategoria.colors;
        legend.innerHTML = labels.map((lbl, i) => `
          <div class="legend-item">
            <div class="legend-dot" style="background:${colors[i]}"></div>
            <span>${lbl}</span>
            <span class="legend-pct">${perfilEstado[i]}%</span>
          </div>
        `).join('');
    }

    // Atualiza badge do donut com estado atual (seção principal)
    const badgeGeral = document.getElementById('badge-categorias-geral');
    if (badgeGeral) badgeGeral.textContent = estado === 'Todos' ? 'Nordeste' : estado;

    // Renderiza também o canvas da seção dedicada de categorias
    const labels = ATRACAO_LABELS || atracoesCategoria.labels;
    const colors = ATRACAO_COLORS || atracoesCategoria.colors;
    drawDonutChart('chart-categorias-sec', labels, perfilEstado, colors);

    // Atualiza legend e badge da seção dedicada
    const legendSec = document.getElementById('donut-legend-sec');
    if (legendSec) {
        legendSec.innerHTML = labels.map((lbl, i) => `
          <div class="legend-item">
            <div class="legend-dot" style="background:${colors[i]}"></div>
            <span>${lbl}</span>
            <span class="legend-pct">${perfilEstado[i]}%</span>
          </div>
        `).join('');
    }
    const badgeSec = document.getElementById('badge-categorias');
    if (badgeSec) badgeSec.textContent = estado === 'Todos' ? 'Nordeste' : estado;
    const subSec = document.getElementById('categorias-sub');
    if (subSec) subSec.textContent = estado === 'Todos'
        ? 'Distribuição estimada do perfil turístico · Nordeste'
        : `Perfil de atrações · ${estado} · estimativa`;
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
    const dadosMes = (typeof sazonalidadePerEstado !== 'undefined' && sazonalidadePerEstado[estado])
        ? sazonalidadePerEstado[estado]
        : sazonalidade.data;

    drawBarChart('chart-sazonalidade', sazonalidade.labels,
        [{ label: 'Índice de Chegadas (relativo)', data: dadosMes, color: '#F4A261', color2: '#E76F51' }],
        { yFormat: v => Math.round(v) }
    );

    // Atualiza subtítulo com estado atual
    const sub = document.querySelector('#sec-sazonalidade .chart-subtitle');
    if (sub) sub.textContent = estado === 'Todos'
        ? 'Média consolidada · Nordeste · perfil estimado por mês'
        : `Perfil de sazonalidade · ${estado} · base estimada`;
}

// ── Redimensionamento ─────────────────────────────────────────
window.addEventListener('resize', () => { clearTimeout(window._rt); window._rt = setTimeout(render, 200); });
