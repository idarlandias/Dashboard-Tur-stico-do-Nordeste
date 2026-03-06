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
    initMap();
    initSimulador();
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

    // ── Menu Mobile ───────────────────────────────────────────
    const btnMenu = document.getElementById('btn-menu');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('sidebar-overlay');

    if (btnMenu && sidebar && overlay) {
        function toggleMenu() {
            sidebar.classList.toggle('open');
            overlay.classList.toggle('show');
        }
        btnMenu.addEventListener('click', toggleMenu);
        overlay.addEventListener('click', toggleMenu);

        // Fecha ao clicar em um item
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                if (window.innerWidth <= 900) {
                    sidebar.classList.remove('open');
                    overlay.classList.remove('show');
                }
            });
        });
    }

    // ── Exportação CSV ────────────────────────────────────────
    document.getElementById('btn-export-csv').addEventListener('click', exportCSV);

    // ── Exportação Excel ──────────────────────────────────────
    document.getElementById('btn-export-xls').addEventListener('click', exportExcel);

    // ── Exportação PDF ────────────────────────────────────────
    document.getElementById('btn-export-pdf').addEventListener('click', exportPDF);

    // ── Relatório Executivo ─────────────────────────────────
    const btnReport = document.getElementById('btn-export-report');
    if (btnReport) btnReport.addEventListener('click', generateExecutiveReport);
}

// ── Integração GeoViz (Mapa SVG) ──────────────────────────────
function initMap() {
    const container = document.getElementById('mapa-container');
    if (!container || typeof mapaNordesteSVG === 'undefined') return;

    container.innerHTML = mapaNordesteSVG;

    // Ajusta viewBox dinamicamente se necessário para o container
    const svg = container.querySelector('svg');
    svg.style.width = '100%';
    svg.style.height = '100%';
    svg.style.filter = 'drop-shadow(0px 8px 16px rgba(0,0,0,0.4))';

    // Mapeamento das siglas dos paths SVG para a string "Estado" do seletor
    const estadoToUf = {
        "Maranhão": "MA", "Piauí": "PI", "Ceará": "CE",
        "Rio Grande do Norte": "RN", "Paraíba": "PB", "Pernambuco": "PE",
        "Alagoas": "AL", "Sergipe": "SE", "Bahia": "BA"
    };

    const ufToEstado = Object.fromEntries(Object.entries(estadoToUf).map(([k, v]) => [v, k]));

    // Eventos de clique nos estados do mapa
    const shapes = svg.querySelectorAll('.estado-shape');
    shapes.forEach(shape => {
        shape.addEventListener('click', (e) => {
            const sigla = shape.id;
            const nomeEstado = ufToEstado[sigla];
            if (!nomeEstado) return;

            // Toggle logic: se clicou no que já tá selecionado, desmarca (volta para "Todos")
            if (estado === nomeEstado) {
                estado = 'Todos';
            } else {
                estado = nomeEstado;
            }

            // Syncrona a UI (Select do Topo) com o estado do Mapa
            const selEstado = document.getElementById('sel-estado');
            if (selEstado) selEstado.value = estado;

            render();
        });

        // Tooltips nativos SVG Title para ajudar no UX
        const nome = shape.getAttribute('data-nome');
        if (nome) {
            const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
            title.textContent = nome + ' (Clique para filtrar o Dashboard)';
            shape.appendChild(title);
        }
    });
}

function updateMapSelection() {
    const shapes = document.querySelectorAll('.estado-shape');
    if (!shapes.length) return;

    shapes.forEach(shape => shape.classList.remove('selected'));

    const estadoToUf = {
        "Maranhão": "MA", "Piauí": "PI", "Ceará": "CE",
        "Rio Grande do Norte": "RN", "Paraíba": "PB", "Pernambuco": "PE",
        "Alagoas": "AL", "Sergipe": "SE", "Bahia": "BA"
    };

    if (estado !== 'Todos') {
        const uf = estadoToUf[estado];
        if (uf) {
            const shapeSel = document.getElementById(uf);
            if (shapeSel) shapeSel.classList.add('selected');
        }
    }
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
    renderHeatmap();
    renderBubbleChart();
    renderRadarChart();
    renderInsights();
    renderSimulador();
    renderProspecoes2026();
    updateMapSelection();

    // Update mapa badge se existir
    const badgeMapa = document.getElementById('badge-mapa');
    if (badgeMapa) badgeMapa.textContent = estado === 'Todos' ? 'Nordeste' : estado;
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

// ── Heatmap de Sazonalidade ──────────────────────────────────
function renderHeatmap() {
    const canvas = document.getElementById('chart-heatmap');
    if (!canvas) return;
    const states = ESTADOS;
    const months = sazonalidadePerEstado.labels;
    const matrix = states.map(s => sazonalidadePerEstado[s]);
    const shortNames = states.map(s => {
        const parts = s.split(' ');
        return parts.length > 2 ? UF_SIGLAS[s] : parts[0];
    });
    drawHeatmapChart('chart-heatmap', shortNames, months, matrix);
}

// ── Bubble Chart BCG ─────────────────────────────────────────
function renderBubbleChart() {
    const canvas = document.getElementById('chart-bubble');
    if (!canvas) return;
    const idx = periodoIdx(periodo);
    const bubbles = ESTADOS.map(est => {
        const p = prospecoes2026.find(p => p.estado === est);
        const vol = chegadasInt[est][idx];
        const rec = receita[est][idx];
        const efficiency = vol > 0 ? (rec / vol) * 1000000 : 0;
        return {
            label: UF_SIGLAS[est],
            x: p ? p.cagr : 0,
            y: Math.round(efficiency),
            size: vol,
            color: p ? p.cor : '#00B4D8'
        };
    });
    drawBubbleChart('chart-bubble', bubbles, {
        xLabel: 'CAGR 3 anos (%)',
        yLabel: 'Receita por Turista (R$)',
        xFormat: v => v.toFixed(0) + '%',
        yFormat: v => 'R$' + (v / 1000).toFixed(0) + 'k'
    });
    const badge = document.getElementById('badge-bubble');
    if (badge) badge.textContent = periodo;
}

// ── Radar Comparativo ────────────────────────────────────────
function computeRadarScores(est, idx) {
    // Normaliza cada eixo para 0-100 com base nos valores do NE
    const allCagr = ESTADOS.map(e => {
        const p = prospecoes2026.find(pr => pr.estado === e);
        return p ? p.cagr : 0;
    });
    const allEff = ESTADOS.map(e => {
        const vol = chegadasInt[e][idx];
        return vol > 0 ? (receita[e][idx] / vol) * 1000000 : 0;
    });
    const allVol = ESTADOS.map(e => chegadasInt[e][idx]);
    const allInfra = ESTADOS.map(e => ocupacao[e][idx]);
    const allPot = ESTADOS.map(e => {
        const p = prospecoes2026.find(pr => pr.estado === e);
        return p ? p.indice : 0;
    });
    const allSaz = ESTADOS.map(e => {
        const data = sazonalidadePerEstado[e];
        const mean = data.reduce((a, b) => a + b, 0) / data.length;
        const variance = data.reduce((a, b) => a + (b - mean) ** 2, 0) / data.length;
        const cv = Math.sqrt(variance) / mean;
        return (1 - cv) * 100; // Lower CV = more regular = higher score
    });

    function normalize(arr, val) {
        const min = Math.min(...arr);
        const max = Math.max(...arr);
        return max === min ? 50 : ((val - min) / (max - min)) * 100;
    }

    const p = prospecoes2026.find(pr => pr.estado === est);
    const cagr = p ? p.cagr : 0;
    const vol = chegadasInt[est][idx];
    const eff = vol > 0 ? (receita[est][idx] / vol) * 1000000 : 0;
    const infra = ocupacao[est][idx];
    const pot = p ? p.indice : 0;
    const sazData = sazonalidadePerEstado[est];
    const sazMean = sazData.reduce((a, b) => a + b, 0) / sazData.length;
    const sazVar = sazData.reduce((a, b) => a + (b - sazMean) ** 2, 0) / sazData.length;
    const sazScore = (1 - Math.sqrt(sazVar) / sazMean) * 100;

    return [
        normalize(allCagr, cagr),
        normalize(allEff, eff),
        normalize(allVol, vol),
        normalize(allInfra, infra),
        normalize(allPot, pot),
        normalize(allSaz, sazScore)
    ];
}

function renderRadarChart() {
    const canvas = document.getElementById('chart-radar');
    if (!canvas) return;
    const idx = periodoIdx(periodo);

    // Average NE scores
    const avgScores = RADAR_AXES.map((_, ai) => {
        return ESTADOS.reduce((s, e) => s + computeRadarScores(e, idx)[ai], 0) / ESTADOS.length;
    });

    const datasets = [{
        label: 'Média NE',
        data: avgScores,
        color: '#8896B3'
    }];

    if (estado !== 'Todos') {
        const scores = computeRadarScores(estado, idx);
        datasets.unshift({
            label: estado,
            data: scores,
            color: '#00B4D8'
        });
    }

    drawRadarChart('chart-radar', RADAR_AXES, datasets, { maxVal: 100, levels: 5 });

    // Badge
    const badge = document.getElementById('badge-radar');
    if (badge) badge.textContent = estado === 'Todos' ? 'Nordeste' : UF_SIGLAS[estado] || estado;

    // Subtitle
    const sub = document.getElementById('radar-subtitle');
    if (sub) sub.textContent = estado === 'Todos'
        ? 'Selecione um estado para comparar com a média NE'
        : `${estado} vs. Média NE · 6 dimensões`;

    // Detail list
    const list = document.getElementById('radar-detail-list');
    if (!list) return;
    const scores = estado !== 'Todos' ? computeRadarScores(estado, idx) : avgScores;
    list.innerHTML = RADAR_AXES.map((axis, i) => `
        <div class="radar-detail-item">
            <span class="radar-detail-axis">${axis}</span>
            <div class="radar-detail-bar">
                <div class="radar-detail-bar-fill" style="width:${scores[i].toFixed(0)}%"></div>
            </div>
            <span class="radar-detail-value">${scores[i].toFixed(0)}</span>
        </div>
    `).join('');
}

// ── Insights Automáticos ─────────────────────────────────────
function generateInsights() {
    const idx = periodoIdx(periodo);
    const idxPrev = idx > 0 ? idx - 1 : null;
    const insights = [];

    // 1. CAGR leaders
    const sortedByCagr = [...prospecoes2026].sort((a, b) => b.cagr - a.cagr);
    const avgCagr = prospecoes2026.reduce((s, p) => s + p.cagr, 0) / prospecoes2026.length;

    sortedByCagr.slice(0, 2).forEach(d => {
        if (d.cagr > avgCagr * INSIGHT_THRESHOLDS.highGrowth) {
            insights.push({
                type: 'success', icon: '🚀',
                title: `${d.estado}: Crescimento ${(d.cagr / avgCagr).toFixed(1)}x acima da média`,
                body: `CAGR de ${d.cagr}% contra média de ${avgCagr.toFixed(1)}% do Nordeste. Janela de investimento aberta para capturar crescimento acelerado.`,
                state: d.estado
            });
        }
    });

    // 2. Efficiency leaders (receita/turista)
    const effData = ESTADOS.map(e => ({
        estado: e,
        eff: chegadasInt[e][idx] > 0 ? (receita[e][idx] / chegadasInt[e][idx]) * 1000000 : 0
    })).sort((a, b) => b.eff - a.eff);
    const avgEff = effData.reduce((s, d) => s + d.eff, 0) / effData.length;

    if (effData[0].eff > avgEff * INSIGHT_THRESHOLDS.highEfficiency) {
        insights.push({
            type: 'info', icon: '💎',
            title: `${effData[0].estado}: Maior eficiência econômica do NE`,
            body: `Receita de R$ ${Math.round(effData[0].eff).toLocaleString('pt-BR')} por turista — ${(effData[0].eff / avgEff).toFixed(1)}x a média regional. Perfil de turismo premium.`,
            state: effData[0].estado
        });
    }

    // 3. Seasonal concentration
    ESTADOS.forEach(e => {
        const data = sazonalidadePerEstado[e];
        const mean = data.reduce((a, b) => a + b, 0) / data.length;
        const variance = data.reduce((a, b) => a + (b - mean) ** 2, 0) / data.length;
        const cv = Math.sqrt(variance) / mean;
        if (cv > INSIGHT_THRESHOLDS.seasonalConcentration) {
            const peakMonth = sazonalidadePerEstado.labels[data.indexOf(Math.max(...data))];
            insights.push({
                type: 'warning', icon: '📅',
                title: `${e}: Alta concentração sazonal`,
                body: `Coeficiente de variação de ${(cv * 100).toFixed(0)}%. Pico em ${peakMonth}. Oportunidade de investir em diversificação para meses de baixa.`,
                state: e
            });
        }
    });

    // 4. Low occupancy = infrastructure opportunity
    ESTADOS.forEach(e => {
        if (ocupacao[e][idx] < INSIGHT_THRESHOLDS.lowOccupancy) {
            insights.push({
                type: 'alert', icon: '🏨',
                title: `${e}: Ocupação hoteleira abaixo de ${INSIGHT_THRESHOLDS.lowOccupancy}%`,
                body: `Taxa atual de ${ocupacao[e][idx]}%. Indica necessidade de investimento em marketing e conectividade aérea para elevar a demanda.`,
                state: e
            });
        }
    });

    // 5. YoY acceleration
    if (idxPrev !== null && idx >= 2) {
        ESTADOS.forEach(e => {
            const curr = chegadasInt[e][idx];
            const prev = chegadasInt[e][idxPrev];
            const prevPrev = chegadasInt[e][idx - 2];
            const growthCurr = prev > 0 ? (curr - prev) / prev : 0;
            const growthPrev = prevPrev > 0 ? (prev - prevPrev) / prevPrev : 0;
            if (growthCurr > growthPrev * 1.5 && growthCurr > 0.15) {
                insights.push({
                    type: 'success', icon: '📈',
                    title: `${e}: Aceleração de crescimento detectada`,
                    body: `Crescimento de ${(growthCurr * 100).toFixed(1)}% em ${periodo} vs ${(growthPrev * 100).toFixed(1)}% no período anterior. Trajetória ascendente reforçada.`,
                    state: e
                });
            }
        });
    }

    // 6. Top opportunity index
    const topOp = prospecoes2026[0];
    insights.push({
        type: 'info', icon: '🎯',
        title: `${topOp.estado}: Líder no Índice de Oportunidade BNB`,
        body: `Score de ${topOp.indice}/100. ${topOp.rationale.substring(0, 100)}`,
        state: topOp.estado
    });

    // 7. Highest absolute growth
    if (idxPrev !== null) {
        const growths = ESTADOS.map(e => ({
            estado: e,
            abs: chegadasInt[e][idx] - chegadasInt[e][idxPrev]
        })).sort((a, b) => b.abs - a.abs);
        insights.push({
            type: 'info', icon: '✈️',
            title: `${growths[0].estado}: Maior ganho absoluto de turistas`,
            body: `+${growths[0].abs.toLocaleString('pt-BR')} chegadas internacionais em ${periodo} vs ${PERIODOS[idxPrev]}. Volume bruto que sustenta a cadeia produtiva local.`,
            state: growths[0].estado
        });
    }

    // Filter by selected state if not "Todos"
    if (estado !== 'Todos') {
        return insights.filter(i => i.state === estado || !i.state);
    }
    return insights;
}

function renderInsights() {
    const grid = document.getElementById('insights-grid');
    const summary = document.getElementById('insights-summary');
    if (!grid) return;

    const insights = generateInsights();
    const successCount = insights.filter(i => i.type === 'success').length;
    const warningCount = insights.filter(i => i.type === 'warning').length;
    const alertCount = insights.filter(i => i.type === 'alert').length;

    if (summary) {
        summary.innerHTML = `
            <div class="insights-summary-card">
                <div class="sum-value" style="color:#06D6A0;">${successCount}</div>
                <div class="sum-label">Oportunidades</div>
            </div>
            <div class="insights-summary-card">
                <div class="sum-value" style="color:#F4A261;">${warningCount}</div>
                <div class="sum-label">Pontos de Atenção</div>
            </div>
            <div class="insights-summary-card">
                <div class="sum-value" style="color:#E76F51;">${alertCount}</div>
                <div class="sum-label">Alertas</div>
            </div>
        `;
    }

    grid.innerHTML = insights.map(ins => `
        <div class="insight-card ${ins.type}">
            <div class="insight-icon">${ins.icon}</div>
            <div class="insight-title">${ins.title}</div>
            <div class="insight-body">${ins.body}</div>
            <span class="insight-tag ${ins.type}">${ins.type === 'success' ? 'oportunidade' : ins.type === 'warning' ? 'atenção' : ins.type === 'alert' ? 'alerta' : 'informação'}</span>
        </div>
    `).join('');
}

// ── Simulador de Investimento What-If ────────────────────────
function initSimulador() {
    const slider = document.getElementById('sim-slider');
    const input = document.getElementById('sim-valor');
    const selEst = document.getElementById('sim-estado');
    if (!slider || !input || !selEst) return;

    // Populate
    selEst.innerHTML = ESTADOS.map(e => `<option value="${e}">${e}</option>`).join('');

    slider.addEventListener('input', () => { input.value = slider.value; renderSimulador(); });
    input.addEventListener('input', () => {
        let v = Math.min(500, Math.max(1, parseInt(input.value) || 1));
        input.value = v;
        slider.value = v;
        renderSimulador();
    });
    selEst.addEventListener('change', renderSimulador);
}

function renderSimulador() {
    const valorEl = document.getElementById('sim-valor');
    const estEl = document.getElementById('sim-estado');
    if (!valorEl || !estEl) return;

    const valor = parseFloat(valorEl.value) || 50;
    const est = estEl.value;
    const profile = STATE_INVESTMENT_PROFILE[est];
    if (!profile) return;

    const avgMult = (MULTIPLIERS.economicMultiplier.min + MULTIPLIERS.economicMultiplier.max) / 2;
    const retornoEconomico = valor * avgMult * profile.efficiency;
    const empregosGerados = Math.round(valor * profile.jobMult);
    const turistasAdicionais = Math.round(valor * profile.touristMult);
    const roi = ((retornoEconomico / valor - 1) * 100).toFixed(0);

    function fmtBRL(n) {
        if (n >= 1000) return 'R$ ' + (n / 1000).toFixed(1) + ' bi';
        return 'R$ ' + n.toFixed(0) + ' mi';
    }

    setKPI('sim-kpi-retorno', fmtBRL(retornoEconomico), null);
    setKPI('sim-kpi-empregos', empregosGerados.toLocaleString('pt-BR') + ' empregos', null);
    setKPI('sim-kpi-turistas', turistasAdicionais.toLocaleString('pt-BR') + ' turistas', null);
    setKPI('sim-kpi-roi', roi + '%', null);

    // KPI trend texts
    const trendRetorno = document.querySelector('#sim-kpi-retorno .kpi-trend');
    if (trendRetorno) { trendRetorno.textContent = `Multiplicador ${(avgMult * profile.efficiency).toFixed(1)}x`; trendRetorno.className = 'kpi-trend'; trendRetorno.style.display = ''; }
    const trendEmp = document.querySelector('#sim-kpi-empregos .kpi-trend');
    if (trendEmp) { trendEmp.textContent = `${profile.jobMult} empregos/R$ mi`; trendEmp.className = 'kpi-trend'; trendEmp.style.display = ''; }
    const trendTur = document.querySelector('#sim-kpi-turistas .kpi-trend');
    if (trendTur) { trendTur.textContent = `${profile.touristMult.toLocaleString('pt-BR')} turistas/R$ mi`; trendTur.className = 'kpi-trend'; trendTur.style.display = ''; }
    const trendRoi = document.querySelector('#sim-kpi-roi .kpi-trend');
    if (trendRoi) { trendRoi.textContent = `Eficiência: ${profile.efficiency.toFixed(2)}x`; trendRoi.className = 'kpi-trend'; trendRoi.style.display = ''; }

    // Antes vs Depois bar chart
    const idx = periodoIdx(periodo);
    const receitaAtual = receita[est][idx];
    const empregosAtuais = empregos[est][idx];
    const turistasAtuais = chegadasInt[est][idx];

    const receitaPos = receitaAtual + retornoEconomico;
    const empregosPos = empregosAtuais + empregosGerados;
    const turistasPos = turistasAtuais + turistasAdicionais;

    // Normalize for grouped chart
    drawBarChart('chart-sim-antes-depois',
        ['Receita (R$ mi)', 'Empregos', 'Turistas'],
        [
            { label: 'Atual', data: [receitaAtual, empregosAtuais, turistasAtuais / 100], color: '#8896B3', color2: '#4A5568' },
            { label: 'Pós-Investimento', data: [receitaPos, empregosPos, turistasPos / 100], color: '#06D6A0', color2: '#00B4D8' }
        ],
        { yFormat: v => v >= 1000 ? (v / 1000).toFixed(1) + 'k' : Math.round(v) }
    );

    // Efficiency per state bar chart
    const effLabels = ESTADOS.map(e => UF_SIGLAS[e]);
    const effData = ESTADOS.map(e => {
        const p = STATE_INVESTMENT_PROFILE[e];
        return p ? p.efficiency * avgMult : 0;
    });
    drawBarChart('chart-sim-eficiencia', effLabels,
        [{ label: 'Multiplicador efetivo', data: effData, color: '#00B4D8', color2: '#0077B6' }],
        { yFormat: v => v.toFixed(1) + 'x' }
    );

    const badge = document.getElementById('badge-sim');
    if (badge) badge.textContent = est.split(' ')[0];
}

// ── Relatório Executivo PDF ──────────────────────────────────
function generateExecutiveReport() {
    const idx = periodoIdx(periodo);
    const estados = estado === 'Todos' ? ESTADOS : [estado];

    const totalTuristas = estados.reduce((s, e) => s + chegadasInt[e][idx], 0);
    const totalReceita = estados.reduce((s, e) => s + receita[e][idx], 0);
    const mediaOcupacao = (estados.reduce((s, e) => s + ocupacao[e][idx], 0) / estados.length).toFixed(1);
    const totalEmpregos = estados.reduce((s, e) => s + empregos[e][idx], 0);

    // Capture visible charts
    const chartImages = {};
    ['chart-estados', 'chart-temporal', 'chart-bubble', 'chart-heatmap', 'chart-radar'].forEach(id => {
        const c = document.getElementById(id);
        if (c && c.width > 0) {
            try { chartImages[id] = c.toDataURL('image/png'); } catch (e) { /* ignore */ }
        }
    });

    const top4 = prospecoes2026.slice(0, 4);
    const dataAtual = new Date().toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' });

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Relatório Executivo ObIT-NE · BNB</title>
<style>
  body { font-family: Arial, Helvetica, sans-serif; color: #222; max-width: 210mm; margin: 0 auto; padding: 20mm 16mm; line-height: 1.6; }
  .cover { text-align: center; page-break-after: always; padding-top: 25vh; }
  .cover .brand { color: #0077B6; font-size: 11pt; letter-spacing: 4px; text-transform: uppercase; }
  .cover h1 { color: #0077B6; font-size: 28pt; margin: 16px 0 8px; }
  .cover .sub { color: #666; font-size: 13pt; }
  .cover .date { color: #999; font-size: 10pt; margin-top: 24px; }
  .cover .line { width: 80px; height: 3px; background: linear-gradient(90deg, #0077B6, #00B4D8); margin: 20px auto; border-radius: 2px; }
  h2 { color: #0077B6; border-bottom: 2px solid #0077B6; padding-bottom: 4px; margin-top: 28px; font-size: 14pt; }
  .kpi-row { display: flex; gap: 12px; margin: 16px 0; flex-wrap: wrap; }
  .kpi-box { flex: 1; min-width: 120px; padding: 14px; background: #f0f8ff; border: 1px solid #b0d4ea; border-radius: 8px; text-align: center; }
  .kpi-box h3 { color: #0077B6; font-size: 20pt; margin: 0; }
  .kpi-box p { color: #555; font-size: 8pt; margin-top: 4px; text-transform: uppercase; letter-spacing: 1px; }
  .op-card { padding: 12px 16px; margin: 8px 0; background: #fffbe6; border-left: 4px solid #FFA502; border-radius: 4px; }
  .op-card strong { color: #0077B6; }
  .op-card .score { float: right; font-weight: bold; color: #FF4757; }
  .chart-img { max-width: 100%; margin: 12px 0; border: 1px solid #ddd; border-radius: 8px; }
  .footer { text-align: center; font-size: 8pt; color: #888; margin-top: 40px; border-top: 1px solid #ddd; padding-top: 8px; }
  .nota { font-size: 9pt; color: #555; background: #f8f9fa; padding: 12px; border-radius: 6px; margin-top: 16px; }
  @page { size: A4 portrait; margin: 16mm; }
  @media print { body { padding: 0; } .cover { padding-top: 30vh; } }
</style>
</head>
<body>
  <div class="cover">
    <p class="brand">Banco do Nordeste do Brasil</p>
    <div class="line"></div>
    <h1>Relatório Executivo<br>Inteligência Turística</h1>
    <p class="sub">Observatório do Turismo do Nordeste (ObIT-NE)</p>
    <p class="date">${dataAtual}</p>
    <p style="color:#999; font-size:9pt; margin-top:40px;">Período de análise: ${periodo} · ${estado === 'Todos' ? 'Todos os estados do NE' : estado}</p>
  </div>

  <h2>1. Resumo Executivo</h2>
  <div class="kpi-row">
    <div class="kpi-box"><h3>${totalTuristas.toLocaleString('pt-BR')}</h3><p>Chegadas Internacionais</p></div>
    <div class="kpi-box"><h3>R$ ${(totalReceita / 1000).toFixed(1)} bi</h3><p>Receita Turística</p></div>
    <div class="kpi-box"><h3>${mediaOcupacao}%</h3><p>Ocupação Hoteleira</p></div>
    <div class="kpi-box"><h3>${totalEmpregos.toLocaleString('pt-BR')} mil</h3><p>Empregos Diretos</p></div>
  </div>

  <h2>2. Top 4 Oportunidades de Investimento BNB</h2>
  ${top4.map((d, i) => `
  <div class="op-card">
    <span class="score">${d.indice}/100</span>
    <strong>${i + 1}. ${d.estado} (${d.uf})</strong> — CAGR: ${d.cagr}% · Classificação: ${d.classificacao}
    <p style="margin:4px 0 0; color:#555; font-size:9pt;">${d.rationale}</p>
  </div>`).join('')}

  <h2>3. Análise Visual</h2>
  ${Object.entries(chartImages).map(([id, src]) => {
    const titles = { 'chart-estados': 'Comparativo por Estado', 'chart-temporal': 'Evolução Temporal', 'chart-bubble': 'Matriz BCG', 'chart-heatmap': 'Heatmap Sazonalidade', 'chart-radar': 'Radar Comparativo' };
    return `<p style="font-size:10pt;color:#0077B6;font-weight:bold;margin-top:12px;">${titles[id] || id}</p><img class="chart-img" src="${src}" alt="${id}">`;
  }).join('')}

  <h2>4. Nota Metodológica</h2>
  <div class="nota">
    <strong>Projeções 2026:</strong> Regressão Linear OLS sobre série 2021–2025.<br>
    <strong>Índice de Oportunidade BNB:</strong> CAGR 3 anos (35%) + Potencial não explorado (35%) + Eficiência econômica (30%).<br>
    <strong>Fontes:</strong> EMBRATUR/Polícia Federal · PNAD Contínua Turismo IBGE 2024 · MTur.<br>
    <strong>Multiplicadores:</strong> Conta Satélite do Turismo MTur/FGV — R$1 investido gera R$5–7 na economia local.<br>
    <em>* Valores 2025/2026 são estimativas/projeções. Não constituem garantia de resultado.</em>
  </div>

  <div class="footer">
    Gerado em ${new Date().toLocaleString('pt-BR')} · Dashboard ObIT-NE · Banco do Nordeste do Brasil<br>
    Dados: EMBRATUR/PF + PNAD Contínua IBGE 2024 · Projeções por Regressão Linear OLS
  </div>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
    downloadBlob(blob, `relatorio_executivo_obit_ne_${periodo}.html`);
}

// ── Redimensionamento ─────────────────────────────────────────
window.addEventListener('resize', () => { clearTimeout(window._rt); window._rt = setTimeout(render, 200); });
