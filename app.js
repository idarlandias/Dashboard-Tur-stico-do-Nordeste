// ============================================================
// Dashboard Turístico do Nordeste – Lógica principal
// ============================================================

const DashboardState = {
    _estado: 'Todos',
    _cidade: 'Todas',
    _tipo: 'Todos',
    _mes: 'Todos',
    _indicador: 'clientes',
    _listeners: [],

    get estado() { return this._estado; },
    get cidade() { return this._cidade; },
    get tipo() { return this._tipo; },
    get mes() { return this._mes; },
    get indicador() { return this._indicador; },

    set estado(v) { if (this._estado !== v) { this._estado = v; this._cidade = 'Todas'; this._notify(); } },
    set cidade(v) { if (this._cidade !== v) { this._cidade = v; this._notify(); } },
    set tipo(v) { if (this._tipo !== v) { this._tipo = v; this._notify(); } },
    set mes(v) { if (this._mes !== v) { this._mes = v; this._notify(); } },
    set indicador(v) { if (this._indicador !== v) { this._indicador = v; this._notify(); } },

    setSilent(key, value) { this['_' + key] = value; },
    onChange(fn) { this._listeners.push(fn); },
    _notify() { this._listeners.forEach(fn => fn()); }
};

DashboardState.onChange(() => render());

// ── Inicialização ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    populateSelects();
    initMap();
    bindEvents();
    render();
});

// ── População de selects ──────────────────────────────────────
function populateSelects() {
    const selEstado = document.getElementById('sel-estado');
    const selCidade = document.getElementById('sel-cidade');
    const selTipo = document.getElementById('sel-tipo');
    const selMes = document.getElementById('sel-mes');

    selEstado.innerHTML = '<option value="Todos">Todos os estados</option>';
    ESTADOS.forEach(e => {
        const opt = document.createElement('option');
        opt.value = e; opt.textContent = e;
        selEstado.appendChild(opt);
    });

    populateCidades();

    if (selTipo) {
        selTipo.innerHTML = '<option value="Todos">Todos os tipos</option>';
        TIPOS.forEach(t => {
            const opt = document.createElement('option');
            opt.value = t; opt.textContent = t;
            selTipo.appendChild(opt);
        });
    }

    if (selMes) {
        selMes.innerHTML = '<option value="Todos">Todos os meses</option>';
        PERIODOS.forEach((m, i) => {
            const opt = document.createElement('option');
            opt.value = String(i); opt.textContent = MESES_FULL[i];
            selMes.appendChild(opt);
        });
    }
}

function populateCidades() {
    const selCidade = document.getElementById('sel-cidade');
    if (!selCidade) return;
    selCidade.innerHTML = '<option value="Todas">Todas as cidades</option>';
    const cidades = DashboardState.estado === 'Todos'
        ? TODAS_CIDADES
        : (CIDADES_POR_ESTADO[DashboardState.estado] || []);
    cidades.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c; opt.textContent = c;
        selCidade.appendChild(opt);
    });
}

// ── Bind de eventos ───────────────────────────────────────────
function bindEvents() {
    document.getElementById('sel-estado').addEventListener('change', e => {
        DashboardState.estado = e.target.value;
        populateCidades();
    });

    const selCidade = document.getElementById('sel-cidade');
    if (selCidade) selCidade.addEventListener('change', e => { DashboardState.cidade = e.target.value; });

    const selTipo = document.getElementById('sel-tipo');
    if (selTipo) selTipo.addEventListener('change', e => { DashboardState.tipo = e.target.value; });

    const selMes = document.getElementById('sel-mes');
    if (selMes) selMes.addEventListener('change', e => { DashboardState.mes = e.target.value; });

    document.querySelectorAll('.chip').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            DashboardState.indicador = chip.dataset.ind;
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

        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                if (window.innerWidth <= 900) {
                    sidebar.classList.remove('open');
                    overlay.classList.remove('show');
                }
            });
        });
    }

    // ── Exportação ──────────────────────────────────────────────
    const btnCsv = document.getElementById('btn-export-csv');
    const btnXls = document.getElementById('btn-export-xls');
    const btnPdf = document.getElementById('btn-export-pdf');
    if (btnCsv) btnCsv.addEventListener('click', exportCSV);
    if (btnXls) btnXls.addEventListener('click', exportExcel);
    if (btnPdf) btnPdf.addEventListener('click', exportPDF);
}

// ── Mapa SVG ──────────────────────────────────────────────────
function initMap() {
    const container = document.getElementById('mapa-container');
    if (!container || typeof mapaNordesteSVG === 'undefined') return;

    container.innerHTML = mapaNordesteSVG;
    const svg = container.querySelector('svg');
    svg.style.width = '100%';
    svg.style.height = '100%';
    svg.style.filter = 'drop-shadow(0px 8px 16px rgba(0,0,0,0.4))';

    const ufToEstado = { "CE": "Ceará", "RN": "Rio Grande do Norte", "PE": "Pernambuco", "PI": "Piauí" };

    const shapes = svg.querySelectorAll('.estado-shape');
    shapes.forEach(shape => {
        const sigla = shape.id;
        if (!ufToEstado[sigla]) {
            shape.style.opacity = '0.3';
            shape.style.pointerEvents = 'none';
            return;
        }
        shape.addEventListener('click', () => {
            const nomeEstado = ufToEstado[sigla];
            if (DashboardState.estado === nomeEstado) {
                DashboardState.setSilent('estado', 'Todos');
            } else {
                DashboardState.setSilent('estado', nomeEstado);
            }
            DashboardState.setSilent('cidade', 'Todas');
            populateCidades();
            const selEstado = document.getElementById('sel-estado');
            if (selEstado) selEstado.value = DashboardState.estado;
            const selCidade = document.getElementById('sel-cidade');
            if (selCidade) selCidade.value = 'Todas';
            render();
        });

        const nome = shape.getAttribute('data-nome');
        if (nome) {
            const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
            title.textContent = nome + ' (Clique para filtrar)';
            shape.appendChild(title);
        }
    });
}

function updateMapSelection() {
    const shapes = document.querySelectorAll('.estado-shape');
    if (!shapes.length) return;
    shapes.forEach(shape => shape.classList.remove('selected'));
    if (DashboardState.estado !== 'Todos') {
        const uf = UF_SIGLAS[DashboardState.estado];
        if (uf) {
            const shapeSel = document.getElementById(uf);
            if (shapeSel) shapeSel.classList.add('selected');
        }
    }
}

// ── Helpers de dados filtrados ────────────────────────────────
function getFilteredMonthlyData(metric) {
    const estado = DashboardState.estado;
    const cidade = DashboardState.cidade;
    const tipo = DashboardState.tipo;

    if (tipo !== 'Todos' && dadosPorTipo[tipo]) {
        return dadosPorTipo[tipo][metric];
    }

    if (cidade !== 'Todas' && dadosPorCidade[cidade]) {
        return dadosPorCidade[cidade][metric];
    }

    const datasets = { clientes, receita, ocupacao, avaliacao };
    const ds = datasets[metric];

    if (estado === 'Todos') {
        if (metric === 'ocupacao' || metric === 'avaliacao') {
            return PERIODOS.map((_, i) => {
                const vals = ESTADOS.map(e => ds[e][i]);
                return parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1));
            });
        }
        return PERIODOS.map((_, i) => ESTADOS.reduce((s, e) => s + ds[e][i], 0));
    }

    return ds[estado] || PERIODOS.map(() => 0);
}

function getAggregatedValue(metric) {
    const data = getFilteredMonthlyData(metric);
    const mesIdx = DashboardState.mes !== 'Todos' ? parseInt(DashboardState.mes) : null;

    if (mesIdx !== null) return data[mesIdx] || 0;

    if (metric === 'ocupacao' || metric === 'avaliacao') {
        return parseFloat((data.reduce((a, b) => a + b, 0) / data.length).toFixed(1));
    }
    return data.reduce((a, b) => a + b, 0);
}

// ── Exportação ────────────────────────────────────────────────
function buildDataRows() {
    const rows = [];
    ESTADOS.forEach(est => {
        PERIODOS.forEach((mes, idx) => {
            rows.push({
                Estado: est,
                Mês: MESES_FULL[idx],
                Clientes: clientes[est][idx],
                Receita_BRL: receita[est][idx].toFixed(2),
                Ocupacao_Pct: ocupacao[est][idx],
                Avaliacao: avaliacao[est][idx],
            });
        });
    });
    return rows;
}

function exportCSV() {
    const rows = buildDataRows();
    const header = Object.keys(rows[0]).join(';');
    const body = rows.map(r => Object.values(r).join(';')).join('\n');
    const blob = new Blob(['\uFEFF' + header + '\n' + body], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, 'dashboard_turismo_nordeste.csv');
}

function exportExcel() {
    const rows = buildDataRows();
    const header = `<tr>${Object.keys(rows[0]).map(h => `<th style="background:#0077B6;color:#fff;font-weight:bold;padding:6px 10px;">${h}</th>`).join('')}</tr>`;
    const body = rows.map((r, i) => {
        const bg = i % 2 === 0 ? '#EBF5FB' : '#fff';
        return `<tr>${Object.values(r).map(v => `<td style="padding:5px 10px;background:${bg};">${v}</td>`).join('')}</tr>`;
    }).join('');
    const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:x="urn:schemas-microsoft-com:office:excel"
      xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="UTF-8">
<style>table{border-collapse:collapse;font-family:Arial;font-size:10pt;}td,th{border:1px solid #ccc;}</style>
</head><body>
<h2 style="color:#0077B6;font-family:Arial;">Dashboard Turístico do Nordeste</h2>
<table>${header}${body}</table>
</body></html>`;
    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    downloadBlob(blob, 'dashboard_turismo_nordeste.xls');
}

function exportPDF() {
    const sections = document.querySelectorAll('.dash-section');
    const prevDisplay = [];
    sections.forEach((s, i) => { prevDisplay[i] = s.style.display; s.style.display = ''; });
    window.print();
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
    renderTipoDistribuicao();
    updateMapSelection();

    const badgeMapa = document.getElementById('badge-mapa');
    if (badgeMapa) badgeMapa.textContent = DashboardState.estado === 'Todos' ? 'Nordeste' : DashboardState.estado;
}

// ── KPIs ──────────────────────────────────────────────────────
function renderKPIs() {
    const totalClientes = getAggregatedValue('clientes');
    const totalReceita = getAggregatedValue('receita');
    const mediaOcupacao = getAggregatedValue('ocupacao');
    const mediaAvaliacao = getAggregatedValue('avaliacao');

    function fmtNum(n) {
        return Math.round(n).toLocaleString('pt-BR');
    }
    function fmtRec(n) {
        if (n >= 1000000000) return 'R$ ' + (n / 1000000000).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + 'B';
        if (n >= 1000000) return 'R$ ' + (n / 1000000).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + 'M';
        if (n >= 1000) return 'R$ ' + (n / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + 'K';
        return 'R$ ' + n.toLocaleString('pt-BR', { maximumFractionDigits: 0 });
    }

    setKPI('kpi-clientes', fmtNum(totalClientes));
    setKPI('kpi-receita', fmtRec(totalReceita));
    setKPI('kpi-ocupacao', mediaOcupacao.toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + '%');
    setKPI('kpi-avaliacao', mediaAvaliacao.toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + ' / 5,0');
}

function setKPI(id, val) {
    const card = document.getElementById(id);
    if (!card) return;
    const valEl = card.querySelector('.kpi-value');
    if (valEl) valEl.textContent = val;
}

// ── Gráficos ──────────────────────────────────────────────────
function renderCharts() {
    const estados = DashboardState.estado === 'Todos' ? ESTADOS : [DashboardState.estado];
    const ind = DashboardState.indicador;
    const datasets = { clientes, receita, ocupacao, avaliacao };
    const ds = datasets[ind] || clientes;
    const indLabel = { clientes: 'Clientes', receita: 'Receita (R$)', ocupacao: 'Ocupação (%)', avaliacao: 'Avaliação (1-5)' }[ind];

    // Comparativo por estado (barras)
    if (DashboardState.estado === 'Todos') {
        const labels1 = estados.map(e => UF_SIGLAS[e]);
        const vals1 = estados.map(e => {
            const arr = ds[e];
            if (ind === 'ocupacao' || ind === 'avaliacao') {
                return parseFloat((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1));
            }
            return arr.reduce((a, b) => a + b, 0);
        });
        drawBarChart('chart-estados', labels1, [{ label: indLabel, data: vals1, color: '#00B4D8', color2: '#0077B6' }], {
            yFormat: v => ind === 'receita' ? 'R$ ' + (v / 1e6).toFixed(1) + 'M' : v >= 1000 ? (v / 1000).toFixed(1) + 'k' : Math.round(v),
        });
    } else {
        // Mostrar cidades do estado
        const cidades = CIDADES_POR_ESTADO[DashboardState.estado] || [];
        const labels1 = cidades;
        const vals1 = cidades.map(c => {
            const cityD = dadosPorCidade[c];
            if (!cityD) return 0;
            const arr = cityD[ind];
            if (ind === 'ocupacao' || ind === 'avaliacao') {
                return parseFloat((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1));
            }
            return arr.reduce((a, b) => a + b, 0);
        });
        drawBarChart('chart-estados', labels1, [{ label: indLabel, data: vals1, color: '#00B4D8', color2: '#0077B6' }], {
            yFormat: v => ind === 'receita' ? 'R$ ' + (v / 1e6).toFixed(1) + 'M' : v >= 1000 ? (v / 1000).toFixed(1) + 'k' : Math.round(v),
        });
    }

    // Evolução temporal (linha mensal)
    const timeData = getFilteredMonthlyData(ind);
    drawLineChart('chart-temporal', PERIODOS, [{ label: indLabel, data: timeData, color: '#06D6A0' }], {
        yFormat: v => ind === 'receita' ? 'R$ ' + (v / 1000).toFixed(0) + 'k' : v >= 1000 ? (v / 1000).toFixed(1) + 'k' : Math.round(v * 10) / 10,
    });

    // Donut — distribuição por tipo
    const perfilEstado = (tipoDistribuicao && tipoDistribuicao[DashboardState.estado])
        ? tipoDistribuicao[DashboardState.estado]
        : tipoDistribuicao["Todos"];
    drawDonutChart('chart-categorias', TIPO_LABELS, perfilEstado, TIPO_COLORS);

    const legend = document.getElementById('donut-legend');
    if (legend) {
        const total = perfilEstado.reduce((a, b) => a + b, 0);
        legend.innerHTML = TIPO_LABELS.map((lbl, i) => `
          <div class="legend-item">
            <div class="legend-dot" style="background:${TIPO_COLORS[i]}"></div>
            <span>${lbl}</span>
            <span class="legend-pct">${perfilEstado[i].toFixed(1)}%</span>
          </div>
        `).join('');
    }

    const badgeGeral = document.getElementById('badge-categorias-geral');
    if (badgeGeral) badgeGeral.textContent = DashboardState.estado === 'Todos' ? 'Nordeste' : DashboardState.estado;
}

// ── Distribuição por Tipo (seção dedicada) ────────────────────
function renderTipoDistribuicao() {
    const perfilEstado = (tipoDistribuicao && tipoDistribuicao[DashboardState.estado])
        ? tipoDistribuicao[DashboardState.estado]
        : tipoDistribuicao["Todos"];

    drawDonutChart('chart-categorias-sec', TIPO_LABELS, perfilEstado, TIPO_COLORS);

    const legendSec = document.getElementById('donut-legend-sec');
    if (legendSec) {
        legendSec.innerHTML = TIPO_LABELS.map((lbl, i) => `
          <div class="legend-item">
            <div class="legend-dot" style="background:${TIPO_COLORS[i]}"></div>
            <span>${lbl}</span>
            <span class="legend-pct">${perfilEstado[i].toFixed(1)}%</span>
          </div>
        `).join('');
    }

    const badgeSec = document.getElementById('badge-categorias');
    if (badgeSec) badgeSec.textContent = DashboardState.estado === 'Todos' ? 'Nordeste' : DashboardState.estado;
    const subSec = document.getElementById('categorias-sub');
    if (subSec) subSec.textContent = DashboardState.estado === 'Todos'
        ? 'Distribuição da receita por tipo de empreendimento · Nordeste'
        : `Distribuição da receita · ${DashboardState.estado}`;
}

// ── Ranking ───────────────────────────────────────────────────
function renderRanking() {
    const list = document.getElementById('ranking-list');
    if (!list) return;

    let filtered = rankingDestinos;
    if (DashboardState.estado !== 'Todos') {
        const uf = UF_SIGLAS[DashboardState.estado];
        filtered = rankingDestinos.filter(d => d.nome.includes(uf));
    }

    const maxV = filtered.length ? filtered[0].receita : 1;
    list.innerHTML = filtered.map((d, i) => `
    <div class="ranking-item">
      <span class="rank-num${i < 3 ? ' top' : ''}">${i + 1}</span>
      <span class="rank-icon">${d.icon}</span>
      <span class="rank-name">${d.nome}</span>
      <div class="rank-bar-wrap">
        <div class="rank-bar-bg">
          <div class="rank-bar" style="width:${(d.receita / maxV * 100).toFixed(0)}%"></div>
        </div>
      </div>
      <span class="rank-value">R$ ${d.receita.toFixed(1)}M</span>
    </div>
  `).join('');
}

// ── Sazonalidade ──────────────────────────────────────────────
function renderSazonalidade() {
    const data = getFilteredMonthlyData('clientes');
    drawBarChart('chart-sazonalidade', PERIODOS,
        [{ label: 'Nº de Clientes por Mês', data: data, color: '#F4A261', color2: '#E76F51' }],
        { yFormat: v => v >= 1000 ? (v / 1000).toFixed(1) + 'k' : Math.round(v) }
    );

    const sub = document.querySelector('#sec-sazonalidade .chart-subtitle');
    if (sub) sub.textContent = DashboardState.estado === 'Todos'
        ? 'Total consolidado · Nordeste'
        : `Clientes por mês · ${DashboardState.estado}`;
}

// ── Heatmap ───────────────────────────────────────────────────
function renderHeatmap() {
    const canvas = document.getElementById('chart-heatmap');
    if (!canvas) return;
    const states = ESTADOS;
    const shortNames = states.map(s => UF_SIGLAS[s]);
    const matrix = states.map(s => clientes[s]);
    drawHeatmapChart('chart-heatmap', shortNames, PERIODOS, matrix);
}

// ── Bubble Chart (Receita vs Clientes) ───────────────────────
function renderBubbleChart() {
    const canvas = document.getElementById('chart-bubble');
    if (!canvas) return;

    const bubbles = ESTADOS.map(est => {
        const totalRec = receita[est].reduce((a, b) => a + b, 0);
        const totalCli = clientes[est].reduce((a, b) => a + b, 0);
        const mediaOcup = ocupacao[est].reduce((a, b) => a + b, 0) / 12;
        const ticketMedio = totalCli > 0 ? totalRec / totalCli : 0;
        return {
            label: UF_SIGLAS[est],
            x: totalCli / 1000,
            y: ticketMedio,
            size: totalRec,
            color: ['#00B4D8', '#06D6A0', '#F4A261', '#845EC2'][ESTADOS.indexOf(est)]
        };
    });

    drawBubbleChart('chart-bubble', bubbles, {
        xLabel: 'Total de Clientes (mil)',
        yLabel: 'Ticket Médio (R$)',
        xFormat: v => v.toFixed(0) + 'k',
        yFormat: v => 'R$' + v.toFixed(0)
    });
}

// ── Radar Comparativo ────────────────────────────────────────
function computeRadarScores(est) {
    const totalRec = receita[est].reduce((a, b) => a + b, 0);
    const totalCli = clientes[est].reduce((a, b) => a + b, 0);
    const mediaOcup = ocupacao[est].reduce((a, b) => a + b, 0) / 12;
    const mediaAval = avaliacao[est].reduce((a, b) => a + b, 0) / 12;

    // Sazonalidade (regularidade)
    const cliArr = clientes[est];
    const mean = cliArr.reduce((a, b) => a + b, 0) / cliArr.length;
    const variance = cliArr.reduce((a, b) => a + (b - mean) ** 2, 0) / cliArr.length;
    const cv = Math.sqrt(variance) / mean;
    const sazScore = (1 - cv) * 100;

    // Diversidade (número de cidades com receita significativa)
    const cidadesEst = CIDADES_POR_ESTADO[est] || [];
    const cidadeRevs = cidadesEst.map(c => dadosPorCidade[c] ? dadosPorCidade[c].receita.reduce((a, b) => a + b, 0) : 0);
    const maxCidRev = Math.max(...cidadeRevs);
    const diversidade = cidadeRevs.filter(r => r > maxCidRev * 0.5).length / cidadesEst.length * 100;

    return { totalRec, totalCli, mediaOcup, mediaAval, sazScore, diversidade };
}

function renderRadarChart() {
    const estado = DashboardState.estado;
    const canvas = document.getElementById('chart-radar');
    if (!canvas) return;

    function normalize(vals, val) {
        const min = Math.min(...vals);
        const max = Math.max(...vals);
        return max === min ? 50 : ((val - min) / (max - min)) * 100;
    }

    const allScores = ESTADOS.map(e => computeRadarScores(e));
    const allRec = allScores.map(s => s.totalRec);
    const allCli = allScores.map(s => s.totalCli);
    const allOcup = allScores.map(s => s.mediaOcup);
    const allAval = allScores.map(s => s.mediaAval);
    const allSaz = allScores.map(s => s.sazScore);
    const allDiv = allScores.map(s => s.diversidade);

    function normalizedScores(est) {
        const s = computeRadarScores(est);
        return [
            normalize(allRec, s.totalRec),
            normalize(allCli, s.totalCli),
            normalize(allOcup, s.mediaOcup),
            normalize(allAval, s.mediaAval),
            normalize(allSaz, s.sazScore),
            normalize(allDiv, s.diversidade),
        ];
    }

    const avgScores = RADAR_AXES.map((_, ai) => {
        return ESTADOS.reduce((s, e) => s + normalizedScores(e)[ai], 0) / ESTADOS.length;
    });

    const datasets = [{
        label: 'Média NE',
        data: avgScores,
        color: '#8896B3'
    }];

    if (estado !== 'Todos') {
        datasets.unshift({
            label: estado,
            data: normalizedScores(estado),
            color: '#00B4D8'
        });
    }

    drawRadarChart('chart-radar', RADAR_AXES, datasets, { maxVal: 100, levels: 5 });

    const badge = document.getElementById('badge-radar');
    if (badge) badge.textContent = estado === 'Todos' ? 'Nordeste' : UF_SIGLAS[estado] || estado;

    const sub = document.getElementById('radar-subtitle');
    if (sub) sub.textContent = estado === 'Todos'
        ? 'Selecione um estado para comparar com a média'
        : `${estado} vs. Média · 6 dimensões`;

    const list = document.getElementById('radar-detail-list');
    if (!list) return;
    const scores = estado !== 'Todos' ? normalizedScores(estado) : avgScores;
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
    const estado = DashboardState.estado;
    const insights = [];

    // 1. Melhor receita
    const recByState = ESTADOS.map(e => ({
        estado: e,
        total: receita[e].reduce((a, b) => a + b, 0)
    })).sort((a, b) => b.total - a.total);

    insights.push({
        type: 'success', icon: '💰',
        title: `${recByState[0].estado}: Maior receita anual`,
        body: `Receita total de R$ ${(recByState[0].total / 1e6).toFixed(2)} milhões. Líder entre os 4 estados analisados.`,
        state: recByState[0].estado
    });

    // 2. Melhor avaliação
    const avalByState = ESTADOS.map(e => ({
        estado: e,
        media: avaliacao[e].reduce((a, b) => a + b, 0) / 12
    })).sort((a, b) => b.media - a.media);

    if (avalByState[0].media >= INSIGHT_THRESHOLDS.highRating) {
        insights.push({
            type: 'success', icon: '⭐',
            title: `${avalByState[0].estado}: Melhor avaliação média`,
            body: `Nota média de ${avalByState[0].media.toFixed(2)}/5.0. Qualidade percebida pelos clientes é a mais alta da região.`,
            state: avalByState[0].estado
        });
    }

    // 3. Baixa ocupação
    ESTADOS.forEach(e => {
        const mediaOcup = ocupacao[e].reduce((a, b) => a + b, 0) / 12;
        if (mediaOcup < INSIGHT_THRESHOLDS.lowOccupancy) {
            insights.push({
                type: 'alert', icon: '🏨',
                title: `${e}: Ocupação média abaixo de ${INSIGHT_THRESHOLDS.lowOccupancy}%`,
                body: `Taxa média anual de ${mediaOcup.toFixed(1)}%. Oportunidade de investimento em marketing e promoção.`,
                state: e
            });
        }
    });

    // 4. Alta ocupação
    ESTADOS.forEach(e => {
        const mediaOcup = ocupacao[e].reduce((a, b) => a + b, 0) / 12;
        if (mediaOcup >= INSIGHT_THRESHOLDS.highOccupancy) {
            insights.push({
                type: 'info', icon: '📈',
                title: `${e}: Ocupação acima de ${INSIGHT_THRESHOLDS.highOccupancy}%`,
                body: `Taxa média de ${mediaOcup.toFixed(1)}%. Demanda sólida que justifica expansão da oferta hoteleira.`,
                state: e
            });
        }
    });

    // 5. Sazonalidade
    ESTADOS.forEach(e => {
        const cliArr = clientes[e];
        const mean = cliArr.reduce((a, b) => a + b, 0) / cliArr.length;
        const variance = cliArr.reduce((a, b) => a + (b - mean) ** 2, 0) / cliArr.length;
        const cv = Math.sqrt(variance) / mean;
        if (cv > 0.15) {
            const maxIdx = cliArr.indexOf(Math.max(...cliArr));
            const minIdx = cliArr.indexOf(Math.min(...cliArr));
            insights.push({
                type: 'warning', icon: '📅',
                title: `${e}: Variação sazonal significativa`,
                body: `Pico em ${MESES_FULL[maxIdx]} e vale em ${MESES_FULL[minIdx]}. Coeficiente de variação: ${(cv * 100).toFixed(0)}%.`,
                state: e
            });
        }
    });

    // 6. Cidade destaque por receita
    const cidadeRevs = TODAS_CIDADES.map(c => ({
        nome: c,
        total: dadosPorCidade[c] ? dadosPorCidade[c].receita.reduce((a, b) => a + b, 0) : 0
    })).sort((a, b) => b.total - a.total);

    insights.push({
        type: 'info', icon: '🏙️',
        title: `${cidadeRevs[0].nome}: Cidade com maior receita`,
        body: `R$ ${(cidadeRevs[0].total / 1e6).toFixed(2)} milhões no ano. Principal polo turístico entre as 12 cidades analisadas.`,
        state: null
    });

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
                <div class="sum-label">Destaques</div>
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
            <span class="insight-tag ${ins.type}">${ins.type === 'success' ? 'destaque' : ins.type === 'warning' ? 'atenção' : ins.type === 'alert' ? 'alerta' : 'informação'}</span>
        </div>
    `).join('');
}

// ── Redimensionamento ─────────────────────────────────────────
window.addEventListener('resize', () => { clearTimeout(window._rt); window._rt = setTimeout(render, 200); });
