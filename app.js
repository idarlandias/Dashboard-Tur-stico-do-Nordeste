// ========== CONSTANTES ==========
const MESES_ORDEM = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const MESES_NOME_COMPLETO = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const CORES_ESTADO = { CE: '#38bdf8', RN: '#a78bfa', PE: '#fbbf24', PI: '#34d399' };
const CORES_TIPO = { Hotel: '#38bdf8', Pousada: '#fbbf24', Agencia: '#a78bfa' };
const NOMES_ESTADO = { CE: 'Ceará', RN: 'Rio Grande do Norte', PE: 'Pernambuco', PI: 'Piauí' };

// ========== ESTADO GLOBAL ==========
let dadosFiltrados = [...DADOS_TURISMO];
let charts = {};

// Registrar e desativar datalabels globalmente para não afetar outros gráficos
Chart.register(ChartDataLabels);
Chart.defaults.plugins.datalabels = { display: false };

// ========== UTILIDADES ==========
const fmt = {
    moeda: v => 'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }),
    moedaCurta: v => {
        if (v >= 1e6) return 'R$ ' + (v / 1e6).toFixed(1).replace('.', ',') + 'M';
        if (v >= 1e3) return 'R$ ' + (v / 1e3).toFixed(0) + 'k';
        return 'R$ ' + v.toFixed(0);
    },
    numero: v => v.toLocaleString('pt-BR'),
    pct: v => v.toFixed(1).replace('.', ',') + '%',
    nota: v => v.toFixed(1).replace('.', ',')
};

function agrupar(dados, chave) {
    return dados.reduce((acc, item) => {
        const k = item[chave];
        if (!acc[k]) acc[k] = [];
        acc[k].push(item);
        return acc;
    }, {});
}

function media(arr, campo) {
    if (!arr.length) return 0;
    return arr.reduce((s, i) => s + i[campo], 0) / arr.length;
}

function soma(arr, campo) {
    return arr.reduce((s, i) => s + i[campo], 0);
}

// ========== FILTROS ==========
function inicializarFiltros() {
    const estados = [...new Set(DADOS_TURISMO.map(d => d.estado))].sort();
    const tipos = [...new Set(DADOS_TURISMO.map(d => d.tipo))].sort();

    const selEstado = document.getElementById('filtroEstado');
    const selTipo = document.getElementById('filtroTipo');

    estados.forEach(e => {
        const opt = document.createElement('option');
        opt.value = e;
        opt.textContent = NOMES_ESTADO[e] || e;
        selEstado.appendChild(opt);
    });

    tipos.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t;
        opt.textContent = t;
        selTipo.appendChild(opt);
    });

    atualizarCidades();

    selEstado.addEventListener('change', () => { atualizarCidades(); aplicarFiltros(); });
    document.getElementById('filtroCidade').addEventListener('change', aplicarFiltros);
    selTipo.addEventListener('change', aplicarFiltros);
    document.getElementById('btnLimpar').addEventListener('click', limparFiltros);
}

function atualizarCidades() {
    const estado = document.getElementById('filtroEstado').value;
    const selCidade = document.getElementById('filtroCidade');
    const valorAtual = selCidade.value;

    selCidade.innerHTML = '<option value="todos">Todas as Cidades</option>';

    let cidades;
    if (estado === 'todos') {
        cidades = [...new Set(DADOS_TURISMO.map(d => d.cidade))].sort();
    } else {
        cidades = [...new Set(DADOS_TURISMO.filter(d => d.estado === estado).map(d => d.cidade))].sort();
    }

    cidades.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c;
        opt.textContent = c;
        selCidade.appendChild(opt);
    });

    if (cidades.includes(valorAtual)) selCidade.value = valorAtual;
}

function aplicarFiltros() {
    const estado = document.getElementById('filtroEstado').value;
    const cidade = document.getElementById('filtroCidade').value;
    const tipo = document.getElementById('filtroTipo').value;

    dadosFiltrados = DADOS_TURISMO.filter(d => {
        if (estado !== 'todos' && d.estado !== estado) return false;
        if (cidade !== 'todos' && d.cidade !== cidade) return false;
        if (tipo !== 'todos' && d.tipo !== tipo) return false;
        return true;
    });

    atualizarDashboard();
}

function limparFiltros() {
    document.getElementById('filtroEstado').value = 'todos';
    document.getElementById('filtroCidade').value = 'todos';
    document.getElementById('filtroTipo').value = 'todos';
    atualizarCidades();
    dadosFiltrados = [...DADOS_TURISMO];
    atualizarDashboard();
}

// ========== KPIs com VARIAÇÃO por Mês ==========
function atualizarKPIs() {
    document.getElementById('kpiReceita').textContent = fmt.moedaCurta(soma(dadosFiltrados, 'receita'));
    document.getElementById('kpiClientes').textContent = fmt.numero(soma(dadosFiltrados, 'clientes'));
    document.getElementById('kpiOcupacao').textContent = fmt.pct(media(dadosFiltrados, 'ocupacao'));
    document.getElementById('kpiAvaliacao').textContent = fmt.nota(media(dadosFiltrados, 'avaliacao'));

    // Calcular variação por mês
    const porMesIdx = agrupar(dadosFiltrados, 'mesIdx');
    const mesesDisp = Object.keys(porMesIdx).map(m => parseInt(m));

    if (mesesDisp.length > 1) {
        // Receita
        const receitaPorMes = mesesDisp.map(m => ({ mes: m, val: soma(porMesIdx[m], 'receita') }));
        receitaPorMes.sort((a, b) => b.val - a.val);
        const rMelhor = receitaPorMes[0], rPior = receitaPorMes[receitaPorMes.length - 1];
        document.getElementById('kpiReceitaVar').innerHTML =
            `<span class="var-melhor">▲ Melhor: ${MESES_ORDEM[rMelhor.mes]} (${fmt.moedaCurta(rMelhor.val)})</span><br><span class="var-pior">▼ Menor: ${MESES_ORDEM[rPior.mes]} (${fmt.moedaCurta(rPior.val)})</span>`;

        // Clientes
        const clientesPorMes = mesesDisp.map(m => ({ mes: m, val: soma(porMesIdx[m], 'clientes') }));
        clientesPorMes.sort((a, b) => b.val - a.val);
        const cMelhor = clientesPorMes[0], cPior = clientesPorMes[clientesPorMes.length - 1];
        document.getElementById('kpiClientesVar').innerHTML =
            `<span class="var-melhor">▲ Melhor: ${MESES_ORDEM[cMelhor.mes]} (${fmt.numero(cMelhor.val)})</span><br><span class="var-pior">▼ Menor: ${MESES_ORDEM[cPior.mes]} (${fmt.numero(cPior.val)})</span>`;

        // Ocupação
        const ocupPorMes = mesesDisp.map(m => ({ mes: m, val: media(porMesIdx[m], 'ocupacao') }));
        ocupPorMes.sort((a, b) => b.val - a.val);
        const oMelhor = ocupPorMes[0], oPior = ocupPorMes[ocupPorMes.length - 1];
        document.getElementById('kpiOcupacaoVar').innerHTML =
            `<span class="var-melhor">▲ Melhor: ${MESES_ORDEM[oMelhor.mes]} (${fmt.pct(oMelhor.val)})</span><br><span class="var-pior">▼ Menor: ${MESES_ORDEM[oPior.mes]} (${fmt.pct(oPior.val)})</span>`;

        // Avaliação
        const avalPorMes = mesesDisp.map(m => ({ mes: m, val: media(porMesIdx[m], 'avaliacao') }));
        avalPorMes.sort((a, b) => b.val - a.val);
        const aMelhor = avalPorMes[0], aPior = avalPorMes[avalPorMes.length - 1];
        document.getElementById('kpiAvaliacaoVar').innerHTML =
            `<span class="var-melhor">▲ Melhor: ${MESES_ORDEM[aMelhor.mes]} (${fmt.nota(aMelhor.val)})</span><br><span class="var-pior">▼ Menor: ${MESES_ORDEM[aPior.mes]} (${fmt.nota(aPior.val)})</span>`;
    } else {
        // Apenas 1 mês: esconder indicadores
        ['kpiReceitaVar','kpiClientesVar','kpiOcupacaoVar','kpiAvaliacaoVar'].forEach(id => {
            document.getElementById(id).innerHTML = '';
        });
    }
}

// ========== CHART CONFIG BASE ==========
const chartDefaults = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: 'bottom',
            labels: { padding: 16, usePointStyle: true, pointStyleWidth: 10, font: { size: 11, family: 'Inter' }, color: '#94a3b8' }
        },
        tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            titleFont: { family: 'Inter', size: 12 },
            titleColor: '#f1f5f9',
            bodyFont: { family: 'Inter', size: 11 },
            bodyColor: '#cbd5e1',
            padding: 12,
            cornerRadius: 10,
            borderColor: 'rgba(255,255,255,0.08)',
            borderWidth: 1,
            displayColors: true
        },
        datalabels: { display: false }
    },
    scales: {
        x: {
            grid: { display: false },
            ticks: { font: { size: 11, family: 'Inter' }, color: '#64748b' }
        },
        y: {
            grid: { color: 'rgba(255, 255, 255, 0.04)' },
            ticks: { font: { size: 11, family: 'Inter' }, color: '#64748b' },
            border: { display: false }
        }
    }
};

function criarOuAtualizar(id, config) {
    if (charts[id]) {
        charts[id].destroy();
    }
    charts[id] = new Chart(document.getElementById(id), config);
}

// ========== GRÁFICO 1: Receita por Estado (Linha) ==========
function chartReceitaEstado() {
    const porEstado = agrupar(dadosFiltrados, 'estado');
    const datasets = Object.keys(porEstado).sort().map(est => {
        const porMes = agrupar(porEstado[est], 'mesAbrev');
        const valores = MESES_ORDEM.map(m => porMes[m] ? soma(porMes[m], 'receita') : 0);
        return {
            label: NOMES_ESTADO[est] || est,
            data: valores,
            borderColor: CORES_ESTADO[est],
            backgroundColor: CORES_ESTADO[est] + '20',
            borderWidth: 2.5,
            tension: 0.3,
            fill: true,
            pointRadius: 3,
            pointHoverRadius: 6
        };
    });

    criarOuAtualizar('chartReceitaEstado', {
        type: 'line',
        data: { labels: MESES_ORDEM, datasets },
        options: {
            ...chartDefaults,
            scales: {
                ...chartDefaults.scales,
                y: { ...chartDefaults.scales.y, ticks: { ...chartDefaults.scales.y.ticks, callback: v => fmt.moedaCurta(v) } }
            },
            plugins: {
                ...chartDefaults.plugins,
                tooltip: {
                    ...chartDefaults.plugins.tooltip,
                    callbacks: { label: ctx => ctx.dataset.label + ': ' + fmt.moeda(ctx.raw) }
                }
            }
        }
    });
}

// ========== GRÁFICO 2: Receita por Tipo (Barras) ==========
function chartReceitaTipo() {
    const porTipo = agrupar(dadosFiltrados, 'tipo');
    const items = Object.keys(porTipo).map(t => ({ tipo: t, total: soma(porTipo[t], 'receita') }));
    items.sort((a, b) => b.total - a.total);
    const labels = items.map(i => i.tipo);
    const valores = items.map(i => i.total);
    const cores = labels.map(t => CORES_TIPO[t]);

    criarOuAtualizar('chartReceitaTipo', {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                data: valores,
                backgroundColor: cores.map(c => c + 'CC'),
                borderColor: cores,
                borderWidth: 2,
                borderRadius: 8,
                barPercentage: 0.6
            }]
        },
        options: {
            ...chartDefaults,
            plugins: {
                ...chartDefaults.plugins,
                legend: { display: false },
                tooltip: {
                    ...chartDefaults.plugins.tooltip,
                    callbacks: { label: ctx => fmt.moeda(ctx.raw) }
                }
            },
            scales: {
                ...chartDefaults.scales,
                y: { ...chartDefaults.scales.y, ticks: { ...chartDefaults.scales.y.ticks, callback: v => fmt.moedaCurta(v) } }
            }
        }
    });
}

// ========== GRÁFICO 3: Ocupação por Cidade (Barras Horizontais) ==========
function chartOcupacaoCidade() {
    const porCidade = agrupar(dadosFiltrados, 'cidade');
    const items = Object.keys(porCidade).map(c => ({ cidade: c, media: media(porCidade[c], 'ocupacao') }));
    items.sort((a, b) => b.media - a.media);

    const cores = items.map((_, i) => {
        const t = i / Math.max(items.length - 1, 1);
        return t < 0.33 ? '#34d399' : t < 0.66 ? '#fbbf24' : '#fb7185';
    });

    criarOuAtualizar('chartOcupacaoCidade', {
        type: 'bar',
        data: {
            labels: items.map(i => i.cidade),
            datasets: [{
                data: items.map(i => i.media),
                backgroundColor: cores.map(c => c + 'CC'),
                borderColor: cores,
                borderWidth: 2,
                borderRadius: 6,
                barPercentage: 0.7
            }]
        },
        options: {
            ...chartDefaults,
            indexAxis: 'y',
            plugins: {
                ...chartDefaults.plugins,
                legend: { display: false },
                tooltip: {
                    ...chartDefaults.plugins.tooltip,
                    callbacks: { label: ctx => fmt.pct(ctx.raw) }
                }
            },
            layout: { padding: { left: 8 } },
            scales: {
                x: { ...chartDefaults.scales.x, max: 100, ticks: { ...chartDefaults.scales.x.ticks, callback: v => v + '%' } },
                y: { ...chartDefaults.scales.y, grid: { display: false }, ticks: { font: { size: 11, family: 'Inter' }, color: '#64748b', autoSkip: false, padding: 4 }, afterFit: axis => { axis.width = window.innerWidth < 480 ? 100 : 130; } }
            }
        }
    });
}

// ========== GRÁFICO 4: Clientes por Mês (Barras) ==========
function chartClientesMes() {
    const porMes = agrupar(dadosFiltrados, 'mesAbrev');
    const valores = MESES_ORDEM.map(m => porMes[m] ? soma(porMes[m], 'clientes') : 0);

    criarOuAtualizar('chartClientesMes', {
        type: 'bar',
        data: {
            labels: MESES_ORDEM,
            datasets: [{
                data: valores,
                backgroundColor: '#38bdf8AA',
                borderColor: '#38bdf8',
                borderWidth: 2,
                borderRadius: 6,
                barPercentage: 0.65
            }]
        },
        options: {
            ...chartDefaults,
            plugins: {
                ...chartDefaults.plugins,
                legend: { display: false },
                tooltip: {
                    ...chartDefaults.plugins.tooltip,
                    callbacks: { label: ctx => fmt.numero(ctx.raw) + ' clientes' }
                }
            },
            scales: {
                ...chartDefaults.scales,
                y: { ...chartDefaults.scales.y, ticks: { ...chartDefaults.scales.y.ticks, callback: v => v >= 1000 ? (v/1000).toFixed(0) + 'k' : v } }
            }
        }
    });
}

// ========== GRÁFICO 5: Avaliação por Cidade (Barras Horizontais) ==========
function chartAvaliacaoCidade() {
    const porCidade = agrupar(dadosFiltrados, 'cidade');
    const items = Object.keys(porCidade).map(c => ({ cidade: c, media: media(porCidade[c], 'avaliacao') }));
    items.sort((a, b) => b.media - a.media);

    const cores = items.map(i => {
        if (i.media >= 4.3) return '#34d399';
        if (i.media >= 3.8) return '#fbbf24';
        return '#fb7185';
    });

    criarOuAtualizar('chartAvaliacaoCidade', {
        type: 'bar',
        data: {
            labels: items.map(i => i.cidade),
            datasets: [{
                data: items.map(i => i.media),
                backgroundColor: cores.map(c => c + 'CC'),
                borderColor: cores,
                borderWidth: 2,
                borderRadius: 6,
                barPercentage: 0.7
            }]
        },
        options: {
            ...chartDefaults,
            indexAxis: 'y',
            plugins: {
                ...chartDefaults.plugins,
                legend: { display: false },
                tooltip: {
                    ...chartDefaults.plugins.tooltip,
                    callbacks: { label: ctx => fmt.nota(ctx.raw) + ' / 5.0' }
                }
            },
            layout: { padding: { left: 8 } },
            scales: {
                x: { ...chartDefaults.scales.x, min: 2.5, max: 5, ticks: { ...chartDefaults.scales.x.ticks, stepSize: 0.5 } },
                y: { ...chartDefaults.scales.y, grid: { display: false }, ticks: { font: { size: 11, family: 'Inter' }, color: '#64748b', autoSkip: false, padding: 4 }, afterFit: axis => { axis.width = window.innerWidth < 480 ? 100 : 130; } }
            }
        }
    });
}

// ========== GRÁFICO 6: Scatter Receita Total vs Ocupação por Cidade ==========
function chartScatter() {
    const porCidade = agrupar(dadosFiltrados, 'cidade');
    const cidades = Object.keys(porCidade).sort();

    // Agrupar por estado para criar datasets separados (legenda por estado)
    const cidadesPorEstado = {};
    cidades.forEach(c => {
        const estado = porCidade[c][0].estado;
        if (!cidadesPorEstado[estado]) cidadesPorEstado[estado] = [];
        cidadesPorEstado[estado].push({
            x: media(porCidade[c], 'ocupacao'),
            y: soma(porCidade[c], 'receita'),
            cidade: c,
            estado: NOMES_ESTADO[estado] || estado
        });
    });

    const datasets = Object.keys(cidadesPorEstado).sort().map(estado => ({
        label: NOMES_ESTADO[estado] || estado,
        data: cidadesPorEstado[estado],
        backgroundColor: CORES_ESTADO[estado] + 'AA',
        borderColor: CORES_ESTADO[estado],
        borderWidth: 2,
        pointRadius: 8,
        pointHoverRadius: 12
    }));

    criarOuAtualizar('chartScatter', {
        type: 'scatter',
        data: { datasets },
        options: {
            ...chartDefaults,
            scales: {
                x: { ...chartDefaults.scales.x, title: { display: true, text: 'Ocupação Média (%)', font: { size: 11, family: 'Inter' }, color: '#94a3b8' }, ticks: { ...chartDefaults.scales.x.ticks, callback: v => v + '%' } },
                y: { ...chartDefaults.scales.y, title: { display: true, text: 'Receita Total (R$)', font: { size: 11, family: 'Inter' }, color: '#94a3b8' }, ticks: { ...chartDefaults.scales.y.ticks, callback: v => fmt.moedaCurta(v) } }
            },
            plugins: {
                ...chartDefaults.plugins,
                legend: {
                    position: 'bottom',
                    labels: { padding: 16, usePointStyle: true, pointStyleWidth: 10, font: { size: 11, family: 'Inter' }, color: '#94a3b8' }
                },
                tooltip: {
                    ...chartDefaults.plugins.tooltip,
                    callbacks: {
                        title: ctxs => ctxs[0].raw.cidade || '',
                        label: ctx => [
                            ctx.raw.estado,
                            'Ocupação: ' + fmt.pct(ctx.raw.x),
                            'Receita: ' + fmt.moeda(ctx.raw.y)
                        ]
                    }
                },
                datalabels: {
                    display: true,
                    formatter: (value) => value.cidade,
                    color: '#94a3b8',
                    font: { size: 9, family: 'Inter' },
                    anchor: 'end',
                    align: function(context) {
                        const cidade = context.dataset.data[context.dataIndex].cidade;
                        if (cidade === 'Natal') return 'right';
                        return 'top';
                    },
                    offset: 6
                }
            }
        }
    });
}

// ========== GRÁFICO 7: Donut de Participação por Estado ==========
function chartDonutEstado() {
    const porEstado = agrupar(dadosFiltrados, 'estado');
    const estados = Object.keys(porEstado).sort();
    const totais = estados.map(e => soma(porEstado[e], 'receita'));
    const totalGeral = totais.reduce((a, b) => a + b, 0);
    const cores = estados.map(e => CORES_ESTADO[e] || '#64748b');

    criarOuAtualizar('chartDonutEstado', {
        type: 'doughnut',
        data: {
            labels: estados.map(e => NOMES_ESTADO[e] || e),
            datasets: [{
                data: totais,
                backgroundColor: cores.map(c => c + 'CC'),
                borderColor: cores,
                borderWidth: 2,
                hoverOffset: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '65%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { padding: 12, usePointStyle: true, pointStyleWidth: 8, font: { size: 10, family: 'Inter' }, color: '#94a3b8' }
                },
                tooltip: {
                    ...chartDefaults.plugins.tooltip,
                    callbacks: {
                        label: ctx => {
                            const pct = ((ctx.raw / totalGeral) * 100).toFixed(1).replace('.', ',');
                            return ` ${ctx.label}: ${fmt.moedaCurta(ctx.raw)} (${pct}%)`;
                        }
                    }
                },
                datalabels: { display: false }
            }
        }
    });
}

// ========== GRÁFICO 8: Donut de Participação por Tipo ==========
function chartDonutTipo() {
    const porTipo = agrupar(dadosFiltrados, 'tipo');
    const tipos = Object.keys(porTipo).sort();
    const totais = tipos.map(t => soma(porTipo[t], 'receita'));
    const totalGeral = totais.reduce((a, b) => a + b, 0);
    const cores = tipos.map(t => CORES_TIPO[t] || '#64748b');

    criarOuAtualizar('chartDonutTipo', {
        type: 'doughnut',
        data: {
            labels: tipos,
            datasets: [{
                data: totais,
                backgroundColor: cores.map(c => c + 'CC'),
                borderColor: cores,
                borderWidth: 2,
                hoverOffset: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '65%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { padding: 12, usePointStyle: true, pointStyleWidth: 8, font: { size: 10, family: 'Inter' }, color: '#94a3b8' }
                },
                tooltip: {
                    ...chartDefaults.plugins.tooltip,
                    callbacks: {
                        label: ctx => {
                            const pct = ((ctx.raw / totalGeral) * 100).toFixed(1).replace('.', ',');
                            return ` ${ctx.label}: ${fmt.moedaCurta(ctx.raw)} (${pct}%)`;
                        }
                    }
                },
                datalabels: { display: false }
            }
        }
    });
}

// ========== RESUMO RÁPIDO ==========
function atualizarResumoRapido() {
    const container = document.getElementById('resumoRapidoBody');
    if (!dadosFiltrados.length) { container.innerHTML = '<p style="color:var(--text-muted);font-size:.85rem;padding:20px">Nenhum dado disponível</p>'; return; }

    // Cidade com maior receita
    const porCidade = agrupar(dadosFiltrados, 'cidade');
    const cidadeReceitas = Object.keys(porCidade).map(c => ({ cidade: c, total: soma(porCidade[c], 'receita') }));
    cidadeReceitas.sort((a, b) => b.total - a.total);
    const cidadeTopReceita = cidadeReceitas[0];

    // Tipo mais avaliado
    const porTipo = agrupar(dadosFiltrados, 'tipo');
    const tipoAval = Object.keys(porTipo).map(t => ({ tipo: t, media: media(porTipo[t], 'avaliacao') }));
    tipoAval.sort((a, b) => b.media - a.media);
    const topTipo = tipoAval[0];

    // Mês de pico
    const porMesIdx = agrupar(dadosFiltrados, 'mesIdx');
    const mesPicos = Object.keys(porMesIdx).map(m => ({ mes: parseInt(m), total: soma(porMesIdx[m], 'receita') }));
    mesPicos.sort((a, b) => b.total - a.total);
    const mesPico = mesPicos[0];

    container.innerHTML = `
        <div class="resumo-item">
            <div class="resumo-icon" style="background:rgba(56,189,248,.12);color:#38bdf8">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </div>
            <div>
                <div class="resumo-label">Maior Receita</div>
                <div class="resumo-valor">${cidadeTopReceita.cidade} <span>${fmt.moedaCurta(cidadeTopReceita.total)}</span></div>
            </div>
        </div>
        <div class="resumo-item">
            <div class="resumo-icon" style="background:rgba(167,139,250,.12);color:#a78bfa">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            </div>
            <div>
                <div class="resumo-label">Tipo Mais Avaliado</div>
                <div class="resumo-valor">${topTipo.tipo} <span>${fmt.nota(topTipo.media)}/5</span></div>
            </div>
        </div>
        <div class="resumo-item">
            <div class="resumo-icon" style="background:rgba(251,191,36,.12);color:#fbbf24">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
            </div>
            <div>
                <div class="resumo-label">Mês de Pico</div>
                <div class="resumo-valor">${MESES_NOME_COMPLETO[mesPico.mes]} <span>${fmt.moedaCurta(mesPico.total)}</span></div>
            </div>
        </div>
        <div class="resumo-item">
            <div class="resumo-icon" style="background:rgba(52,211,153,.12);color:#34d399">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
            </div>
            <div>
                <div class="resumo-label">Total de Registros</div>
                <div class="resumo-valor">${fmt.numero(dadosFiltrados.length)} <span>registros</span></div>
            </div>
        </div>
    `;

}

// ========== INSIGHTS DINÂMICOS ==========
function gerarInsights() {
    const container = document.getElementById('insightsBody');
    const insights = [];

    // Melhor estado em receita
    const porEstado = agrupar(dadosFiltrados, 'estado');
    const estadoReceita = Object.keys(porEstado).map(e => ({ estado: e, total: soma(porEstado[e], 'receita') }));
    estadoReceita.sort((a, b) => b.total - a.total);
    if (estadoReceita.length > 1) {
        const melhor = estadoReceita[0];
        const pctTotal = (melhor.total / soma(dadosFiltrados, 'receita') * 100);
        insights.push({
            cor: CORES_ESTADO[melhor.estado],
            texto: `<span class="insight-highlight">${NOMES_ESTADO[melhor.estado] || melhor.estado}</span> lidera em receita com ${fmt.moeda(melhor.total)}, representando <span class="insight-highlight">${pctTotal.toFixed(1).replace('.', ',')}%</span> do faturamento total.`
        });
    }

    // Melhor cidade em ocupação
    const porCidade = agrupar(dadosFiltrados, 'cidade');
    const cidadeOcup = Object.keys(porCidade).map(c => ({ cidade: c, media: media(porCidade[c], 'ocupacao') }));
    cidadeOcup.sort((a, b) => b.media - a.media);
    if (cidadeOcup.length > 0) {
        const top = cidadeOcup[0];
        const bottom = cidadeOcup[cidadeOcup.length - 1];
        insights.push({
            cor: '#10b981',
            texto: `<span class="insight-highlight">${top.cidade}</span> tem a maior taxa de ocupação média (${fmt.pct(top.media)}), enquanto <span class="insight-highlight">${bottom.cidade}</span> apresenta a menor (${fmt.pct(bottom.media)}) — uma diferença de ${fmt.pct(top.media - bottom.media)} pontos percentuais.`
        });
    }

    // Tipo mais rentável
    const porTipo = agrupar(dadosFiltrados, 'tipo');
    const tipoReceita = Object.keys(porTipo).map(t => ({ tipo: t, media: soma(porTipo[t], 'receita') / porTipo[t].length }));
    tipoReceita.sort((a, b) => b.media - a.media);
    if (tipoReceita.length > 1) {
        insights.push({
            cor: CORES_TIPO[tipoReceita[0].tipo],
            texto: `O segmento <span class="insight-highlight">${tipoReceita[0].tipo}</span> apresenta a maior receita média por unidade (${fmt.moeda(tipoReceita[0].media)}), sugerindo maior potencial de retorno por empreendimento.`
        });
    }

    // Sazonalidade
    const porMes = agrupar(dadosFiltrados, 'mesIdx');
    const mesReceita = Object.keys(porMes).map(m => ({ mes: parseInt(m), total: soma(porMes[m], 'receita') }));
    mesReceita.sort((a, b) => b.total - a.total);
    if (mesReceita.length > 1) {
        const melhorMes = MESES_ORDEM[mesReceita[0].mes];
        const piorMes = MESES_ORDEM[mesReceita[mesReceita.length - 1].mes];
        insights.push({
            cor: '#f59e0b',
            texto: `A sazonalidade mostra que <span class="insight-highlight">${melhorMes}</span> é o mês de maior faturamento e <span class="insight-highlight">${piorMes}</span> o de menor, indicando oportunidades de ações promocionais em períodos de baixa.`
        });
    }

    // Melhor avaliação
    const cidadeAval = Object.keys(porCidade).map(c => ({ cidade: c, media: media(porCidade[c], 'avaliacao') }));
    cidadeAval.sort((a, b) => b.media - a.media);
    if (cidadeAval.length > 0) {
        insights.push({
            cor: '#8b5cf6',
            texto: `<span class="insight-highlight">${cidadeAval[0].cidade}</span> destaca-se na satisfação do cliente com nota média ${fmt.nota(cidadeAval[0].media)}/5, um indicador importante para fidelização e marketing boca-a-boca.`
        });
    }

    container.innerHTML = insights.map(i => `
        <div class="insight-item">
            <div class="insight-dot" style="background:${i.cor}"></div>
            <div class="insight-text">${i.texto}</div>
        </div>
    `).join('');
}

// ========== ATUALIZAR TUDO ==========
function atualizarDashboard() {
    atualizarKPIs();
    chartDonutEstado();
    chartDonutTipo();
    atualizarResumoRapido();
    chartReceitaEstado();
    chartReceitaTipo();
    chartOcupacaoCidade();
    chartClientesMes();
    chartAvaliacaoCidade();
    chartScatter();
    gerarInsights();
}

// ========== GERAR RELATÓRIO PDF ==========
function gerarSumarioExecutivo() {
    const container = document.getElementById('sumarioConteudo');
    const hoje = new Date();
    document.getElementById('capaData').textContent = hoje.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

    const receitaTotal = soma(dadosFiltrados, 'receita');
    const totalClientes = soma(dadosFiltrados, 'clientes');
    const mediaOcupacao = media(dadosFiltrados, 'ocupacao');
    const mediaAvaliacao = media(dadosFiltrados, 'avaliacao');

    // Ranking por estado
    const porEstado = agrupar(dadosFiltrados, 'estado');
    const rankEstado = Object.keys(porEstado).map(e => ({
        nome: NOMES_ESTADO[e] || e,
        receita: soma(porEstado[e], 'receita'),
        clientes: soma(porEstado[e], 'clientes'),
        ocupacao: media(porEstado[e], 'ocupacao'),
        avaliacao: media(porEstado[e], 'avaliacao')
    })).sort((a, b) => b.receita - a.receita);

    // Ranking por cidade
    const porCidade = agrupar(dadosFiltrados, 'cidade');
    const rankCidade = Object.keys(porCidade).map(c => ({
        nome: c,
        estado: NOMES_ESTADO[porCidade[c][0].estado] || porCidade[c][0].estado,
        receita: soma(porCidade[c], 'receita'),
        ocupacao: media(porCidade[c], 'ocupacao'),
        avaliacao: media(porCidade[c], 'avaliacao')
    })).sort((a, b) => b.receita - a.receita);

    // Melhor e pior mês
    const porMes = agrupar(dadosFiltrados, 'mesIdx');
    const rankMes = Object.keys(porMes).map(m => ({
        mes: MESES_NOME_COMPLETO[parseInt(m)],
        total: soma(porMes[m], 'receita')
    })).sort((a, b) => b.total - a.total);

    const melhorMes = rankMes[0];
    const piorMes = rankMes[rankMes.length - 1];
    const variacao = ((melhorMes.total - piorMes.total) / piorMes.total * 100).toFixed(1);

    // Dados por tipo de empreendimento
    const porTipo = agrupar(dadosFiltrados, 'tipo');
    const rankTipo = Object.keys(porTipo).map(t => ({
        nome: t,
        receita: soma(porTipo[t], 'receita'),
        receitaMedia: soma(porTipo[t], 'receita') / porTipo[t].length,
        clientes: soma(porTipo[t], 'clientes'),
        ocupacao: media(porTipo[t], 'ocupacao'),
        avaliacao: media(porTipo[t], 'avaliacao')
    })).sort((a, b) => b.receita - a.receita);

    // Dados de receita mensal consolidada
    const receitaMensal = MESES_ORDEM.map((m, idx) => {
        const registrosMes = dadosFiltrados.filter(d => d.mesIdx === idx);
        return {
            mes: MESES_NOME_COMPLETO[idx],
            receita: soma(registrosMes, 'receita'),
            clientes: soma(registrosMes, 'clientes'),
            ocupacao: media(registrosMes, 'ocupacao'),
            avaliacao: media(registrosMes, 'avaliacao')
        };
    });

    container.innerHTML = `
        <div class="sumario-grid">
            <div class="sumario-kpi">
                <div class="sumario-kpi-valor">${fmt.moedaCurta(receitaTotal)}</div>
                <div class="sumario-kpi-label">Receita Total</div>
                <div class="sumario-kpi-detalhe">Acumulado 12 meses</div>
            </div>
            <div class="sumario-kpi">
                <div class="sumario-kpi-valor">${fmt.numero(totalClientes)}</div>
                <div class="sumario-kpi-label">Total de Clientes</div>
                <div class="sumario-kpi-detalhe">Atendidos no período</div>
            </div>
            <div class="sumario-kpi">
                <div class="sumario-kpi-valor">${fmt.pct(mediaOcupacao)}</div>
                <div class="sumario-kpi-label">Ocupação Média</div>
                <div class="sumario-kpi-detalhe">Média geral dos destinos</div>
            </div>
            <div class="sumario-kpi">
                <div class="sumario-kpi-valor">${fmt.nota(mediaAvaliacao)}/5</div>
                <div class="sumario-kpi-label">Satisfação</div>
                <div class="sumario-kpi-detalhe">Avaliação média dos clientes</div>
            </div>
        </div>

        <div class="sumario-secao">
            <h3>Desempenho por Estado</h3>
            <table class="sumario-tabela">
                <thead>
                    <tr><th>Estado</th><th>Receita Total</th><th>% do Total</th><th>Clientes</th><th>Ocupação</th><th>Avaliação</th></tr>
                </thead>
                <tbody>
                    ${rankEstado.map((e, i) => `<tr>
                        <td>${i === 0 ? '<span class="sumario-destaque">' + e.nome + '</span>' : e.nome}</td>
                        <td>${fmt.moeda(e.receita)}</td>
                        <td>${(e.receita / receitaTotal * 100).toFixed(1)}%</td>
                        <td>${fmt.numero(e.clientes)}</td>
                        <td>${fmt.pct(e.ocupacao)}</td>
                        <td>${fmt.nota(e.avaliacao)}</td>
                    </tr>`).join('')}
                </tbody>
            </table>
        </div>

        <div class="sumario-secao">
            <h3>Top 5 Cidades por Receita</h3>
            <table class="sumario-tabela">
                <thead>
                    <tr><th>Cidade</th><th>Estado</th><th>Receita Total</th><th>Ocupação</th><th>Avaliação</th></tr>
                </thead>
                <tbody>
                    ${rankCidade.slice(0, 5).map((c, i) => `<tr>
                        <td>${i === 0 ? '<span class="sumario-destaque">' + c.nome + '</span>' : c.nome}</td>
                        <td>${c.estado}</td>
                        <td>${fmt.moeda(c.receita)}</td>
                        <td>${fmt.pct(c.ocupacao)}</td>
                        <td>${fmt.nota(c.avaliacao)}</td>
                    </tr>`).join('')}
                </tbody>
            </table>
        </div>

        <div class="sumario-secao">
            <h3>Análise de Sazonalidade</h3>
            <p class="sumario-texto">
                O mês de maior faturamento foi <span class="sumario-destaque">${melhorMes.mes}</span> com ${fmt.moeda(melhorMes.total)},
                enquanto <span class="sumario-destaque">${piorMes.mes}</span> registrou o menor volume com ${fmt.moeda(piorMes.total)}
                — uma variação de <span class="sumario-destaque">${variacao}%</span>.
                Esta amplitude sazonal sugere oportunidades para campanhas de incentivo em períodos de baixa demanda
                e otimização de preços nos meses de pico.
            </p>
        </div>

        <div class="sumario-secao">
            <h3>Recomendações Estratégicas</h3>
            <p class="sumario-texto">
                <strong>1.</strong> Investir em marketing direcionado para destinos com baixa ocupação (como Pipa e Porto de Galinhas) nos meses de menor movimento.<br>
                <strong>2.</strong> Replicar as boas práticas de Canoa Quebrada (maior avaliação) nos demais destinos para elevar a satisfação geral.<br>
                <strong>3.</strong> Explorar o potencial de receita das agências, que apresentam o maior ticket médio por unidade.<br>
                <strong>4.</strong> Criar pacotes promocionais nos meses de baixa (${piorMes.mes}) para equilibrar a sazonalidade.
            </p>
        </div>

        <div class="sumario-secao">
            <h3>Desempenho por Tipo de Empreendimento</h3>
            <table class="sumario-tabela">
                <thead>
                    <tr><th>Tipo</th><th>Receita Total</th><th>Receita Média</th><th>Clientes</th><th>Ocupação</th><th>Avaliação</th></tr>
                </thead>
                <tbody>
                    ${rankTipo.map((t, i) => `<tr>
                        <td>${i === 0 ? '<span class="sumario-destaque">' + t.nome + '</span>' : t.nome}</td>
                        <td>${fmt.moeda(t.receita)}</td>
                        <td>${fmt.moeda(Math.round(t.receitaMedia))}</td>
                        <td>${fmt.numero(t.clientes)}</td>
                        <td>${fmt.pct(t.ocupacao)}</td>
                        <td>${fmt.nota(t.avaliacao)}</td>
                    </tr>`).join('')}
                </tbody>
            </table>
        </div>

        <div class="sumario-secao">
            <h3>Receita Mensal Consolidada</h3>
            <table class="sumario-tabela">
                <thead>
                    <tr><th>Mês</th><th>Receita</th><th>Clientes</th><th>Ocupação</th><th>Avaliação</th></tr>
                </thead>
                <tbody>
                    ${receitaMensal.map(m => `<tr>
                        <td>${m.mes}</td>
                        <td>${fmt.moeda(m.receita)}</td>
                        <td>${fmt.numero(m.clientes)}</td>
                        <td>${fmt.pct(m.ocupacao)}</td>
                        <td>${fmt.nota(m.avaliacao)}</td>
                    </tr>`).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// ========== TABELAS DESCRITIVAS PARA PDF ==========
function gerarTabelasPDF() {
    // Remove tabelas anteriores se existirem
    document.querySelectorAll('.pdf-tabela-descritiva').forEach(el => el.remove());

    const receitaTotal = soma(dadosFiltrados, 'receita');
    const estados = ['CE', 'PE', 'PI', 'RN'];
    const porEstado = agrupar(dadosFiltrados, 'estado');
    const porTipo = agrupar(dadosFiltrados, 'tipo');
    const porCidade = agrupar(dadosFiltrados, 'cidade');

    // ── 1. Receita Mensal por Estado ──
    const receitaMesEstado = MESES_ORDEM.map((m, idx) => {
        const row = { mes: MESES_NOME_COMPLETO[idx] };
        let total = 0;
        estados.forEach(est => {
            const registros = (porEstado[est] || []).filter(d => d.mesIdx === idx);
            const val = soma(registros, 'receita');
            row[est] = val;
            total += val;
        });
        row.total = total;
        return row;
    });
    const totaisMes = receitaMesEstado.map(r => r.total);
    const maxMes = Math.max(...totaisMes);
    const minMes = Math.min(...totaisMes);

    const tbl1 = `<div class="pdf-tabela-descritiva">
        <table class="pdf-tbl">
            <thead><tr>
                <th>Mês</th><th>Ceará</th><th>Pernambuco</th><th>Piauí</th><th>R. G. do Norte</th><th>Total</th>
            </tr></thead>
            <tbody>${receitaMesEstado.map(r => {
                const bold = r.total === maxMes || r.total === minMes;
                const tag = bold ? '<strong>' : '';
                const ctag = bold ? '</strong>' : '';
                return `<tr>
                    <td>${tag}${r.mes}${ctag}</td>
                    <td>${tag}${fmt.moeda(r.CE)}${ctag}</td>
                    <td>${tag}${fmt.moeda(r.PE)}${ctag}</td>
                    <td>${tag}${fmt.moeda(r.PI)}${ctag}</td>
                    <td>${tag}${fmt.moeda(r.RN)}${ctag}</td>
                    <td>${tag}${fmt.moeda(r.total)}${ctag}</td>
                </tr>`;
            }).join('')}</tbody>
        </table>
    </div>`;
    document.getElementById('cardReceitaEstado').insertAdjacentHTML('afterend', tbl1);

    // ── 2. Receita por Tipo de Empreendimento ──
    const rankTipo = Object.keys(porTipo).map(t => ({
        tipo: t,
        receita: soma(porTipo[t], 'receita'),
        receitaMedia: soma(porTipo[t], 'receita') / porTipo[t].length,
        clientes: soma(porTipo[t], 'clientes'),
        ocupacao: media(porTipo[t], 'ocupacao'),
        avaliacao: media(porTipo[t], 'avaliacao')
    })).sort((a, b) => b.receita - a.receita);

    const cardReceitaTipo = document.getElementById('chartReceitaTipo').closest('.chart-card');
    const tbl2 = `<div class="pdf-tabela-descritiva">
        <table class="pdf-tbl">
            <thead><tr>
                <th>Tipo</th><th>Receita Total</th><th>% do Total</th><th>Receita Média</th><th>Clientes</th><th>Ocupação</th><th>Avaliação</th>
            </tr></thead>
            <tbody>${rankTipo.map(t => `<tr>
                <td>${t.tipo}</td>
                <td>${fmt.moeda(t.receita)}</td>
                <td>${(t.receita / receitaTotal * 100).toFixed(1)}%</td>
                <td>${fmt.moeda(Math.round(t.receitaMedia))}</td>
                <td>${fmt.numero(t.clientes)}</td>
                <td>${fmt.pct(t.ocupacao)}</td>
                <td>${fmt.nota(t.avaliacao)}</td>
            </tr>`).join('')}</tbody>
        </table>
    </div>`;
    cardReceitaTipo.insertAdjacentHTML('afterend', tbl2);

    // ── 3. Taxa de Ocupação por Cidade ──
    const rankOcupacao = Object.keys(porCidade).map(c => ({
        cidade: c,
        estado: NOMES_ESTADO[porCidade[c][0].estado] || porCidade[c][0].estado,
        ocupacao: media(porCidade[c], 'ocupacao')
    })).sort((a, b) => b.ocupacao - a.ocupacao);

    const tbl3 = `<div class="pdf-tabela-descritiva">
        <table class="pdf-tbl">
            <thead><tr>
                <th>Cidade</th><th>Estado</th><th>Ocupação Média (%)</th><th>Ranking</th>
            </tr></thead>
            <tbody>${rankOcupacao.map((c, i) => {
                let cls = '';
                if (i < 3) cls = ' class="pdf-bg-green"';
                else if (i >= rankOcupacao.length - 3) cls = ' class="pdf-bg-red"';
                return `<tr${cls}>
                    <td>${c.cidade}</td>
                    <td>${c.estado}</td>
                    <td>${fmt.pct(c.ocupacao)}</td>
                    <td>${i + 1}º</td>
                </tr>`;
            }).join('')}</tbody>
        </table>
    </div>`;
    document.getElementById('cardOcupacao').insertAdjacentHTML('afterend', tbl3);

    // ── 4. Clientes por Mês ──
    const clientesMes = MESES_ORDEM.map((m, idx) => {
        const registros = dadosFiltrados.filter(d => d.mesIdx === idx);
        return { mes: MESES_NOME_COMPLETO[idx], clientes: soma(registros, 'clientes') };
    });
    const cardClientesMes = document.getElementById('chartClientesMes').closest('.chart-card');
    const tbl4 = `<div class="pdf-tabela-descritiva">
        <table class="pdf-tbl">
            <thead><tr>
                <th>Mês</th><th>Total de Clientes</th><th>Variação vs Mês Anterior</th>
            </tr></thead>
            <tbody>${clientesMes.map((m, i) => {
                let variacao = '—';
                if (i > 0) {
                    const prev = clientesMes[i - 1].clientes;
                    const pct = ((m.clientes - prev) / prev * 100).toFixed(1);
                    variacao = (pct > 0 ? '+' : '') + pct + '%';
                }
                return `<tr>
                    <td>${m.mes}</td>
                    <td>${fmt.numero(m.clientes)}</td>
                    <td>${variacao}</td>
                </tr>`;
            }).join('')}</tbody>
        </table>
    </div>`;
    cardClientesMes.insertAdjacentHTML('afterend', tbl4);

    // ── 5. Avaliação Média por Cidade ──
    const rankAvaliacao = Object.keys(porCidade).map(c => ({
        cidade: c,
        estado: NOMES_ESTADO[porCidade[c][0].estado] || porCidade[c][0].estado,
        avaliacao: media(porCidade[c], 'avaliacao')
    })).sort((a, b) => b.avaliacao - a.avaliacao);

    const cardAvaliacao = document.getElementById('chartAvaliacaoCidade').closest('.chart-card');
    const tbl5 = `<div class="pdf-tabela-descritiva">
        <table class="pdf-tbl">
            <thead><tr>
                <th>Cidade</th><th>Estado</th><th>Avaliação Média</th><th>Classificação</th>
            </tr></thead>
            <tbody>${rankAvaliacao.map(c => {
                let classif = 'Regular';
                let cls = 'pdf-classif-regular';
                if (c.avaliacao >= 4.2) { classif = 'Excelente'; cls = 'pdf-classif-excelente'; }
                else if (c.avaliacao >= 3.8) { classif = 'Bom'; cls = 'pdf-classif-bom'; }
                return `<tr>
                    <td>${c.cidade}</td>
                    <td>${c.estado}</td>
                    <td>${fmt.nota(c.avaliacao)}</td>
                    <td><span class="${cls}">${classif}</span></td>
                </tr>`;
            }).join('')}</tbody>
        </table>
    </div>`;
    cardAvaliacao.insertAdjacentHTML('afterend', tbl5);

    // ── 6. Scatter: Receita vs Ocupação por Cidade ──
    const rankScatter = Object.keys(porCidade).map(c => ({
        cidade: c,
        estado: NOMES_ESTADO[porCidade[c][0].estado] || porCidade[c][0].estado,
        ocupacao: media(porCidade[c], 'ocupacao'),
        receita: soma(porCidade[c], 'receita')
    })).sort((a, b) => b.receita - a.receita);

    const tbl6 = `<div class="pdf-tabela-descritiva">
        <table class="pdf-tbl">
            <thead><tr>
                <th>Cidade</th><th>Estado</th><th>Ocupação Média (%)</th><th>Receita Total (R$)</th>
            </tr></thead>
            <tbody>${rankScatter.map(c => `<tr>
                <td>${c.cidade}</td>
                <td>${c.estado}</td>
                <td>${fmt.pct(c.ocupacao)}</td>
                <td>${fmt.moeda(c.receita)}</td>
            </tr>`).join('')}</tbody>
        </table>
    </div>`;
    document.getElementById('cardScatter').insertAdjacentHTML('afterend', tbl6);

    // ── 7. Donuts de participação ──
    // Donut Estado
    const donutEstadoData = Object.keys(porEstado).sort().map(e => ({
        nome: NOMES_ESTADO[e] || e,
        receita: soma(porEstado[e], 'receita')
    }));
    const cardDonutEstado = document.getElementById('chartDonutEstado').closest('.chart-card');
    const tbl7a = `<div class="pdf-tabela-descritiva pdf-tabela-donut">
        <table class="pdf-tbl">
            <thead><tr><th>Estado</th><th>Receita</th><th>% Participação</th></tr></thead>
            <tbody>${donutEstadoData.map(e => `<tr>
                <td>${e.nome}</td>
                <td>${fmt.moeda(e.receita)}</td>
                <td>${(e.receita / receitaTotal * 100).toFixed(1)}%</td>
            </tr>`).join('')}</tbody>
        </table>
    </div>`;
    cardDonutEstado.insertAdjacentHTML('afterend', tbl7a);

    // Donut Tipo
    const donutTipoData = Object.keys(porTipo).sort().map(t => ({
        nome: t,
        receita: soma(porTipo[t], 'receita')
    }));
    const cardDonutTipo = document.getElementById('chartDonutTipo').closest('.chart-card');
    const tbl7b = `<div class="pdf-tabela-descritiva pdf-tabela-donut">
        <table class="pdf-tbl">
            <thead><tr><th>Tipo</th><th>Receita</th><th>% Participação</th></tr></thead>
            <tbody>${donutTipoData.map(t => `<tr>
                <td>${t.nome}</td>
                <td>${fmt.moeda(t.receita)}</td>
                <td>${(t.receita / receitaTotal * 100).toFixed(1)}%</td>
            </tr>`).join('')}</tbody>
        </table>
    </div>`;
    cardDonutTipo.insertAdjacentHTML('afterend', tbl7b);
}

function removerTabelasPDF() {
    document.querySelectorAll('.pdf-tabela-descritiva').forEach(el => el.remove());
}

function exportarPDF() {
    // Gerar sumário executivo com dados atuais
    gerarSumarioExecutivo();

    // Gerar tabelas descritivas abaixo dos gráficos
    gerarTabelasPDF();

    const eraEscuro = !document.body.classList.contains('tema-claro');

    // Forçar tema claro para o PDF
    if (eraEscuro) {
        document.body.classList.add('tema-claro');
        const textColor = '#334155';
        const gridColor = '#e2e8f0';
        Object.values(charts).forEach(chart => {
            if (chart.options.scales) {
                Object.values(chart.options.scales).forEach(scale => {
                    if (scale.ticks) scale.ticks.color = textColor;
                    if (scale.grid) scale.grid.color = gridColor;
                    if (scale.title) scale.title.color = textColor;
                });
            }
            if (chart.options.plugins?.legend?.labels) chart.options.plugins.legend.labels.color = textColor;
            if (chart.options.plugins?.datalabels) chart.options.plugins.datalabels.color = textColor;
            chart.update('none');
        });
    }

    // Forçar legenda visível no gráfico de linhas e padding no scatter
    if (charts['chartReceitaEstado']) {
        charts['chartReceitaEstado'].options.plugins.legend.display = true;
        charts['chartReceitaEstado'].options.plugins.legend.labels.font.size = 9;
        charts['chartReceitaEstado'].options.plugins.legend.labels.padding = 10;
        charts['chartReceitaEstado'].update('none');
    }
    if (charts['chartScatter']) {
        charts['chartScatter'].options.layout.padding = { right: 30 };
        charts['chartScatter'].update('none');
    }

    setTimeout(() => {
        window.print();

        // Restaurar scatter padding
        if (charts['chartScatter']) {
            charts['chartScatter'].options.layout.padding = { right: 0 };
            charts['chartScatter'].update('none');
        }
        // Restaurar legenda do gráfico de linhas
        if (charts['chartReceitaEstado']) {
            charts['chartReceitaEstado'].options.plugins.legend.labels.font.size = 11;
            charts['chartReceitaEstado'].options.plugins.legend.labels.padding = 16;
            charts['chartReceitaEstado'].update('none');
        }

        // Restaurar se era escuro
        if (eraEscuro) {
            document.body.classList.remove('tema-claro');
            Object.values(charts).forEach(chart => {
                if (chart.options.scales) {
                    Object.values(chart.options.scales).forEach(scale => {
                        if (scale.ticks) scale.ticks.color = '#64748b';
                        if (scale.grid) scale.grid.color = 'rgba(255, 255, 255, 0.04)';
                        if (scale.title) scale.title.color = '#94a3b8';
                    });
                }
                if (chart.options.plugins?.legend?.labels) chart.options.plugins.legend.labels.color = '#94a3b8';
                if (chart.options.plugins?.datalabels) chart.options.plugins.datalabels.color = '#94a3b8';
                chart.update('none');
            });
        }

        // Remover tabelas descritivas do DOM
        removerTabelasPDF();
    }, 300);
}

// ========== EXPORTAÇÃO EXCEL ==========
function exportarExcel() {
    const mesesOrdemIdx = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

    // ── Estilos reutilizáveis ──
    const COR_PRIMARIA = '0369A1';
    const COR_PRIMARIA_LIGHT = 'E0F2FE';
    const COR_ACCENT = '0284C7';
    const COR_HEADER = 'F0F9FF';
    const COR_ZEBRA = 'F8FAFC';
    const COR_BRANCO = 'FFFFFF';
    const COR_TEXTO = '1E293B';
    const COR_TEXTO_CLARO = '475569';
    const COR_BORDA = 'CBD5E1';
    const COR_VERDE = '16A34A';
    const COR_VERDE_BG = 'F0FDF4';
    const COR_AMARELO_BG = 'FFFBEB';
    const COR_AZUL_BG = 'EFF6FF';

    const borda = {
        top: { style: 'thin', color: { rgb: COR_BORDA } },
        bottom: { style: 'thin', color: { rgb: COR_BORDA } },
        left: { style: 'thin', color: { rgb: COR_BORDA } },
        right: { style: 'thin', color: { rgb: COR_BORDA } }
    };

    const fontePadrao = { name: 'Calibri', sz: 10, color: { rgb: COR_TEXTO } };
    const fonteHeader = { name: 'Calibri', sz: 10, bold: true, color: { rgb: COR_BRANCO } };
    const fonteTitulo = { name: 'Calibri', sz: 14, bold: true, color: { rgb: COR_PRIMARIA } };
    const fonteSubtitulo = { name: 'Calibri', sz: 11, bold: true, color: { rgb: COR_ACCENT } };
    const fonteKpiValor = { name: 'Calibri', sz: 16, bold: true, color: { rgb: COR_PRIMARIA } };
    const fonteKpiLabel = { name: 'Calibri', sz: 9, color: { rgb: COR_TEXTO_CLARO } };

    const estiloHeader = {
        font: fonteHeader,
        fill: { fgColor: { rgb: COR_PRIMARIA } },
        border: borda,
        alignment: { horizontal: 'center', vertical: 'center', wrapText: true }
    };

    const estiloCelula = (zebra) => ({
        font: fontePadrao,
        fill: { fgColor: { rgb: zebra ? COR_ZEBRA : COR_BRANCO } },
        border: borda,
        alignment: { vertical: 'center' }
    });

    const estiloCelulaNum = (zebra) => ({
        font: fontePadrao,
        fill: { fgColor: { rgb: zebra ? COR_ZEBRA : COR_BRANCO } },
        border: borda,
        alignment: { horizontal: 'right', vertical: 'center' }
    });

    const estiloCelulaCenter = (zebra) => ({
        font: fontePadrao,
        fill: { fgColor: { rgb: zebra ? COR_ZEBRA : COR_BRANCO } },
        border: borda,
        alignment: { horizontal: 'center', vertical: 'center' }
    });

    // Função auxiliar para aplicar estilos a uma sheet de dados
    function aplicarEstilosSheet(ws, headers, dados, colunas, tiposColunas) {
        const totalLinhas = dados.length;
        const totalCols = headers.length;

        // Título da seção (linha 0, mesclada)
        // Não usamos título aqui — vamos direto para os headers

        // Header (linha 0)
        headers.forEach((h, c) => {
            const ref = XLSX.utils.encode_cell({ r: 0, c });
            ws[ref] = { v: h, t: 's', s: estiloHeader };
        });

        // Dados (a partir da linha 1)
        dados.forEach((row, r) => {
            const zebra = r % 2 === 1;
            row.forEach((val, c) => {
                const ref = XLSX.utils.encode_cell({ r: r + 1, c });
                const tipo = tiposColunas[c] || 'texto';
                if (tipo === 'moeda') {
                    ws[ref] = { v: val, t: 'n', s: { ...estiloCelulaNum(zebra), numFmt: '#,##0' } };
                } else if (tipo === 'moeda2') {
                    ws[ref] = { v: val, t: 'n', s: { ...estiloCelulaNum(zebra), numFmt: '#,##0.00' } };
                } else if (tipo === 'percentual') {
                    ws[ref] = { v: val, t: 'n', s: { ...estiloCelulaCenter(zebra), numFmt: '0.0"%"' } };
                } else if (tipo === 'numero') {
                    ws[ref] = { v: val, t: 'n', s: { ...estiloCelulaCenter(zebra), numFmt: '#,##0' } };
                } else if (tipo === 'decimal') {
                    ws[ref] = { v: val, t: 'n', s: { ...estiloCelulaCenter(zebra), numFmt: '0.0' } };
                } else {
                    ws[ref] = { v: val, t: 's', s: estiloCelula(zebra) };
                }
            });
        });

        ws['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: totalLinhas, c: totalCols - 1 } });
        ws['!cols'] = colunas.map(w => ({ wch: w }));
        ws['!rows'] = [{ hpx: 32 }]; // header mais alto
        // Congelar header
        ws['!freeze'] = { xSplit: 0, ySplit: 1 };

        return ws;
    }

    // ── Preparar dados ──
    const receitaTotal = Math.round(soma(dadosFiltrados, 'receita'));
    const totalClientes = soma(dadosFiltrados, 'clientes');
    const ocupMedia = Math.round(media(dadosFiltrados, 'ocupacao') * 10) / 10;
    const avalMedia = Math.round(media(dadosFiltrados, 'avaliacao') * 100) / 100;

    const porEstado = agrupar(dadosFiltrados, 'estado');
    const porCidade = agrupar(dadosFiltrados, 'cidade');
    const porTipo = agrupar(dadosFiltrados, 'tipo');
    const porMes = agrupar(dadosFiltrados, 'mes');

    const wb = XLSX.utils.book_new();

    // ═══════════════════════════════════════════
    // ABA 1: PAINEL EXECUTIVO
    // ═══════════════════════════════════════════
    const wsPainel = {};

    // Título principal
    wsPainel['A1'] = { v: 'RELATÓRIO DE DESEMPENHO — TURISMO NORDESTE', t: 's', s: {
        font: { name: 'Calibri', sz: 16, bold: true, color: { rgb: COR_BRANCO } },
        fill: { fgColor: { rgb: COR_PRIMARIA } },
        alignment: { horizontal: 'center', vertical: 'center' }
    }};
    wsPainel['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } },
        // KPI merges
        { s: { r: 3, c: 0 }, e: { r: 3, c: 5 } },
        // Resumo por estado título
        { s: { r: 9, c: 0 }, e: { r: 9, c: 5 } }
    ];
    // Preencher células mescladas para estilo
    for (let c = 1; c <= 5; c++) {
        wsPainel[XLSX.utils.encode_cell({ r: 0, c })] = { v: '', t: 's', s: {
            fill: { fgColor: { rgb: COR_PRIMARIA } }
        }};
    }

    // Subtítulo
    wsPainel['A2'] = { v: 'Projeto Inova Talentos — Case Prático | Gerado em ' + new Date().toLocaleDateString('pt-BR'), t: 's', s: {
        font: { name: 'Calibri', sz: 10, italic: true, color: { rgb: COR_TEXTO_CLARO } },
        fill: { fgColor: { rgb: COR_PRIMARIA_LIGHT } },
        alignment: { horizontal: 'center', vertical: 'center' }
    }};
    for (let c = 1; c <= 5; c++) {
        wsPainel[XLSX.utils.encode_cell({ r: 1, c })] = { v: '', t: 's', s: {
            fill: { fgColor: { rgb: COR_PRIMARIA_LIGHT } }
        }};
    }

    // Linha 3 vazia (espaçamento)

    // Seção KPIs — título
    wsPainel['A4'] = { v: 'INDICADORES-CHAVE DE DESEMPENHO', t: 's', s: {
        font: { name: 'Calibri', sz: 11, bold: true, color: { rgb: COR_PRIMARIA } },
        fill: { fgColor: { rgb: COR_HEADER } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: borda
    }};
    for (let c = 1; c <= 5; c++) {
        wsPainel[XLSX.utils.encode_cell({ r: 3, c })] = { v: '', t: 's', s: {
            fill: { fgColor: { rgb: COR_HEADER } }, border: borda
        }};
    }

    // KPIs — Labels (linha 5)
    const kpiLabels = ['Receita Total', 'Total de Clientes', 'Ocupação Média', 'Avaliação Média', 'Nº Estados', 'Nº Cidades'];
    const kpiValores = [
        'R$ ' + receitaTotal.toLocaleString('pt-BR'),
        totalClientes.toLocaleString('pt-BR'),
        ocupMedia.toFixed(1).replace('.', ',') + '%',
        avalMedia.toFixed(2).replace('.', ',') + ' / 5',
        Object.keys(porEstado).length.toString(),
        Object.keys(porCidade).length.toString()
    ];

    kpiLabels.forEach((label, c) => {
        wsPainel[XLSX.utils.encode_cell({ r: 4, c })] = { v: label, t: 's', s: {
            font: fonteKpiLabel,
            fill: { fgColor: { rgb: COR_BRANCO } },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: { bottom: { style: 'thin', color: { rgb: COR_BORDA } }, left: { style: 'thin', color: { rgb: COR_BORDA } }, right: { style: 'thin', color: { rgb: COR_BORDA } }, top: { style: 'thin', color: { rgb: COR_BORDA } } }
        }};
    });

    kpiValores.forEach((val, c) => {
        const bgColors = [COR_AZUL_BG, COR_VERDE_BG, COR_AMARELO_BG, COR_AZUL_BG, COR_VERDE_BG, COR_AMARELO_BG];
        wsPainel[XLSX.utils.encode_cell({ r: 5, c })] = { v: val, t: 's', s: {
            font: fonteKpiValor,
            fill: { fgColor: { rgb: bgColors[c] } },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: borda
        }};
    });

    // Linha 7-8 vazia (espaçamento)

    // Seção Resumo por Estado (embutida no painel)
    wsPainel['A10'] = { v: 'RESUMO POR ESTADO', t: 's', s: {
        font: { name: 'Calibri', sz: 11, bold: true, color: { rgb: COR_PRIMARIA } },
        fill: { fgColor: { rgb: COR_HEADER } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: borda
    }};
    for (let c = 1; c <= 5; c++) {
        wsPainel[XLSX.utils.encode_cell({ r: 9, c })] = { v: '', t: 's', s: {
            fill: { fgColor: { rgb: COR_HEADER } }, border: borda
        }};
    }

    const headersPainel = ['Estado', 'Receita Total', 'Clientes', 'Ocupação Média', 'Avaliação', '% Receita'];
    headersPainel.forEach((h, c) => {
        wsPainel[XLSX.utils.encode_cell({ r: 10, c })] = { v: h, t: 's', s: estiloHeader };
    });

    const estadosOrdenados = Object.keys(porEstado).sort();
    estadosOrdenados.forEach((e, r) => {
        const items = porEstado[e];
        const rec = Math.round(soma(items, 'receita'));
        const cli = soma(items, 'clientes');
        const ocu = Math.round(media(items, 'ocupacao') * 10) / 10;
        const ava = Math.round(media(items, 'avaliacao') * 10) / 10;
        const pct = Math.round(rec / receitaTotal * 1000) / 10;
        const zebra = r % 2 === 1;
        const rowIdx = 11 + r;

        wsPainel[XLSX.utils.encode_cell({ r: rowIdx, c: 0 })] = { v: NOMES_ESTADO[e] || e, t: 's', s: { ...estiloCelula(zebra), font: { ...fontePadrao, bold: true } } };
        wsPainel[XLSX.utils.encode_cell({ r: rowIdx, c: 1 })] = { v: rec, t: 'n', s: { ...estiloCelulaNum(zebra), numFmt: '#,##0' } };
        wsPainel[XLSX.utils.encode_cell({ r: rowIdx, c: 2 })] = { v: cli, t: 'n', s: { ...estiloCelulaCenter(zebra), numFmt: '#,##0' } };
        wsPainel[XLSX.utils.encode_cell({ r: rowIdx, c: 3 })] = { v: ocu, t: 'n', s: { ...estiloCelulaCenter(zebra), numFmt: '0.0"%"' } };
        wsPainel[XLSX.utils.encode_cell({ r: rowIdx, c: 4 })] = { v: ava, t: 'n', s: { ...estiloCelulaCenter(zebra), numFmt: '0.0' } };
        wsPainel[XLSX.utils.encode_cell({ r: rowIdx, c: 5 })] = { v: pct, t: 'n', s: { ...estiloCelulaCenter(zebra), numFmt: '0.0"%"' } };
    });

    // Linha de total
    const totalRow = 11 + estadosOrdenados.length;
    wsPainel[XLSX.utils.encode_cell({ r: totalRow, c: 0 })] = { v: 'TOTAL', t: 's', s: {
        font: { ...fontePadrao, bold: true, color: { rgb: COR_BRANCO } },
        fill: { fgColor: { rgb: COR_ACCENT } },
        border: borda,
        alignment: { horizontal: 'center', vertical: 'center' }
    }};
    wsPainel[XLSX.utils.encode_cell({ r: totalRow, c: 1 })] = { v: receitaTotal, t: 'n', s: {
        font: { ...fontePadrao, bold: true, color: { rgb: COR_BRANCO } },
        fill: { fgColor: { rgb: COR_ACCENT } },
        border: borda,
        alignment: { horizontal: 'right', vertical: 'center' },
        numFmt: '#,##0'
    }};
    wsPainel[XLSX.utils.encode_cell({ r: totalRow, c: 2 })] = { v: totalClientes, t: 'n', s: {
        font: { ...fontePadrao, bold: true, color: { rgb: COR_BRANCO } },
        fill: { fgColor: { rgb: COR_ACCENT } },
        border: borda,
        alignment: { horizontal: 'center', vertical: 'center' },
        numFmt: '#,##0'
    }};
    wsPainel[XLSX.utils.encode_cell({ r: totalRow, c: 3 })] = { v: ocupMedia, t: 'n', s: {
        font: { ...fontePadrao, bold: true, color: { rgb: COR_BRANCO } },
        fill: { fgColor: { rgb: COR_ACCENT } },
        border: borda,
        alignment: { horizontal: 'center', vertical: 'center' },
        numFmt: '0.0"%"'
    }};
    wsPainel[XLSX.utils.encode_cell({ r: totalRow, c: 4 })] = { v: avalMedia, t: 'n', s: {
        font: { ...fontePadrao, bold: true, color: { rgb: COR_BRANCO } },
        fill: { fgColor: { rgb: COR_ACCENT } },
        border: borda,
        alignment: { horizontal: 'center', vertical: 'center' },
        numFmt: '0.00'
    }};
    wsPainel[XLSX.utils.encode_cell({ r: totalRow, c: 5 })] = { v: 100, t: 'n', s: {
        font: { ...fontePadrao, bold: true, color: { rgb: COR_BRANCO } },
        fill: { fgColor: { rgb: COR_ACCENT } },
        border: borda,
        alignment: { horizontal: 'center', vertical: 'center' },
        numFmt: '0.0"%"'
    }};

    wsPainel['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: totalRow, c: 5 } });
    wsPainel['!cols'] = [{ wch: 22 }, { wch: 18 }, { wch: 16 }, { wch: 18 }, { wch: 14 }, { wch: 14 }];
    wsPainel['!rows'] = [{ hpx: 40 }, { hpx: 24 }, { hpx: 10 }, { hpx: 28 }, { hpx: 20 }, { hpx: 36 }];

    XLSX.utils.book_append_sheet(wb, wsPainel, 'Painel Executivo');

    // ═══════════════════════════════════════════
    // ABA 2: DADOS COMPLETOS
    // ═══════════════════════════════════════════
    const wsDados = {};
    const headersDados = ['Mês', 'Estado', 'Cidade', 'Tipo', 'Receita (R$)', 'Clientes', 'Ocupação (%)', 'Avaliação'];
    const tiposDados = ['texto', 'texto', 'texto', 'texto', 'moeda', 'numero', 'decimal', 'decimal'];
    const dadosOrdenados = dadosFiltrados
        .sort((a, b) => a.mesIdx - b.mesIdx || a.estado.localeCompare(b.estado) || a.cidade.localeCompare(b.cidade))
        .map(d => [d.mes, NOMES_ESTADO[d.estado] || d.estado, d.cidade, d.tipo, d.receita, d.clientes, d.ocupacao, d.avaliacao]);

    aplicarEstilosSheet(wsDados, headersDados, dadosOrdenados, [14, 22, 18, 14, 16, 12, 16, 14], tiposDados);
    XLSX.utils.book_append_sheet(wb, wsDados, 'Dados Completos');

    // ═══════════════════════════════════════════
    // ABA 3: POR CIDADE
    // ═══════════════════════════════════════════
    const wsCidade = {};
    const headersCidade = ['Cidade', 'Estado', 'Receita Total', 'Clientes', 'Ocupação Média (%)', 'Avaliação Média'];
    const tiposCidade = ['texto', 'texto', 'moeda', 'numero', 'decimal', 'decimal'];
    const dadosCidade = Object.keys(porCidade).sort().map(c => {
        const items = porCidade[c];
        return [c, NOMES_ESTADO[items[0].estado] || items[0].estado, Math.round(soma(items, 'receita')), soma(items, 'clientes'), Math.round(media(items, 'ocupacao') * 10) / 10, Math.round(media(items, 'avaliacao') * 10) / 10];
    });

    aplicarEstilosSheet(wsCidade, headersCidade, dadosCidade, [18, 22, 18, 14, 20, 18], tiposCidade);
    XLSX.utils.book_append_sheet(wb, wsCidade, 'Por Cidade');

    // ═══════════════════════════════════════════
    // ABA 4: POR TIPO
    // ═══════════════════════════════════════════
    const wsTipo = {};
    const headersTipo = ['Tipo', 'Receita Total', 'Receita Média', 'Clientes', 'Ocupação Média (%)', 'Avaliação Média'];
    const tiposTipo = ['texto', 'moeda', 'moeda', 'numero', 'decimal', 'decimal'];
    const dadosTipo = Object.keys(porTipo).sort().map(t => {
        const items = porTipo[t];
        return [t, Math.round(soma(items, 'receita')), Math.round(soma(items, 'receita') / items.length), soma(items, 'clientes'), Math.round(media(items, 'ocupacao') * 10) / 10, Math.round(media(items, 'avaliacao') * 10) / 10];
    });

    aplicarEstilosSheet(wsTipo, headersTipo, dadosTipo, [14, 18, 16, 14, 20, 18], tiposTipo);
    XLSX.utils.book_append_sheet(wb, wsTipo, 'Por Tipo');

    // ═══════════════════════════════════════════
    // ABA 5: POR MÊS
    // ═══════════════════════════════════════════
    const wsMes = {};
    const headersMes = ['Mês', 'Receita Total', 'Clientes', 'Ocupação Média (%)', 'Avaliação Média'];
    const tiposMes = ['texto', 'moeda', 'numero', 'decimal', 'decimal'];
    const dadosMes = mesesOrdemIdx.filter(m => porMes[m]).map(m => {
        const items = porMes[m];
        return [m, Math.round(soma(items, 'receita')), soma(items, 'clientes'), Math.round(media(items, 'ocupacao') * 10) / 10, Math.round(media(items, 'avaliacao') * 10) / 10];
    });

    aplicarEstilosSheet(wsMes, headersMes, dadosMes, [14, 18, 14, 20, 18], tiposMes);
    XLSX.utils.book_append_sheet(wb, wsMes, 'Por Mês');

    // ═══════════════════════════════════════════
    // ABA 6: RANKING DE CIDADES
    // ═══════════════════════════════════════════
    const wsRanking = {};
    const headersRanking = ['#', 'Cidade', 'Estado', 'Receita Total', 'Clientes', 'Ocupação (%)', 'Avaliação', 'Classificação'];
    const tiposRanking = ['numero', 'texto', 'texto', 'moeda', 'numero', 'decimal', 'decimal', 'texto'];
    const dadosRanking = Object.keys(porCidade)
        .map(c => {
            const items = porCidade[c];
            return { cidade: c, estado: items[0].estado, receita: Math.round(soma(items, 'receita')), clientes: soma(items, 'clientes'), ocupacao: Math.round(media(items, 'ocupacao') * 10) / 10, avaliacao: Math.round(media(items, 'avaliacao') * 10) / 10 };
        })
        .sort((a, b) => b.receita - a.receita)
        .map((d, i) => {
            let classif = 'Regular';
            if (d.avaliacao >= 4.2) classif = 'Excelente';
            else if (d.avaliacao >= 3.8) classif = 'Bom';
            return [i + 1, d.cidade, NOMES_ESTADO[d.estado] || d.estado, d.receita, d.clientes, d.ocupacao, d.avaliacao, classif];
        });

    aplicarEstilosSheet(wsRanking, headersRanking, dadosRanking, [6, 18, 22, 18, 14, 16, 14, 16], tiposRanking);
    XLSX.utils.book_append_sheet(wb, wsRanking, 'Ranking Cidades');

    XLSX.writeFile(wb, 'relatorio_turismo_nordeste.xlsx');
}

// ========== ALTERNAR TEMA ==========
function alternarTema() {
    const isClaro = document.body.classList.toggle('tema-claro');

    // Reconfigurar cores dos gráficos
    const textColor = isClaro ? '#334155' : '#64748b';
    const gridColor = isClaro ? '#e2e8f0' : 'rgba(255, 255, 255, 0.04)';
    const titleColor = isClaro ? '#334155' : '#94a3b8';
    const legendColor = isClaro ? '#334155' : '#94a3b8';
    const datalabelColor = isClaro ? '#334155' : '#94a3b8';

    Object.values(charts).forEach(chart => {
        if (chart.options.scales) {
            Object.values(chart.options.scales).forEach(scale => {
                if (scale.ticks) scale.ticks.color = textColor;
                if (scale.grid) scale.grid.color = gridColor;
                if (scale.title) scale.title.color = titleColor;
            });
        }
        if (chart.options.plugins?.legend?.labels) {
            chart.options.plugins.legend.labels.color = legendColor;
        }
        if (chart.options.plugins?.datalabels) {
            chart.options.plugins.datalabels.color = datalabelColor;
        }
        chart.update('none');
    });

    // Salvar preferência
    localStorage.setItem('tema', isClaro ? 'claro' : 'escuro');
}

function carregarTema() {
    const tema = localStorage.getItem('tema');
    if (tema === 'claro') {
        document.body.classList.add('tema-claro');
    }
}

// ========== INIT ==========
document.addEventListener('DOMContentLoaded', () => {
    carregarTema();
    inicializarFiltros();
    atualizarDashboard();

    document.getElementById('btnPDF').addEventListener('click', exportarPDF);
    document.getElementById('btnExcel').addEventListener('click', exportarExcel);
    document.getElementById('btnTema').addEventListener('click', alternarTema);

    // Se tema claro salvo, atualizar gráficos após renderização
    if (localStorage.getItem('tema') === 'claro') {
        setTimeout(() => {
            const textColor = '#334155';
            const gridColor = '#e2e8f0';
            Object.values(charts).forEach(chart => {
                if (chart.options.scales) {
                    Object.values(chart.options.scales).forEach(scale => {
                        if (scale.ticks) scale.ticks.color = textColor;
                        if (scale.grid) scale.grid.color = gridColor;
                        if (scale.title) scale.title.color = textColor;
                    });
                }
                if (chart.options.plugins?.legend?.labels) chart.options.plugins.legend.labels.color = textColor;
                if (chart.options.plugins?.datalabels) chart.options.plugins.datalabels.color = textColor;
                chart.update('none');
            });
        }, 100);
    }

    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => atualizarDashboard(), 250);
    });
});
