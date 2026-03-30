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
                if (s.id === 'sec-analise') return;
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
    const d = computeReportData();
    const today = d.dateStr;

    // ── Helpers XML ──
    function esc(v) { return String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
    function cell(v, sid, type) {
        const t = type || (typeof v === 'number' ? 'Number' : 'String');
        return `<Cell ss:StyleID="${sid}"><Data ss:Type="${t}">${esc(v)}</Data></Cell>`;
    }
    function cellMerge(v, sid, across, down) {
        const ma = across ? ` ss:MergeAcross="${across}"` : '';
        const md = down ? ` ss:MergeDown="${down}"` : '';
        return `<Cell ss:StyleID="${sid}"${ma}${md}><Data ss:Type="String">${esc(v)}</Data></Cell>`;
    }
    function row(cells, h) { return `<Row${h ? ` ss:AutoFitHeight="0" ss:Height="${h}"` : ''}>${cells}</Row>`; }
    function emptyRow(h) { return `<Row${h ? ` ss:Height="${h}"` : ''}></Row>`; }
    function cols(widths) { return widths.map(w => `<Column ss:AutoFitWidth="0" ss:Width="${w}"/>`).join(''); }

    // ── Estilos ──
    const styles = `<Styles>
<Style ss:ID="Default"><Alignment ss:Vertical="Center"/><Font ss:FontName="Calibri" ss:Size="10"/></Style>
<Style ss:ID="title"><Font ss:FontName="Calibri" ss:Size="16" ss:Bold="1" ss:Color="#0A2540"/><Alignment ss:Horizontal="Left" ss:Vertical="Center"/></Style>
<Style ss:ID="subtitle"><Font ss:FontName="Calibri" ss:Size="11" ss:Color="#555555"/><Alignment ss:Horizontal="Left" ss:Vertical="Center"/></Style>
<Style ss:ID="date"><Font ss:FontName="Calibri" ss:Size="10" ss:Color="#0077B6" ss:Bold="1"/><Alignment ss:Horizontal="Left" ss:Vertical="Center"/></Style>
<Style ss:ID="hdr"><Font ss:FontName="Calibri" ss:Size="10" ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#0A2540" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#0A2540"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#1A3A5C"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#1A3A5C"/></Borders></Style>
<Style ss:ID="hdr_l"><Font ss:FontName="Calibri" ss:Size="10" ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#0A2540" ss:Pattern="Solid"/><Alignment ss:Horizontal="Left" ss:Vertical="Center" ss:WrapText="1"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#0A2540"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#1A3A5C"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#1A3A5C"/></Borders></Style>
<Style ss:ID="hdr2"><Font ss:FontName="Calibri" ss:Size="10" ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#0077B6" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#005f8a"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#005f8a"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#005f8a"/></Borders></Style>
<Style ss:ID="hdr2_l"><Font ss:FontName="Calibri" ss:Size="10" ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#0077B6" ss:Pattern="Solid"/><Alignment ss:Horizontal="Left" ss:Vertical="Center"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#005f8a"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#005f8a"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#005f8a"/></Borders></Style>
<Style ss:ID="d"><Alignment ss:Vertical="Center"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D0E4F0"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D0E4F0"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D0E4F0"/></Borders></Style>
<Style ss:ID="d_c"><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D0E4F0"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D0E4F0"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D0E4F0"/></Borders></Style>
<Style ss:ID="d_r"><Alignment ss:Horizontal="Right" ss:Vertical="Center"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D0E4F0"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D0E4F0"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D0E4F0"/></Borders><NumberFormat ss:Format="#,##0"/></Style>
<Style ss:ID="d_cur"><Alignment ss:Horizontal="Right" ss:Vertical="Center"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D0E4F0"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D0E4F0"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D0E4F0"/></Borders><NumberFormat ss:Format="R$ #,##0.00"/></Style>
<Style ss:ID="d_pct"><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D0E4F0"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D0E4F0"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D0E4F0"/></Borders><NumberFormat ss:Format="0.0%"/></Style>
<Style ss:ID="d_dec"><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D0E4F0"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D0E4F0"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D0E4F0"/></Borders><NumberFormat ss:Format="0.0"/></Style>
<Style ss:ID="a"><Interior ss:Color="#F0F8FF" ss:Pattern="Solid"/><Alignment ss:Vertical="Center"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D0E4F0"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D0E4F0"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D0E4F0"/></Borders></Style>
<Style ss:ID="a_c"><Interior ss:Color="#F0F8FF" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D0E4F0"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D0E4F0"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D0E4F0"/></Borders></Style>
<Style ss:ID="a_r"><Interior ss:Color="#F0F8FF" ss:Pattern="Solid"/><Alignment ss:Horizontal="Right" ss:Vertical="Center"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D0E4F0"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D0E4F0"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D0E4F0"/></Borders><NumberFormat ss:Format="#,##0"/></Style>
<Style ss:ID="a_cur"><Interior ss:Color="#F0F8FF" ss:Pattern="Solid"/><Alignment ss:Horizontal="Right" ss:Vertical="Center"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D0E4F0"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D0E4F0"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D0E4F0"/></Borders><NumberFormat ss:Format="R$ #,##0.00"/></Style>
<Style ss:ID="a_pct"><Interior ss:Color="#F0F8FF" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D0E4F0"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D0E4F0"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D0E4F0"/></Borders><NumberFormat ss:Format="0.0%"/></Style>
<Style ss:ID="a_dec"><Interior ss:Color="#F0F8FF" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D0E4F0"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D0E4F0"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D0E4F0"/></Borders><NumberFormat ss:Format="0.0"/></Style>
<Style ss:ID="tot"><Font ss:FontName="Calibri" ss:Size="10" ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#0077B6" ss:Pattern="Solid"/><Alignment ss:Vertical="Center"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#005f8a"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#005f8a"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#005f8a"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#005f8a"/></Borders></Style>
<Style ss:ID="tot_r"><Font ss:FontName="Calibri" ss:Size="10" ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#0077B6" ss:Pattern="Solid"/><Alignment ss:Horizontal="Right" ss:Vertical="Center"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#005f8a"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#005f8a"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#005f8a"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#005f8a"/></Borders><NumberFormat ss:Format="#,##0"/></Style>
<Style ss:ID="tot_cur"><Font ss:FontName="Calibri" ss:Size="10" ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#0077B6" ss:Pattern="Solid"/><Alignment ss:Horizontal="Right" ss:Vertical="Center"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#005f8a"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#005f8a"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#005f8a"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#005f8a"/></Borders><NumberFormat ss:Format="R$ #,##0.00"/></Style>
<Style ss:ID="tot_c"><Font ss:FontName="Calibri" ss:Size="10" ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#0077B6" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#005f8a"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#005f8a"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#005f8a"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#005f8a"/></Borders><NumberFormat ss:Format="0.0"/></Style>
<Style ss:ID="kpi_l"><Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#0A2540"/><Interior ss:Color="#E8F4FF" ss:Pattern="Solid"/><Alignment ss:Horizontal="Left" ss:Vertical="Center"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#B0D4EA"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#B0D4EA"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#B0D4EA"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#B0D4EA"/></Borders></Style>
<Style ss:ID="kpi_v"><Font ss:FontName="Calibri" ss:Size="14" ss:Bold="1" ss:Color="#0077B6"/><Interior ss:Color="#E8F4FF" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#B0D4EA"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#B0D4EA"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#B0D4EA"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#B0D4EA"/></Borders></Style>
<Style ss:ID="best"><Font ss:FontName="Calibri" ss:Size="10" ss:Color="#0A8754" ss:Bold="1"/><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D0E4F0"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D0E4F0"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D0E4F0"/></Borders></Style>
<Style ss:ID="worst"><Font ss:FontName="Calibri" ss:Size="10" ss:Color="#C0392B" ss:Bold="1"/><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D0E4F0"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D0E4F0"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D0E4F0"/></Borders></Style>
<Style ss:ID="sec"><Font ss:FontName="Calibri" ss:Size="12" ss:Bold="1" ss:Color="#0A2540"/><Alignment ss:Horizontal="Left" ss:Vertical="Center"/></Style>
<Style ss:ID="alta"><Font ss:FontName="Calibri" ss:Size="9" ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#E74C3C" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D0E4F0"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D0E4F0"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D0E4F0"/></Borders></Style>
<Style ss:ID="media"><Font ss:FontName="Calibri" ss:Size="9" ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#F39C12" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D0E4F0"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D0E4F0"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D0E4F0"/></Borders></Style>
<Style ss:ID="baixa"><Font ss:FontName="Calibri" ss:Size="9" ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#27AE60" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D0E4F0"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D0E4F0"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D0E4F0"/></Borders></Style>
<Style ss:ID="foot"><Font ss:FontName="Calibri" ss:Size="8" ss:Italic="1" ss:Color="#999999"/><Alignment ss:Horizontal="Left" ss:Vertical="Center"/></Style>
</Styles>`;

    // ── ABA 1: Resumo Executivo ──
    const fmtR = v => 'R$ ' + (v / 1e6).toFixed(1) + 'M';
    const fmtN = v => Math.round(v).toLocaleString('pt-BR');
    const cidTop = d.ocupacaoPorCidade[0];
    const cidBot = d.ocupacaoPorCidade[d.ocupacaoPorCidade.length - 1];

    let s1 = `<Worksheet ss:Name="Resumo Executivo"><Table ss:DefaultRowHeight="18">`;
    s1 += cols([200, 160, 160, 160, 160]);
    s1 += row(cellMerge('RELATÓRIO GERENCIAL — TURISMO NORDESTE', 'title', 4), 28);
    s1 += row(cellMerge('Nordeste do Brasil — Desempenho | Tendências | Estratégia', 'subtitle', 4), 20);
    s1 += row(cellMerge('Gerado em: ' + today, 'date', 4), 20);
    s1 += emptyRow(12);
    // KPIs
    s1 += row(cellMerge('INDICADORES-CHAVE', 'sec', 4), 24);
    s1 += emptyRow(6);
    s1 += row(cell('Indicador', 'hdr_l') + cell('Resultado', 'hdr') + cell('Descrição', 'hdr') + cell('Melhor Período', 'hdr') + cell('Pior Período', 'hdr'));
    s1 += row(cell('Receita Total', 'kpi_l') + cell(fmtR(d.totalReceita), 'kpi_v') + cell('Soma anual', 'd_c') + cell(d.recBW.best, 'best') + cell(d.recBW.worst, 'worst'));
    s1 += row(cell('Clientes', 'kpi_l') + cell(fmtN(d.totalClientes), 'kpi_v') + cell('Total no período', 'a_c') + cell(d.cliBW.best, 'best') + cell(d.cliBW.worst, 'worst'));
    s1 += row(cell('Ocupação Média', 'kpi_l') + cell(d.mediaOcupacao.toFixed(1) + '%', 'kpi_v') + cell('Média 12 meses', 'd_c') + cell(d.ocuBW.best, 'best') + cell(d.ocuBW.worst, 'worst'));
    s1 += row(cell('Avaliação', 'kpi_l') + cell(d.mediaAvaliacao.toFixed(1) + ' / 5', 'kpi_v') + cell('Média satisfação', 'a_c') + cell(d.avaBW.best, 'best') + cell(d.avaBW.worst, 'worst'));
    s1 += emptyRow(16);
    // Decisões estratégicas
    s1 += row(cellMerge('APOIO A DECISÕES ESTRATÉGICAS', 'sec', 4), 24);
    s1 += emptyRow(6);
    s1 += row(cell('Iniciativa', 'hdr_l') + cell('Prioridade', 'hdr') + cell('Ação Recomendada', 'hdr') + cell('Prazo', 'hdr') + '');
    const decisoes = [
        ['Ocupar baixa temporada (Nov-Dez)', 'alta', 'Pacotes e descontos regionais', '1-2 meses'],
        ['Desenvolver ' + cidBot.nome + ' (' + cidBot.media.toFixed(1) + '% ocup.)', 'alta', 'Benchmarking com ' + cidTop.nome, '3-6 meses'],
        ['Replicar modelo ' + d.ocupacaoPorCidade[1].nome, 'media', 'Capacitação de gestores locais', '6-12 meses'],
        ['Ampliar canais via Agências', 'media', 'Novos contratos de distribuição', '3-6 meses'],
        ['Melhorar avaliação Ago/Março', 'media', 'Programas de qualidade in loco', '2-4 meses'],
        ['Expansão Maranhão/Bahia', 'baixa', 'Estudo de viabilidade de mercado', '12+ meses'],
    ];
    decisoes.forEach((dec, i) => {
        const bg = i % 2 === 0 ? 'd' : 'a';
        s1 += row(cell(dec[0], bg) + cell(dec[1] === 'alta' ? 'ALTA' : dec[1] === 'media' ? 'MÉDIA' : 'BAIXA', dec[1]) + cell(dec[2], bg) + cell(dec[3], bg + '_c') + '');
    });
    s1 += emptyRow(16);
    s1 += row(cellMerge('Fonte: Case Turismo — idarlandias.github.io/Dashboard-Tur-stico-do-Nordeste', 'foot', 4));
    s1 += '</Table></Worksheet>';

    // ── ABA 2: Dados por Estado ──
    let s2 = `<Worksheet ss:Name="Por Estado"><Table ss:DefaultRowHeight="18">`;
    s2 += cols([160, 100, 130, 100, 100, 120]);
    s2 += row(cellMerge('DADOS AGREGADOS POR ESTADO', 'title', 5), 28);
    s2 += emptyRow(8);
    s2 += row(cell('Estado','hdr_l') + cell('Clientes','hdr') + cell('Receita (R$)','hdr') + cell('Ocupação (%)','hdr') + cell('Avaliação','hdr') + cell('Participação','hdr'));
    ESTADOS.forEach((est, i) => {
        const bg = i % 2 === 0 ? 'd' : 'a';
        const tRec = receita[est].reduce((a, b) => a + b, 0);
        const tCli = clientes[est].reduce((a, b) => a + b, 0);
        const mOcu = ocupacao[est].reduce((a, b) => a + b, 0) / 12;
        const mAva = avaliacao[est].reduce((a, b) => a + b, 0) / 12;
        s2 += row(cell(est, bg) + cell(tCli, bg + '_r') + cell(tRec, bg + '_cur') + cell(mOcu, bg + '_dec') + cell(mAva, bg + '_dec') + cell((tRec / d.totalReceita * 100).toFixed(1) + '%', bg + '_c'));
    });
    s2 += row(cell('TOTAL / MÉDIA', 'tot') + cell(d.totalClientes, 'tot_r') + cell(d.totalReceita, 'tot_cur') + cell(d.mediaOcupacao, 'tot_c') + cell(d.mediaAvaliacao, 'tot_c') + cell('100%', 'tot_c'));
    s2 += emptyRow(16);
    // Detalhamento mensal por estado
    s2 += row(cellMerge('DETALHAMENTO MENSAL', 'sec', 5), 24);
    s2 += emptyRow(6);
    ESTADOS.forEach(est => {
        s2 += row(cellMerge(est + ' (' + UF_SIGLAS[est] + ')', 'hdr2_l', 5));
        s2 += row(cell('Mês','hdr_l') + cell('Clientes','hdr') + cell('Receita (R$)','hdr') + cell('Ocupação (%)','hdr') + cell('Avaliação','hdr') + '');
        PERIODOS.forEach((_, mi) => {
            const bg = mi % 2 === 0 ? 'd' : 'a';
            s2 += row(cell(MESES_FULL[mi], bg) + cell(clientes[est][mi], bg + '_r') + cell(receita[est][mi], bg + '_cur') + cell(ocupacao[est][mi], bg + '_dec') + cell(avaliacao[est][mi], bg + '_dec') + '');
        });
        const tRec = receita[est].reduce((a, b) => a + b, 0);
        const tCli = clientes[est].reduce((a, b) => a + b, 0);
        s2 += row(cell('Total/Média', 'tot') + cell(tCli, 'tot_r') + cell(tRec, 'tot_cur') + cell(ocupacao[est].reduce((a, b) => a + b, 0) / 12, 'tot_c') + cell(avaliacao[est].reduce((a, b) => a + b, 0) / 12, 'tot_c') + '');
        s2 += emptyRow(10);
    });
    s2 += row(cellMerge('Fonte: Case Turismo — idarlandias.github.io/Dashboard-Tur-stico-do-Nordeste', 'foot', 5));
    s2 += '</Table></Worksheet>';

    // ── ABA 3: Dados por Cidade ──
    let s3 = `<Worksheet ss:Name="Por Cidade"><Table ss:DefaultRowHeight="18">`;
    s3 += cols([160, 80, 100, 130, 90, 90]);
    s3 += row(cellMerge('DADOS AGREGADOS POR CIDADE', 'title', 5), 28);
    s3 += emptyRow(8);
    s3 += row(cell('Cidade','hdr_l') + cell('Estado','hdr') + cell('Clientes','hdr') + cell('Receita (R$)','hdr') + cell('Ocupação (%)','hdr') + cell('Avaliação','hdr'));
    const cidadesSorted = [...TODAS_CIDADES].sort((a, b) => {
        const ra = dadosPorCidade[a].receita.reduce((s, v) => s + v, 0);
        const rb = dadosPorCidade[b].receita.reduce((s, v) => s + v, 0);
        return rb - ra;
    });
    cidadesSorted.forEach((cid, i) => {
        const bg = i % 2 === 0 ? 'd' : 'a';
        const cd = dadosPorCidade[cid];
        const tRec = cd.receita.reduce((a, b) => a + b, 0);
        const tCli = cd.clientes.reduce((a, b) => a + b, 0);
        const mOcu = cd.ocupacao.reduce((a, b) => a + b, 0) / 12;
        const mAva = cd.avaliacao.reduce((a, b) => a + b, 0) / 12;
        const uf = Object.entries(CIDADES_POR_ESTADO).find(([_, cs]) => cs.includes(cid));
        s3 += row(cell(cid, bg) + cell(uf ? UF_SIGLAS[uf[0]] : '', bg + '_c') + cell(tCli, bg + '_r') + cell(tRec, bg + '_cur') + cell(mOcu, bg + '_dec') + cell(mAva, bg + '_dec'));
    });
    s3 += row(cell('TOTAL / MÉDIA', 'tot') + cell('', 'tot') + cell(d.totalClientes, 'tot_r') + cell(d.totalReceita, 'tot_cur') + cell(d.mediaOcupacao, 'tot_c') + cell(d.mediaAvaliacao, 'tot_c'));
    s3 += emptyRow(16);
    s3 += row(cellMerge('Fonte: Case Turismo — idarlandias.github.io/Dashboard-Tur-stico-do-Nordeste', 'foot', 5));
    s3 += '</Table></Worksheet>';

    // ── ABA 4: Dados por Tipo ──
    let s4 = `<Worksheet ss:Name="Por Tipo"><Table ss:DefaultRowHeight="18">`;
    s4 += cols([140, 110, 140, 100, 100, 130]);
    s4 += row(cellMerge('DADOS POR TIPO DE EMPREENDIMENTO', 'title', 5), 28);
    s4 += emptyRow(8);
    s4 += row(cell('Tipo','hdr_l') + cell('Clientes','hdr') + cell('Receita (R$)','hdr') + cell('Ocupação (%)','hdr') + cell('Avaliação','hdr') + cell('Ticket Médio (R$)','hdr'));
    d.tipoDados.forEach((t, i) => {
        const bg = i % 2 === 0 ? 'd' : 'a';
        s4 += row(cell(t.tipo, bg) + cell(t.clientes, bg + '_r') + cell(t.receita, bg + '_cur') + cell(t.ocupacao, bg + '_dec') + cell(t.avaliacao, bg + '_dec') + cell(Math.round(t.receita / t.clientes), bg + '_r'));
    });
    s4 += row(cell('TOTAL / MÉDIA', 'tot') + cell(d.totalClientes, 'tot_r') + cell(d.totalReceita, 'tot_cur') + cell(d.mediaOcupacao, 'tot_c') + cell(d.mediaAvaliacao, 'tot_c') + cell(Math.round(d.totalReceita / d.totalClientes), 'tot_r'));
    s4 += emptyRow(12);
    // Detalhamento mensal por tipo
    s4 += row(cellMerge('DETALHAMENTO MENSAL', 'sec', 5), 24);
    s4 += emptyRow(6);
    TIPOS.forEach(tipo => {
        const td = dadosPorTipo[tipo];
        s4 += row(cellMerge(tipo, 'hdr2_l', 5));
        s4 += row(cell('Mês','hdr_l') + cell('Clientes','hdr') + cell('Receita (R$)','hdr') + cell('Ocupação (%)','hdr') + cell('Avaliação','hdr') + '');
        PERIODOS.forEach((_, mi) => {
            const bg = mi % 2 === 0 ? 'd' : 'a';
            s4 += row(cell(MESES_FULL[mi], bg) + cell(td.clientes[mi], bg + '_r') + cell(td.receita[mi], bg + '_cur') + cell(td.ocupacao[mi], bg + '_dec') + cell(td.avaliacao[mi], bg + '_dec') + '');
        });
        s4 += row(cell('Total/Média', 'tot') + cell(td.clientes.reduce((a, b) => a + b, 0), 'tot_r') + cell(td.receita.reduce((a, b) => a + b, 0), 'tot_cur') + cell(td.ocupacao.reduce((a, b) => a + b, 0) / 12, 'tot_c') + cell(td.avaliacao.reduce((a, b) => a + b, 0) / 12, 'tot_c') + '');
        s4 += emptyRow(10);
    });
    s4 += row(cellMerge('Fonte: Case Turismo — idarlandias.github.io/Dashboard-Tur-stico-do-Nordeste', 'foot', 5));
    s4 += '</Table></Worksheet>';

    // ── ABA 5: Evolução Mensal ──
    let s5 = `<Worksheet ss:Name="Evolução Mensal"><Table ss:DefaultRowHeight="18">`;
    s5 += cols([110, 100, 130, 90, 90]);
    s5 += row(cellMerge('EVOLUÇÃO MENSAL — NORDESTE CONSOLIDADO', 'title', 4), 28);
    s5 += emptyRow(8);
    s5 += row(cell('Mês','hdr_l') + cell('Clientes','hdr') + cell('Receita (R$)','hdr') + cell('Ocupação (%)','hdr') + cell('Avaliação','hdr'));
    PERIODOS.forEach((_, mi) => {
        const bg = mi % 2 === 0 ? 'd' : 'a';
        s5 += row(cell(MESES_FULL[mi], bg) + cell(d.clientesMensal[mi], bg + '_r') + cell(d.receitaMensal[mi], bg + '_cur') + cell(d.ocupacaoMensal[mi], bg + '_dec') + cell(d.avaliacaoMensal[mi], bg + '_dec'));
    });
    s5 += row(cell('TOTAL / MÉDIA', 'tot') + cell(d.totalClientes, 'tot_r') + cell(d.totalReceita, 'tot_cur') + cell(d.mediaOcupacao, 'tot_c') + cell(d.mediaAvaliacao, 'tot_c'));
    s5 += emptyRow(16);
    s5 += row(cellMerge('Fonte: Case Turismo — idarlandias.github.io/Dashboard-Tur-stico-do-Nordeste', 'foot', 4));
    s5 += '</Table></Worksheet>';

    // ── ABA 6: Dados Completos ──
    let s6 = `<Worksheet ss:Name="Dados Completos"><Table ss:DefaultRowHeight="18">`;
    s6 += cols([150, 70, 110, 100, 130, 90, 90]);
    s6 += row(cellMerge('BASE DE DADOS COMPLETA — 48 REGISTROS (4 ESTADOS × 12 MESES)', 'title', 6), 28);
    s6 += emptyRow(8);
    s6 += row(cell('Estado','hdr_l') + cell('UF','hdr') + cell('Mês','hdr') + cell('Clientes','hdr') + cell('Receita (R$)','hdr') + cell('Ocupação (%)','hdr') + cell('Avaliação','hdr'));
    let ri = 0;
    ESTADOS.forEach(est => {
        PERIODOS.forEach((_, mi) => {
            const bg = ri % 2 === 0 ? 'd' : 'a';
            s6 += row(cell(est, bg) + cell(UF_SIGLAS[est], bg + '_c') + cell(MESES_FULL[mi], bg) + cell(clientes[est][mi], bg + '_r') + cell(receita[est][mi], bg + '_cur') + cell(ocupacao[est][mi], bg + '_dec') + cell(avaliacao[est][mi], bg + '_dec'));
            ri++;
        });
    });
    s6 += row(cell('TOTAL / MÉDIA', 'tot') + cell('', 'tot') + cell('', 'tot') + cell(d.totalClientes, 'tot_r') + cell(d.totalReceita, 'tot_cur') + cell(d.mediaOcupacao, 'tot_c') + cell(d.mediaAvaliacao, 'tot_c'));
    s6 += emptyRow(16);
    s6 += row(cellMerge('Fonte: Case Turismo — idarlandias.github.io/Dashboard-Tur-stico-do-Nordeste', 'foot', 6));
    s6 += '</Table></Worksheet>';

    // ── Montar workbook ──
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<?mso-application progid="Excel.Sheet"?>\n<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"\n xmlns:o="urn:schemas-microsoft-com:office:office"\n xmlns:x="urn:schemas-microsoft-com:office:excel"\n xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">\n<DocumentProperties xmlns="urn:schemas-microsoft-com:office:office"><Title>Relatório Gerencial — Turismo Nordeste</Title><Author>Idarlan Dias</Author><Created>${new Date().toISOString()}</Created></DocumentProperties>\n<ExcelWorkbook xmlns="urn:schemas-microsoft-com:office:excel"><WindowHeight>9000</WindowHeight><WindowWidth>16000</WindowWidth></ExcelWorkbook>\n${styles}\n${s1}\n${s2}\n${s3}\n${s4}\n${s5}\n${s6}\n</Workbook>`;

    const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    downloadBlob(blob, 'Relatorio_Turismo_Nordeste.xls');
}

function exportPDF() {
    const rp = document.getElementById('relatorio-pdf');
    const d = computeReportData();
    rp.innerHTML = buildReportHTML(d);
    rp.style.display = 'block';
    drawReportCharts(d);
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            window.print();
            setTimeout(() => { rp.style.display = 'none'; }, 600);
        });
    });
}

// ── Relatório PDF — Dados ────────────────────────────────────
function computeReportData() {
    const totalReceita = ESTADOS.reduce((s, e) => s + receita[e].reduce((a, b) => a + b, 0), 0);
    const totalClientes = ESTADOS.reduce((s, e) => s + clientes[e].reduce((a, b) => a + b, 0), 0);
    const mediaOcupacao = ESTADOS.reduce((s, e) => s + ocupacao[e].reduce((a, b) => a + b, 0) / 12, 0) / ESTADOS.length;
    const mediaAvaliacao = ESTADOS.reduce((s, e) => s + avaliacao[e].reduce((a, b) => a + b, 0) / 12, 0) / ESTADOS.length;

    const receitaMensal = PERIODOS.map((_, i) => ESTADOS.reduce((s, e) => s + receita[e][i], 0));
    const clientesMensal = PERIODOS.map((_, i) => ESTADOS.reduce((s, e) => s + clientes[e][i], 0));
    const ocupacaoMensal = PERIODOS.map((_, i) => {
        const v = ESTADOS.map(e => ocupacao[e][i]);
        return v.reduce((a, b) => a + b, 0) / v.length;
    });
    const avaliacaoMensal = PERIODOS.map((_, i) => {
        const v = ESTADOS.map(e => avaliacao[e][i]);
        return v.reduce((a, b) => a + b, 0) / v.length;
    });

    function bw(arr, fmt, labels) {
        let maxV = -Infinity, minV = Infinity, maxI = 0, minI = 0;
        arr.forEach((v, i) => { if (v > maxV) { maxV = v; maxI = i; } if (v < minV) { minV = v; minI = i; } });
        return { best: labels[maxI] + ' (' + fmt(maxV) + ')', worst: labels[minI] + ' (' + fmt(minV) + ')' };
    }
    const sm = ['Jan.','Fev.','Mar.','Abr.','Mai.','Jun.','Jul.','Ago.','Set.','Out.','Nov.','Dez.'];
    const recBW = bw(receitaMensal, v => 'R$' + (v / 1e6).toFixed(1) + 'M', sm);
    const cliBW = bw(clientesMensal, v => Math.round(v).toLocaleString('pt-BR'), sm);
    const ocuBW = bw(ocupacaoMensal, v => v.toFixed(1) + '%', sm);
    const avaBW = bw(avaliacaoMensal, v => v.toFixed(1), sm);

    const receitaPorEstado = ESTADOS.map(e => ({
        estado: e, sigla: UF_SIGLAS[e],
        total: receita[e].reduce((a, b) => a + b, 0)
    })).sort((a, b) => b.total - a.total);

    const ocupacaoPorCidade = TODAS_CIDADES.map(c => ({
        nome: c,
        media: dadosPorCidade[c].ocupacao.reduce((a, b) => a + b, 0) / 12
    })).sort((a, b) => b.media - a.media);

    const tipoDados = TIPOS.map(t => ({
        tipo: t,
        receita: dadosPorTipo[t].receita.reduce((a, b) => a + b, 0),
        clientes: dadosPorTipo[t].clientes.reduce((a, b) => a + b, 0),
        ocupacao: dadosPorTipo[t].ocupacao.reduce((a, b) => a + b, 0) / 12,
        avaliacao: dadosPorTipo[t].avaliacao.reduce((a, b) => a + b, 0) / 12,
    }));

    const today = new Date();
    const dateStr = today.toLocaleDateString('pt-BR');
    const mn = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
    const compStr = mn[today.getMonth()] + ' de ' + today.getFullYear();

    return {
        totalReceita, totalClientes, mediaOcupacao, mediaAvaliacao,
        receitaMensal, clientesMensal, ocupacaoMensal, avaliacaoMensal,
        recBW, cliBW, ocuBW, avaBW,
        receitaPorEstado, ocupacaoPorCidade, tipoDados,
        dateStr, compStr
    };
}

// ── Relatório PDF — HTML ─────────────────────────────────────
function buildReportHTML(d) {
    const fmtR = v => 'R$ ' + (v / 1e6).toFixed(1) + 'M';
    const fmtN = v => Math.round(v).toLocaleString('pt-BR');
    const hdr = pg => `<div class="rp-hdr"><span>RELATÓRIO GERENCIAL — TURISMO NORDESTE DO BRASIL</span><span class="rp-hdr-pg">Página ${pg}</span></div>`;
    const ftr = `<div class="rp-ftr">Fonte: Case Turismo — idarlandias.github.io/Dashboard-Tur-stico-do-Nordeste | Gerado em ${d.dateStr}</div>`;

    // ── Página 1: Capa ──
    const p1 = `<div class="rp-page">${hdr(1)}<div class="rp-body">
        <div class="rp-capa-title">RELATÓRIO GERENCIAL DE TURISMO</div>
        <div class="rp-capa-sub">Nordeste do Brasil — Desempenho | Tendências | Estratégia</div>
        <div class="rp-capa-comp">Competência: ${d.compStr}</div>
        <div class="rp-kpi-row">
            <div class="rp-kpi-box"><div class="rp-kpi-label">Receita Total</div><div class="rp-kpi-val">${fmtR(d.totalReceita)}</div><div class="rp-kpi-desc">Soma anual</div></div>
            <div class="rp-kpi-box"><div class="rp-kpi-label">Clientes</div><div class="rp-kpi-val">${fmtN(d.totalClientes)}</div><div class="rp-kpi-desc">Total no período</div></div>
            <div class="rp-kpi-box"><div class="rp-kpi-label">Ocupação Média</div><div class="rp-kpi-val">${d.mediaOcupacao.toFixed(1)}%</div><div class="rp-kpi-desc">Média 12 meses</div></div>
            <div class="rp-kpi-box"><div class="rp-kpi-label">Avaliação</div><div class="rp-kpi-val">${d.mediaAvaliacao.toFixed(1)} / 5</div><div class="rp-kpi-desc">Média satisfação</div></div>
        </div>
        <table class="rp-tbl">
            <thead><tr><th>Indicador</th><th>Resultado</th><th>Melhor Período</th><th>Pior Período</th></tr></thead>
            <tbody>
                <tr><td>Receita Total</td><td><b>${fmtR(d.totalReceita)}</b></td><td class="best">${d.recBW.best}</td><td class="worst">${d.recBW.worst}</td></tr>
                <tr><td>Clientes</td><td><b>${fmtN(d.totalClientes)}</b></td><td class="best">${d.cliBW.best}</td><td class="worst">${d.cliBW.worst}</td></tr>
                <tr><td>Ocupação</td><td><b>${d.mediaOcupacao.toFixed(1)}%</b></td><td class="best">${d.ocuBW.best}</td><td class="worst">${d.ocuBW.worst}</td></tr>
                <tr><td>Avaliação</td><td><b>${d.mediaAvaliacao.toFixed(1)} / 5</b></td><td class="best">${d.avaBW.best}</td><td class="worst">${d.avaBW.worst}</td></tr>
            </tbody>
        </table>
    </div>${ftr}</div>`;

    // ── Página 2: Receita Mensal ──
    const recMax = Math.max(...d.receitaMensal);
    const recMin = Math.min(...d.receitaMensal);
    const recDiff = ((recMax - recMin) / 1e6).toFixed(1);
    const recMaxM = PERIODOS[d.receitaMensal.indexOf(recMax)];
    const recMinM = PERIODOS[d.receitaMensal.indexOf(recMin)];
    const p2 = `<div class="rp-page">${hdr(2)}<div class="rp-body">
        <div class="rp-sec-title">1. RECEITA MENSAL — SAZONALIDADE ANUAL</div>
        <div class="rp-chart-area"><canvas id="rp-chart-receita" width="900" height="340"></canvas></div>
        <div class="rp-insight"><strong>INSIGHT:</strong> Pico em <b>${recMaxM} (${fmtR(recMax)})</b> e vale em <b>${recMinM} (${fmtR(recMin)})</b> — diferença de R$${recDiff}M entre o melhor e pior mês. A queda progressiva de Julho a Novembro sinaliza necessidade urgente de estratégias para a baixa temporada.</div>
    </div>${ftr}</div>`;

    // ── Página 3: Sazonalidade ──
    const ocuMax = Math.max(...d.ocupacaoMensal);
    const ocuMaxM = PERIODOS[d.ocupacaoMensal.indexOf(ocuMax)];
    const avaMax = Math.max(...d.avaliacaoMensal);
    const avaMaxM = PERIODOS[d.avaliacaoMensal.indexOf(avaMax)];
    const p3 = `<div class="rp-page">${hdr(3)}<div class="rp-body">
        <div class="rp-sec-title">2. SAZONALIDADE — TAXA DE OCUPAÇÃO E AVALIAÇÃO MÉDIA POR MÊS</div>
        <div class="rp-chart-area"><canvas id="rp-chart-sazon" width="900" height="340"></canvas></div>
        <div class="rp-insight"><strong>INSIGHT:</strong> Paradoxo crítico: <b>${ocuMaxM}</b> tem a MAIOR ocupação (<b>${ocuMax.toFixed(1)}%</b>) e MAIOR avaliação (<b>${avaMax.toFixed(1)}</b>), porém a MENOR receita (${fmtR(Math.min(...d.receitaMensal))}). Revisão de precificação em baixa temporada pode recuperar até R$1,2M adicionais.</div>
    </div>${ftr}</div>`;

    // ── Página 4: Participação por Estado ──
    const topEstado = d.receitaPorEstado[0];
    const pcts = d.receitaPorEstado.map(e => (e.total / d.totalReceita * 100).toFixed(1));
    const p4 = `<div class="rp-page">${hdr(4)}<div class="rp-body">
        <div class="rp-sec-title">3. PARTICIPAÇÃO E RECEITA POR ESTADO</div>
        <div class="rp-chart-row">
            <div class="rp-chart-main"><canvas id="rp-chart-estado-bar" width="560" height="340"></canvas></div>
            <div class="rp-chart-side">
                <canvas id="rp-chart-estado-donut" width="240" height="240"></canvas>
                <div class="rp-donut-legend" id="rp-estado-legend">
                    ${d.receitaPorEstado.map((e, i) => `<div><span class="dot" style="background:${['#0077B6','#00B4D8','#06D6A0','#F4A261'][i]}"></span><span>${e.sigla}</span><span class="pct">${pcts[i]}%</span></div>`).join('')}
                </div>
            </div>
        </div>
        <div class="rp-insight"><strong>INSIGHT:</strong> Distribuição equilibrada entre os 4 estados (<b>${pcts[pcts.length - 1]}%</b> a <b>${pcts[0]}%</b>), com <b>${topEstado.sigla}</b> liderando por margem pequena. Oportunidade de crescimento proporcional em todos os estados — nenhum mercado está saturado.</div>
    </div>${ftr}</div>`;

    // ── Página 5: Ocupação por Cidade ──
    const cidTop = d.ocupacaoPorCidade[0];
    const cidBot = d.ocupacaoPorCidade[d.ocupacaoPorCidade.length - 1];
    const cidGap = (cidTop.media - cidBot.media).toFixed(1);
    const p5 = `<div class="rp-page">${hdr(5)}<div class="rp-body">
        <div class="rp-sec-title">4. TAXA DE OCUPAÇÃO MÉDIA POR CIDADE</div>
        <div class="rp-chart-area"><canvas id="rp-chart-cidades" width="900" height="360"></canvas></div>
        <div class="rp-insight"><strong>INSIGHT:</strong> Gap de <b>${cidGap} p.p.</b> entre <b>${cidTop.nome} (${cidTop.media.toFixed(1)}%)</b> e <b>${cidBot.nome} (${cidBot.media.toFixed(1)}%)</b>. ${cidBot.nome} e ${d.ocupacaoPorCidade[d.ocupacaoPorCidade.length - 2].nome} estão abaixo da média — representam o maior potencial de crescimento imediato. ${d.ocupacaoPorCidade[1].nome} (${d.ocupacaoPorCidade[1].media.toFixed(1)}%) é o benchmark regional.</div>
    </div>${ftr}</div>`;

    // ── Página 6: Tipo de Empreendimento ──
    const tipoTop = d.tipoDados.reduce((a, b) => (a.receita / a.clientes) > (b.receita / b.clientes) ? a : b);
    const tipoTicket = Math.round(tipoTop.receita / tipoTop.clientes / 1000);
    const p6 = `<div class="rp-page">${hdr(6)}<div class="rp-body">
        <div class="rp-sec-title">5. DESEMPENHO POR TIPO DE EMPREENDIMENTO</div>
        <div class="rp-chart-row">
            <div class="rp-chart-main"><canvas id="rp-chart-tipo-bar" width="520" height="300"></canvas></div>
            <div class="rp-chart-side">
                <canvas id="rp-chart-tipo-donut" width="220" height="220"></canvas>
                <div class="rp-donut-legend" id="rp-tipo-legend">
                    ${d.tipoDados.map((t, i) => `<div><span class="dot" style="background:${['#00B4D8','#06D6A0','#FFB703'][i]}"></span><span>${t.tipo}</span><span class="pct">${(t.receita / d.totalReceita * 100).toFixed(1)}%</span></div>`).join('')}
                </div>
            </div>
        </div>
        <div class="rp-tipo-grid">
            ${d.tipoDados.map(t => `<div class="rp-tipo-card"><h4>${t.tipo}</h4><div class="val">${fmtR(t.receita)}</div><div class="sub">Ticket: R$ ${Math.round(t.receita / t.clientes / 1000)}K · Ocup: ${t.ocupacao.toFixed(1)}% · Aval: ${t.avaliacao.toFixed(1)}</div></div>`).join('')}
        </div>
        <div class="rp-insight"><strong>INSIGHT:</strong> <b>${tipoTop.tipo}s</b> lideram em ticket médio (<b>R$${tipoTicket}K/unidade</b>), porém Hotéis têm melhor avaliação (${d.tipoDados.find(t => t.tipo === 'Hotel').avaliacao.toFixed(1)}). A receita é distribuída de forma equilibrada entre os três segmentos (~33% cada). Pousadas compensam o menor ticket pelo maior volume.</div>
    </div>${ftr}</div>`;

    // ── Página 7: Apoio a Decisões ──
    const p7 = `<div class="rp-page">${hdr(7)}<div class="rp-body">
        <div class="rp-sec-title">6. APOIO A DECISÕES ESTRATÉGICAS</div>
        <table class="rp-tbl rp-tbl-dec">
            <thead><tr><th>Iniciativa</th><th>Prioridade</th><th>Ação Recomendada</th><th>Prazo</th></tr></thead>
            <tbody>
                <tr><td>Ocupar baixa temporada (Nov-Dez)</td><td><span class="rp-pri-alta">ALTA</span></td><td>Pacotes e descontos regionais</td><td>1-2 meses</td></tr>
                <tr><td>Desenvolver ${cidBot.nome} (${cidBot.media.toFixed(1)}% ocup.)</td><td><span class="rp-pri-alta">ALTA</span></td><td>Benchmarking com ${cidTop.nome}</td><td>3-6 meses</td></tr>
                <tr><td>Replicar modelo ${d.ocupacaoPorCidade[1].nome}</td><td><span class="rp-pri-media">MÉDIA</span></td><td>Capacitação de gestores locais</td><td>6-12 meses</td></tr>
                <tr><td>Ampliar canais via Agências</td><td><span class="rp-pri-media">MÉDIA</span></td><td>Novos contratos de distribuição</td><td>3-6 meses</td></tr>
                <tr><td>Melhorar avaliação Ago/Março</td><td><span class="rp-pri-media">MÉDIA</span></td><td>Programas de qualidade in loco</td><td>2-4 meses</td></tr>
                <tr><td>Expansão Maranhão/Bahia</td><td><span class="rp-pri-baixa">BAIXA</span></td><td>Estudo de viabilidade de mercado</td><td>12+ meses</td></tr>
            </tbody>
        </table>
        <div class="rp-insights-cols">
            <div><b>PRINCIPAIS INSIGHTS:</b><ul>
                <li><span class="hl">${tipoTop.tipo}s</span> geram o maior ticket médio (R$${tipoTicket}K): ampliar distribuição via novos contratos — alta prioridade.</li>
                <li>Paradoxo Nov/Março — alta ocupação com baixa receita: prioridade máxima em revisão de precificação.</li>
                <li><span class="hl">${cidBot.nome}</span> acumula gap de ${cidGap} p.p. frente a ${cidTop.nome} — maior oportunidade de crescimento de curto prazo.</li>
            </ul></div>
            <div><ul style="margin-top:22px;">
                <li>Agosto e Março são os pontos críticos de avaliação — meta: elevar para 4,0 com programas de qualidade.</li>
                <li><span class="hl">${d.ocupacaoPorCidade[1].nome}</span> (${d.ocupacaoPorCidade[1].media.toFixed(1)}%) é o benchmark regional de ocupação.</li>
                <li>Distribuição equilibrada (~33% cada tipo) mostra mercado diversificado e resiliente.</li>
            </ul></div>
        </div>
        <div class="rp-desc-analitica">
            <h3>DESCRIÇÃO ANALÍTICA</h3>
            <p>A análise dos dados de 432 registros mensais revela que o <b>${topEstado.estado}</b> concentra a maior fatia da receita regional (<b>${pcts[0]}%</b>), impulsionado principalmente por ${CIDADES_POR_ESTADO[topEstado.estado][0]} e ${CIDADES_POR_ESTADO[topEstado.estado][1]}. A sazonalidade é um fator relevante: <b>${recMaxM.replace('.','')}</b> apresenta o maior faturamento, enquanto <b>${recMinM.replace('.','')}</b> registra o menor movimento — indicando oportunidade para campanhas de incentivo na baixa temporada. Entre os tipos de empreendimento, as <b>${tipoTop.tipo}s</b> lideram em receita média por unidade (${(tipoTop.receita / d.totalReceita * 100).toFixed(1)}% da receita total), sugerindo maior ticket médio nesse segmento. <b>${cidTop.nome}</b> se destaca com a maior taxa de ocupação (<b>${cidTop.media.toFixed(1)}%</b>), enquanto <b>${cidBot.nome}</b> apresenta a menor (<b>${cidBot.media.toFixed(1)}%</b>), apontando potencial de crescimento com estratégias de marketing direcionadas. A correlação entre ocupação e receita confirma que ocupação elevada não garante alta receita — o tipo de empreendimento e o perfil do destino influenciam diretamente o faturamento.</p>
        </div>
    </div>${ftr}</div>`;

    return p1 + p2 + p3 + p4 + p5 + p6 + p7;
}

// ── Relatório PDF — Gráficos estáticos ───────────────────────
const RP = { // Report Print Colors
    primary: '#0077B6', sky: '#00B4D8', green: '#06D6A0',
    orange: '#F4A261', red: '#E76F51', purple: '#845EC2',
    yellow: '#FFB703',
    text: '#1a1a2e', muted: '#666', grid: '#e0e0e0', lightbg: '#f0f8ff'
};

function rpSetup(id) {
    const c = document.getElementById(id);
    if (!c) return null;
    const ctx = c.getContext('2d');
    const W = c.width, H = c.height;
    ctx.clearRect(0, 0, W, H);
    return { c, ctx, W, H };
}

function rpGrid(ctx, x, y, w, h, lines, maxVal, fmt) {
    ctx.strokeStyle = RP.grid;
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= lines; i++) {
        const yy = y + (h / lines) * i;
        ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x + w, yy); ctx.stroke();
        const val = maxVal * (1 - i / lines);
        ctx.fillStyle = RP.muted; ctx.font = '11px Inter, sans-serif'; ctx.textAlign = 'right';
        ctx.fillText(fmt ? fmt(val) : Math.round(val), x - 8, yy + 4);
    }
}

function rpBar(id, labels, values, opts = {}) {
    const s = rpSetup(id); if (!s) return;
    const { ctx, W, H } = s;
    const pad = { top: 24, right: 20, bottom: 40, left: 65 };
    const cW = W - pad.left - pad.right, cH = H - pad.top - pad.bottom;
    const maxVal = (opts.maxVal || Math.max(...values)) * 1.12;
    const barW = Math.min(50, (cW / labels.length) * 0.6);
    const gap = cW / labels.length;

    rpGrid(ctx, pad.left, pad.top, cW, cH, 5, maxVal, opts.yFmt);

    const colors = opts.colors || values.map(() => RP.primary);
    values.forEach((v, i) => {
        const bH = (v / maxVal) * cH;
        const bX = pad.left + i * gap + (gap - barW) / 2;
        const bY = pad.top + cH - bH;
        const grad = ctx.createLinearGradient(bX, bY, bX, pad.top + cH);
        grad.addColorStop(0, colors[i] || RP.sky);
        grad.addColorStop(1, opts.color2 || RP.primary);
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.roundRect(bX, bY, barW, bH, [4, 4, 0, 0]); ctx.fill();
        // Value on top
        if (opts.showVal !== false) {
            ctx.fillStyle = RP.text; ctx.font = 'bold 10px Inter, sans-serif'; ctx.textAlign = 'center';
            ctx.fillText(opts.valFmt ? opts.valFmt(v) : Math.round(v), bX + barW / 2, bY - 6);
        }
    });
    // X labels
    labels.forEach((l, i) => {
        ctx.fillStyle = RP.muted; ctx.font = '11px Inter, sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(l, pad.left + i * gap + gap / 2, pad.top + cH + 20);
    });
}

function rpHBar(id, labels, values, opts = {}) {
    const s = rpSetup(id); if (!s) return;
    const { ctx, W, H } = s;
    const pad = { top: 10, right: 80, bottom: 10, left: 130 };
    const cW = W - pad.left - pad.right, cH = H - pad.top - pad.bottom;
    const n = labels.length;
    const barH = Math.min(24, (cH / n) * 0.7);
    const rowH = cH / n;
    const maxVal = (opts.maxVal || Math.max(...values)) * 1.1;
    const avgVal = values.reduce((a, b) => a + b, 0) / values.length;

    values.forEach((v, i) => {
        const bW = (v / maxVal) * cW;
        const bY = pad.top + i * rowH + (rowH - barH) / 2;
        const color = v >= avgVal ? RP.primary : RP.orange;
        const grad = ctx.createLinearGradient(pad.left, 0, pad.left + bW, 0);
        grad.addColorStop(0, color);
        grad.addColorStop(1, v >= avgVal ? RP.sky : '#F8C471');
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.roundRect(pad.left, bY, bW, barH, [0, 4, 4, 0]); ctx.fill();
        // Label
        ctx.fillStyle = RP.text; ctx.font = '11px Inter, sans-serif'; ctx.textAlign = 'right';
        ctx.fillText(labels[i], pad.left - 10, bY + barH / 2 + 4);
        // Value
        ctx.fillStyle = RP.text; ctx.font = 'bold 11px Inter, sans-serif'; ctx.textAlign = 'left';
        ctx.fillText(opts.valFmt ? opts.valFmt(v) : v.toFixed(1) + '%', pad.left + bW + 8, bY + barH / 2 + 4);
    });

    // Average line
    const avgX = pad.left + (avgVal / maxVal) * cW;
    ctx.setLineDash([4, 3]); ctx.strokeStyle = '#c0392b'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(avgX, pad.top); ctx.lineTo(avgX, pad.top + cH); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#c0392b'; ctx.font = '9px Inter, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('Média ' + avgVal.toFixed(1) + '%', avgX, pad.top + cH + 2);
}

function rpLine(id, labels, datasets, opts = {}) {
    const s = rpSetup(id); if (!s) return;
    const { ctx, W, H } = s;
    const pad = { top: 24, right: 30, bottom: 50, left: 60 };
    const cW = W - pad.left - pad.right, cH = H - pad.top - pad.bottom;
    const allVals = datasets.flatMap(d => d.data);
    const maxVal = (opts.maxVal || Math.max(...allVals)) * 1.12;
    const minVal = opts.minVal !== undefined ? opts.minVal : 0;
    const range = maxVal - minVal;
    const n = labels.length;

    rpGrid(ctx, pad.left, pad.top, cW, cH, 5, maxVal, opts.yFmt);

    function ptX(i) { return pad.left + (i / (n - 1)) * cW; }
    function ptY(v) { return pad.top + cH - ((v - minVal) / range) * cH; }

    datasets.forEach(ds => {
        // Area
        const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + cH);
        grad.addColorStop(0, (ds.color || RP.sky) + '44');
        grad.addColorStop(1, (ds.color || RP.sky) + '08');
        ctx.beginPath();
        ctx.moveTo(ptX(0), pad.top + cH);
        ds.data.forEach((v, i) => ctx.lineTo(ptX(i), ptY(v)));
        ctx.lineTo(ptX(n - 1), pad.top + cH);
        ctx.closePath(); ctx.fillStyle = grad; ctx.fill();
        // Line
        ctx.beginPath(); ctx.strokeStyle = ds.color || RP.sky; ctx.lineWidth = 2.5; ctx.lineJoin = 'round';
        ds.data.forEach((v, i) => i === 0 ? ctx.moveTo(ptX(i), ptY(v)) : ctx.lineTo(ptX(i), ptY(v)));
        ctx.stroke();
        // Dots + values
        ds.data.forEach((v, i) => {
            ctx.beginPath(); ctx.arc(ptX(i), ptY(v), 4, 0, Math.PI * 2);
            ctx.fillStyle = ds.color || RP.sky; ctx.fill();
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
            if (ds.showVals) {
                ctx.fillStyle = RP.text; ctx.font = '9px Inter, sans-serif'; ctx.textAlign = 'center';
                ctx.fillText(ds.valFmt ? ds.valFmt(v) : v.toFixed(1), ptX(i), ptY(v) - 10);
            }
        });
    });

    labels.forEach((l, i) => {
        ctx.fillStyle = RP.muted; ctx.font = '11px Inter, sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(l, ptX(i), pad.top + cH + 20);
    });

    // Legend
    if (datasets.length > 1) {
        let lx = pad.left;
        datasets.forEach(ds => {
            ctx.fillStyle = ds.color || RP.sky;
            ctx.fillRect(lx, pad.top + cH + 34, 14, 4);
            ctx.fillStyle = RP.text; ctx.font = '10px Inter, sans-serif'; ctx.textAlign = 'left';
            ctx.fillText(ds.label, lx + 18, pad.top + cH + 39);
            lx += ctx.measureText(ds.label).width + 40;
        });
    }
}

function rpDonut(id, labels, data, colors) {
    const s = rpSetup(id); if (!s) return;
    const { ctx, W, H } = s;
    const cx = W / 2, cy = H / 2;
    const R = Math.min(W, H) / 2 - 8;
    const r = R * 0.58;
    const total = data.reduce((a, b) => a + b, 0);
    let startAngle = -Math.PI / 2;

    data.forEach((v, i) => {
        const slice = (v / total) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, R, startAngle, startAngle + slice);
        ctx.arc(cx, cy, r, startAngle + slice, startAngle, true);
        ctx.closePath();
        ctx.fillStyle = colors[i]; ctx.fill();

        // Percentage label on slice
        const midAngle = startAngle + slice / 2;
        const labelR = (R + r) / 2;
        const lx = cx + labelR * Math.cos(midAngle);
        const ly = cy + labelR * Math.sin(midAngle);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 11px Inter, sans-serif'; ctx.textAlign = 'center';
        ctx.fillText((v / total * 100).toFixed(1) + '%', lx, ly + 4);

        startAngle += slice;
    });

    // Center
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(cx, cy, r - 1, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = RP.text; ctx.font = 'bold 16px Inter, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('100%', cx, cy + 2);
    ctx.fillStyle = RP.muted; ctx.font = '9px Inter, sans-serif';
    ctx.fillText('RECEITA', cx, cy + 16);
}

function rpDualAxis(id, labels, barData, lineData, opts = {}) {
    const s = rpSetup(id); if (!s) return;
    const { ctx, W, H } = s;
    const pad = { top: 24, right: 65, bottom: 50, left: 60 };
    const cW = W - pad.left - pad.right, cH = H - pad.top - pad.bottom;
    const barMax = (opts.barMax || Math.max(...barData.data)) * 1.12;
    const lineMax = (opts.lineMax || Math.max(...lineData.data)) * 1.08;
    const lineMin = (opts.lineMin !== undefined ? opts.lineMin : Math.min(...lineData.data)) * 0.95;
    const lineRange = lineMax - lineMin;
    const n = labels.length;
    const barW = Math.min(42, (cW / n) * 0.55);
    const gap = cW / n;

    // Grid (left axis)
    rpGrid(ctx, pad.left, pad.top, cW, cH, 5, barMax, opts.barFmt);

    // Right axis labels
    for (let i = 0; i <= 5; i++) {
        const val = lineMin + lineRange * (1 - i / 5);
        const yy = pad.top + (cH / 5) * i;
        ctx.fillStyle = RP.orange; ctx.font = '11px Inter, sans-serif'; ctx.textAlign = 'left';
        ctx.fillText(opts.lineFmt ? opts.lineFmt(val) : val.toFixed(1), pad.left + cW + 10, yy + 4);
    }

    // Bars
    barData.data.forEach((v, i) => {
        const bH = (v / barMax) * cH;
        const bX = pad.left + i * gap + (gap - barW) / 2;
        const bY = pad.top + cH - bH;
        const grad = ctx.createLinearGradient(bX, bY, bX, pad.top + cH);
        grad.addColorStop(0, barData.color || RP.sky);
        grad.addColorStop(1, RP.primary);
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.roundRect(bX, bY, barW, bH, [4, 4, 0, 0]); ctx.fill();
    });

    // Line
    function lineY(v) { return pad.top + cH - ((v - lineMin) / lineRange) * cH; }
    function lineX(i) { return pad.left + i * gap + gap / 2; }

    ctx.beginPath(); ctx.strokeStyle = lineData.color || RP.orange; ctx.lineWidth = 2.5; ctx.lineJoin = 'round';
    lineData.data.forEach((v, i) => i === 0 ? ctx.moveTo(lineX(i), lineY(v)) : ctx.lineTo(lineX(i), lineY(v)));
    ctx.stroke();

    lineData.data.forEach((v, i) => {
        ctx.beginPath(); ctx.arc(lineX(i), lineY(v), 4, 0, Math.PI * 2);
        ctx.fillStyle = lineData.color || RP.orange; ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = RP.text; ctx.font = '9px Inter, sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(opts.lineValFmt ? opts.lineValFmt(v) : v.toFixed(1), lineX(i), lineY(v) - 10);
    });

    // X labels
    labels.forEach((l, i) => {
        ctx.fillStyle = RP.muted; ctx.font = '11px Inter, sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(l, pad.left + i * gap + gap / 2, pad.top + cH + 20);
    });

    // Legend
    ctx.fillStyle = barData.color || RP.sky; ctx.fillRect(pad.left, pad.top + cH + 34, 14, 4);
    ctx.fillStyle = RP.text; ctx.font = '10px Inter, sans-serif'; ctx.textAlign = 'left';
    ctx.fillText(barData.label, pad.left + 18, pad.top + cH + 39);
    const lx2 = pad.left + ctx.measureText(barData.label).width + 50;
    ctx.fillStyle = lineData.color || RP.orange; ctx.fillRect(lx2, pad.top + cH + 34, 14, 4);
    ctx.fillStyle = RP.text; ctx.fillText(lineData.label, lx2 + 18, pad.top + cH + 39);
}

function drawReportCharts(d) {
    // Page 2: Receita Mensal
    rpBar('rp-chart-receita', PERIODOS, d.receitaMensal, {
        yFmt: v => 'R$ ' + (v / 1e6).toFixed(1) + 'M',
        valFmt: v => 'R$ ' + (v / 1e6).toFixed(1) + 'M',
        color2: '#005f8a'
    });

    // Page 3: Ocupação + Avaliação dual axis
    rpDualAxis('rp-chart-sazon', PERIODOS,
        { label: 'Ocupação (%)', data: d.ocupacaoMensal, color: RP.sky },
        { label: 'Avaliação (1-5)', data: d.avaliacaoMensal, color: RP.orange },
        { barMax: 85, barFmt: v => v.toFixed(0) + '%', lineMin: 3.5, lineMax: 4.5, lineFmt: v => v.toFixed(1), lineValFmt: v => v.toFixed(1) }
    );

    // Page 4: Receita por Estado (bar + donut)
    const estLabels = d.receitaPorEstado.map(e => e.sigla);
    const estVals = d.receitaPorEstado.map(e => e.total);
    const estColors = ['#0077B6', '#00B4D8', '#06D6A0', '#F4A261'];
    rpBar('rp-chart-estado-bar', estLabels, estVals, {
        yFmt: v => 'R$ ' + (v / 1e6).toFixed(1) + 'M',
        valFmt: v => 'R$ ' + (v / 1e6).toFixed(1) + 'M',
        colors: estColors, color2: '#005f8a'
    });
    rpDonut('rp-chart-estado-donut', estLabels, estVals, estColors);

    // Page 5: Ocupação por Cidade
    rpHBar('rp-chart-cidades',
        d.ocupacaoPorCidade.map(c => c.nome),
        d.ocupacaoPorCidade.map(c => c.media)
    );

    // Page 6: Tipo (bar + donut)
    const tipoLabels = d.tipoDados.map(t => t.tipo);
    const tipoVals = d.tipoDados.map(t => t.receita);
    const tipoColors = ['#00B4D8', '#06D6A0', '#FFB703'];
    rpBar('rp-chart-tipo-bar', tipoLabels, tipoVals, {
        yFmt: v => 'R$ ' + (v / 1e6).toFixed(0) + 'M',
        valFmt: v => 'R$ ' + (v / 1e6).toFixed(1) + 'M',
        colors: tipoColors, color2: '#005f8a'
    });
    rpDonut('rp-chart-tipo-donut', tipoLabels, tipoVals, tipoColors);
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

    // Min/Max por mês
    const mesSelected = DashboardState.mes !== 'Todos';
    const metrics = [
        { id: 'kpi-clientes', key: 'clientes', fmt: fmtNum },
        { id: 'kpi-receita', key: 'receita', fmt: fmtRec },
        { id: 'kpi-ocupacao', key: 'ocupacao', fmt: v => v.toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + '%' },
        { id: 'kpi-avaliacao', key: 'avaliacao', fmt: v => v.toLocaleString('pt-BR', { maximumFractionDigits: 1 }) },
    ];
    metrics.forEach(({ id, key, fmt }) => {
        const card = document.getElementById(id);
        if (!card) return;
        const bestEl = card.querySelector('.kpi-best');
        const worstEl = card.querySelector('.kpi-worst');
        if (!bestEl || !worstEl) return;

        if (mesSelected) {
            bestEl.textContent = '';
            worstEl.textContent = '';
            return;
        }

        const monthly = getFilteredMonthlyData(key);
        let maxVal = -Infinity, minVal = Infinity, maxIdx = 0, minIdx = 0;
        monthly.forEach((v, i) => {
            if (v > maxVal) { maxVal = v; maxIdx = i; }
            if (v < minVal) { minVal = v; minIdx = i; }
        });
        bestEl.textContent = '▲ Melhor: ' + PERIODOS[maxIdx] + ' (' + fmt(maxVal) + ')';
        worstEl.textContent = '▼ Menor: ' + PERIODOS[minIdx] + ' (' + fmt(minVal) + ')';
    });
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
