// ========== CONSTANTES ==========
const MESES_ORDEM = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const CORES_ESTADO = { CE: '#38bdf8', RN: '#a78bfa', PE: '#fbbf24', PI: '#34d399' };
const CORES_TIPO = { Hotel: '#38bdf8', Pousada: '#fbbf24', Agencia: '#a78bfa' };
const NOMES_ESTADO = { CE: 'Ceará', RN: 'Rio Grande do Norte', PE: 'Pernambuco', PI: 'Piauí' };

// ========== ESTADO GLOBAL ==========
let dadosFiltrados = [...DADOS_TURISMO];
let charts = {};

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

// ========== KPIs ==========
function atualizarKPIs() {
    document.getElementById('kpiReceita').textContent = fmt.moedaCurta(soma(dadosFiltrados, 'receita'));
    document.getElementById('kpiClientes').textContent = fmt.numero(soma(dadosFiltrados, 'clientes'));
    document.getElementById('kpiOcupacao').textContent = fmt.pct(media(dadosFiltrados, 'ocupacao'));
    document.getElementById('kpiAvaliacao').textContent = fmt.nota(media(dadosFiltrados, 'avaliacao'));
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
        }
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
        charts[id].data = config.data;
        charts[id].options = config.options;
        charts[id].update('none');
    } else {
        charts[id] = new Chart(document.getElementById(id), config);
    }
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

// ========== GRÁFICO 6: Scatter Receita vs Ocupação ==========
function chartScatter() {
    const porTipo = agrupar(dadosFiltrados, 'tipo');
    const datasets = Object.keys(porTipo).sort().map(tipo => {
        const porCidade = agrupar(porTipo[tipo], 'cidade');
        const pontos = Object.keys(porCidade).map(c => ({
            x: media(porCidade[c], 'ocupacao'),
            y: soma(porCidade[c], 'receita') / porCidade[c].length,
            cidade: c
        }));
        return {
            label: tipo,
            data: pontos,
            backgroundColor: CORES_TIPO[tipo] + 'AA',
            borderColor: CORES_TIPO[tipo],
            borderWidth: 2,
            pointRadius: 7,
            pointHoverRadius: 10
        };
    });

    criarOuAtualizar('chartScatter', {
        type: 'scatter',
        data: { datasets },
        options: {
            ...chartDefaults,
            scales: {
                x: { ...chartDefaults.scales.x, title: { display: true, text: 'Ocupação Média (%)', font: { size: 11, family: 'Inter' } }, ticks: { ...chartDefaults.scales.x.ticks, callback: v => v + '%' } },
                y: { ...chartDefaults.scales.y, title: { display: true, text: 'Receita Média (R$)', font: { size: 11, family: 'Inter' } }, ticks: { ...chartDefaults.scales.y.ticks, callback: v => fmt.moedaCurta(v) } }
            },
            plugins: {
                ...chartDefaults.plugins,
                tooltip: {
                    ...chartDefaults.plugins.tooltip,
                    callbacks: {
                        title: ctxs => ctxs[0].raw.cidade || '',
                        label: ctx => ctx.dataset.label + ': ' + fmt.pct(ctx.raw.x) + ' ocupação, ' + fmt.moeda(ctx.raw.y) + ' receita'
                    }
                }
            }
        }
    });
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
    chartReceitaEstado();
    chartReceitaTipo();
    chartOcupacaoCidade();
    chartClientesMes();
    chartAvaliacaoCidade();
    chartScatter();
    gerarInsights();
}

// ========== INIT ==========
document.addEventListener('DOMContentLoaded', () => {
    inicializarFiltros();
    atualizarDashboard();

    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => atualizarDashboard(), 250);
    });
});
