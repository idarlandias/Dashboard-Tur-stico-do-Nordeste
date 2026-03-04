// ============================================================
// ObIT-NE – Lógica principal: filtros, KPIs e render de seções
// ============================================================

// ── Estado centralizado ─────────────────────────────────────
const DashboardState = {
    _estado: 'Todos',
    _periodo: '2025',
    _indicador: 'turistas',
    _listeners: [],

    get estado()    { return this._estado; },
    get periodo()   { return this._periodo; },
    get indicador() { return this._indicador; },

    set estado(v)    { if (this._estado !== v)    { this._estado = v;    this._notify(); } },
    set periodo(v)   { if (this._periodo !== v)   { this._periodo = v;   this._notify(); } },
    set indicador(v) { if (this._indicador !== v) { this._indicador = v; this._notify(); } },

    /** Atualiza sem disparar render (para batch updates) */
    setSilent(key, value) { this['_' + key] = value; },

    /** Registra callback de mudança */
    onChange(fn) { this._listeners.push(fn); },

    _notify() {
        this._listeners.forEach(fn => fn());
    }
};

// Dispara render em cada mudança de estado
DashboardState.onChange(() => render());

// ── Inicialização ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    populateSelects();
    initMap();
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
    document.getElementById('sel-estado').addEventListener('change', e => {
        DashboardState.estado = e.target.value;
    });
    document.getElementById('sel-periodo').addEventListener('change', e => {
        DashboardState.periodo = e.target.value;
    });

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
    document.getElementById('btn-export-csv').addEventListener('click', exportCSV);
    document.getElementById('btn-export-xls').addEventListener('click', exportExcel);
    document.getElementById('btn-export-pdf').addEventListener('click', exportPDF);

    // ── Metodologia toggle ──────────────────────────────────────
    const btnMetodologia = document.getElementById('btn-metodologia');
    if (btnMetodologia) {
        btnMetodologia.addEventListener('click', () => {
            const body = document.getElementById('metodologia-body');
            const chevron = document.getElementById('metodologia-chevron');
            const expanded = btnMetodologia.getAttribute('aria-expanded') === 'true';
            btnMetodologia.setAttribute('aria-expanded', !expanded);
            body.style.display = expanded ? 'none' : 'block';
            chevron.classList.toggle('open', !expanded);
        });
    }
}

// ── Integração GeoViz (Mapa SVG) ──────────────────────────────
function initMap() {
    const container = document.getElementById('mapa-container');
    if (!container || typeof mapaNordesteSVG === 'undefined') return;

    container.innerHTML = mapaNordesteSVG;

    const svg = container.querySelector('svg');
    svg.style.width = '100%';
    svg.style.height = '100%';
    svg.style.filter = 'drop-shadow(0px 8px 16px rgba(0,0,0,0.4))';

    const estadoToUf = {
        "Maranhão": "MA", "Piauí": "PI", "Ceará": "CE",
        "Rio Grande do Norte": "RN", "Paraíba": "PB", "Pernambuco": "PE",
        "Alagoas": "AL", "Sergipe": "SE", "Bahia": "BA"
    };

    const ufToEstado = Object.fromEntries(Object.entries(estadoToUf).map(([k, v]) => [v, k]));

    const shapes = svg.querySelectorAll('.estado-shape');
    shapes.forEach(shape => {
        shape.addEventListener('click', () => {
            const sigla = shape.id;
            const nomeEstado = ufToEstado[sigla];
            if (!nomeEstado) return;

            if (DashboardState.estado === nomeEstado) {
                DashboardState.setSilent('estado', 'Todos');
            } else {
                DashboardState.setSilent('estado', nomeEstado);
            }

            const selEstado = document.getElementById('sel-estado');
            if (selEstado) selEstado.value = DashboardState.estado;

            render();
        });

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

    if (DashboardState.estado !== 'Todos') {
        const uf = estadoToUf[DashboardState.estado];
        if (uf) {
            const shapeSel = document.getElementById(uf);
            if (shapeSel) shapeSel.classList.add('selected');
        }
    }
}

// ── Helpers de exportação ─────────────────────────────────────
function buildDataRows() {
    const rows = [];
    ESTADOS.forEach(est => {
        PERIODOS.forEach((ano, idx) => {
            rows.push({
                Estado: est,
                Ano: ano,
                Chegadas_Int: (chegadasInt[est] || [])[idx] || '',
                Receita_Mi_BRL: (receita[est] || [])[idx] || '',
                Ocupacao_Pct: (ocupacao[est] || [])[idx] || '',
                Empregos_Mil: (empregos[est] || [])[idx] || '',
            });
        });
    });
    return rows;
}

function exportCSV() {
    const rows = buildDataRows();
    const header = Object.keys(rows[0]).join(';');
    const body = rows.map(r => Object.values(r).join(';')).join('\n');
    const bom = '\uFEFF';
    const blob = new Blob([bom + header + '\n' + body], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, 'obit-ne_turismo_nordeste.csv');
}

function exportExcel() {
    // Usa SheetJS se disponível, senão fallback para HTML-table
    if (typeof XLSX !== 'undefined') {
        exportExcelSheetJS();
    } else {
        exportExcelFallback();
    }
}

function exportExcelSheetJS() {
    const rows = buildDataRows();
    const wb = XLSX.utils.book_new();

    // Sheet 1: Dados
    const ws = XLSX.utils.json_to_sheet(rows);

    // Larguras de coluna
    ws['!cols'] = [
        { wch: 24 }, // Estado
        { wch: 8 },  // Ano
        { wch: 14 }, // Chegadas
        { wch: 16 }, // Receita
        { wch: 14 }, // Ocupação
        { wch: 14 }, // Empregos
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'Dados Turísticos');

    // Sheet 2: Metadata
    const meta = [
        { Campo: 'Projeto', Valor: 'ObIT-NE · Observatório do Turismo do Nordeste' },
        { Campo: 'Instituição', Valor: 'Banco do Nordeste do Brasil (BNB)' },
        { Campo: 'Fontes', Valor: 'EMBRATUR/PF · PNAD Contínua IBGE 2024 · MTur' },
        { Campo: 'Período', Valor: '2021–2025 (verificados) + 2026 (projeção OLS)' },
        { Campo: 'Gerado em', Valor: new Date().toLocaleString('pt-BR') },
        { Campo: 'Confiança - Chegadas', Valor: '2021-2024: Verificado | 2025-2026: Projeção' },
        { Campo: 'Confiança - Receita', Valor: '2021-2024: Verificado | 2025-2026: Projeção' },
        { Campo: 'Confiança - Ocupação', Valor: '2021-2025: Estimativa | 2026: Projeção' },
        { Campo: 'Confiança - Empregos', Valor: '2021-2025: Estimativa | 2026: Projeção' },
    ];
    const wsMeta = XLSX.utils.json_to_sheet(meta);
    wsMeta['!cols'] = [{ wch: 26 }, { wch: 56 }];
    XLSX.utils.book_append_sheet(wb, wsMeta, 'Metadados');

    // Sheet 3: Prospecções 2026
    if (typeof prospecoes2026 !== 'undefined') {
        const prosp = prospecoes2026.map(d => ({
            Estado: d.estado,
            UF: d.uf,
            'Índice Oportunidade': d.indice,
            Classificação: d.classificacao,
            'Chegadas Proj.': d.chegadas_proj,
            'Receita Proj. (R$ mi)': d.receita_proj,
            'CAGR 3a (%)': d.cagr,
            'Variação (%)': d.variacao,
            Análise: d.rationale,
        }));
        const wsProsp = XLSX.utils.json_to_sheet(prosp);
        wsProsp['!cols'] = [
            { wch: 24 }, { wch: 4 }, { wch: 18 }, { wch: 14 },
            { wch: 14 }, { wch: 18 }, { wch: 12 }, { wch: 12 }, { wch: 60 },
        ];
        XLSX.utils.book_append_sheet(wb, wsProsp, 'Prospecções 2026');
    }

    XLSX.writeFile(wb, 'obit-ne_turismo_nordeste.xlsx');
}

function exportExcelFallback() {
    const rows = buildDataRows();
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
    renderConfidence();
    renderCharts();
    renderRanking();
    renderSazonalidade();
    renderProspecoes2026();
    updateMapSelection();

    const badgeMapa = document.getElementById('badge-mapa');
    if (badgeMapa) badgeMapa.textContent = DashboardState.estado === 'Todos' ? 'Nordeste' : DashboardState.estado;
}

// ── Confiança dos dados ──────────────────────────────────────
function renderConfidence() {
    if (typeof DATA_CONFIDENCE === 'undefined' || typeof CONFIDENCE_META === 'undefined') return;

    const idx = periodoIdx(DashboardState.periodo);
    document.querySelectorAll('.kpi-confidence').forEach(el => {
        const ind = el.dataset.ind;
        const conf = DATA_CONFIDENCE[ind];
        if (!conf || idx < 0) return;

        const nivel = conf.niveis[idx] || 'estimativa';
        const meta = CONFIDENCE_META[nivel];
        const cls = 'conf-' + nivel;

        el.className = 'kpi-confidence conf-badge ' + cls;
        el.innerHTML = `${meta.icon} ${meta.label}`;
        el.title = meta.desc + ' · Fonte: ' + conf.fonte;
    });
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
    const idx = periodoIdx(DashboardState.periodo);
    const estados = DashboardState.estado === 'Todos' ? ESTADOS : [DashboardState.estado];

    const totalTuristas = estados.reduce((s, e) => s + turistas[e][idx], 0);
    const totalReceita = estados.reduce((s, e) => s + receita[e][idx], 0);
    const mediaOcupacao = estados.reduce((s, e) => s + ocupacao[e][idx], 0) / estados.length;
    const totalEmpregos = estados.reduce((s, e) => s + empregos[e][idx], 0);

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
        trend.innerHTML = `${up ? '▲' : '▼'} ${Math.abs(pct)}% vs ${PERIODOS[periodoIdx(DashboardState.periodo) - 1] || ''}`;
        trend.style.display = '';
    } else {
        trend.style.display = 'none';
    }
}

// ── Gráficos ──────────────────────────────────────────────────
function renderCharts() {
    const idx = periodoIdx(DashboardState.periodo);
    const estados = DashboardState.estado === 'Todos' ? ESTADOS : [DashboardState.estado];
    const ds = { turistas, receita, ocupacao, empregos }[DashboardState.indicador] || turistas;

    const labels1 = estados.map(e => e.split(' ')[0]);
    const vals1 = estados.map(e => ds[e][idx]);
    const indLabel = { turistas: 'Turistas (mil)', receita: 'Receita (R$ mi)', ocupacao: 'Ocupação (%)', empregos: 'Empregos (mil)' }[DashboardState.indicador];

    drawBarChart('chart-estados', labels1, [{ label: indLabel, data: vals1, color: '#00B4D8', color2: '#0077B6' }], {
        yFormat: v => v >= 1000 ? (v / 1000).toFixed(1) + 'k' : Math.round(v),
    });

    const timeData = PERIODOS.map(p => {
        return DashboardState.estado === 'Todos'
            ? ESTADOS.reduce((s, e) => s + ds[e][PERIODOS.indexOf(p)], 0)
            : ds[DashboardState.estado][PERIODOS.indexOf(p)];
    });

    drawLineChart('chart-temporal', PERIODOS, [{ label: indLabel, data: timeData, color: '#06D6A0' }], {
        yFormat: v => v >= 1000 ? (v / 1000).toFixed(1) + 'k' : Math.round(v),
    });

    const perfilEstado = (atracoesPerEstado && atracoesPerEstado[DashboardState.estado])
        ? atracoesPerEstado[DashboardState.estado]
        : atracoesCategoria.data;
    drawDonutChart('chart-categorias', ATRACAO_LABELS || atracoesCategoria.labels, perfilEstado, ATRACAO_COLORS || atracoesCategoria.colors);

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

    const badgeGeral = document.getElementById('badge-categorias-geral');
    if (badgeGeral) badgeGeral.textContent = DashboardState.estado === 'Todos' ? 'Nordeste' : DashboardState.estado;

    const labels = ATRACAO_LABELS || atracoesCategoria.labels;
    const colors = ATRACAO_COLORS || atracoesCategoria.colors;
    drawDonutChart('chart-categorias-sec', labels, perfilEstado, colors);

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
    if (badgeSec) badgeSec.textContent = DashboardState.estado === 'Todos' ? 'Nordeste' : DashboardState.estado;
    const subSec = document.getElementById('categorias-sub');
    if (subSec) subSec.textContent = DashboardState.estado === 'Todos'
        ? 'Distribuição estimada do perfil turístico · Nordeste'
        : `Perfil de atrações · ${DashboardState.estado} · estimativa`;
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
    const dadosMes = (typeof sazonalidadePerEstado !== 'undefined' && sazonalidadePerEstado[DashboardState.estado])
        ? sazonalidadePerEstado[DashboardState.estado]
        : sazonalidade.data;

    drawBarChart('chart-sazonalidade', sazonalidade.labels,
        [{ label: 'Índice de Chegadas (relativo)', data: dadosMes, color: '#F4A261', color2: '#E76F51' }],
        { yFormat: v => Math.round(v) }
    );

    const sub = document.querySelector('#sec-sazonalidade .chart-subtitle');
    if (sub) sub.textContent = DashboardState.estado === 'Todos'
        ? 'Média consolidada · Nordeste · perfil estimado por mês'
        : `Perfil de sazonalidade · ${DashboardState.estado} · base estimada`;
}

// ── Redimensionamento ─────────────────────────────────────────
window.addEventListener('resize', () => { clearTimeout(window._rt); window._rt = setTimeout(render, 200); });
