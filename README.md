# Dashboard Turístico do Nordeste

Painel interativo de análise de desempenho do turismo no Nordeste brasileiro, desenvolvido como **Case Prático** do Projeto **Inova Talentos**.

> **Acesse:** [idarlandias.github.io/Dashboard-Tur-stico-do-Nordeste](https://idarlandias.github.io/Dashboard-Tur-stico-do-Nordeste/)

---

## Visão Geral

Dashboard analítico que consolida indicadores de **receita, clientes, ocupação e avaliação** de empreendimentos turísticos em **4 estados**, **12 cidades** e **3 segmentos** do Nordeste, com visualizações interativas e exportação profissional.

## Dados

| Dimensão | Valores |
|---|---|
| **Estados** | Ceará, Pernambuco, Rio Grande do Norte, Piauí |
| **Cidades** | Fortaleza, Jericoacoara, Canoa Quebrada, Natal, Pipa, Genipabu, Recife, Porto de Galinhas, Olinda, Teresina, Luis Correia, Parnaíba |
| **Tipos** | Hotel, Pousada, Agência |
| **Período** | Janeiro a Dezembro (12 meses) |
| **Indicadores** | Receita (R$), Clientes, Ocupação (%), Avaliação (1-5) |
| **Fonte** | `base_case_turismo.xlsx` |

## Funcionalidades

### Seções do Painel

- **Visão Geral** — KPIs, mapa interativo do Nordeste, barras comparativas e donut por tipo
- **Sazonalidade** — Distribuição mensal de clientes (Jan–Dez)
- **Mapa de Calor** — Intensidade por estado x mês (gradiente frio → quente)
- **Ranking de Cidades** — Top 12 cidades por receita anual
- **Tipos de Empreendimento** — Mix por estado com donut detalhado
- **Evolução Mensal** — Série temporal do indicador selecionado
- **Radar Comparativo** — Perfil competitivo multidimensional (6 eixos)
- **Análise Comparativa** — Bubble chart: Clientes × Ticket Médio × Receita
- **Insights Automáticos** — Alertas e destaques gerados a partir dos dados

### Filtros Interativos

- Estado, Cidade, Tipo de Empreendimento, Mês
- Chips de indicador: Clientes, Receita, Ocupação, Avaliação
- Mapa clicável (filtra por estado)

### Exportação

| Formato | Descrição |
|---|---|
| **CSV** | Dados tabulares para análise externa |
| **Excel (.xlsx)** | Relatório profissional com 6 abas estilizadas (Resumo Executivo, Por Estado, Por Cidade, Por Tipo, Evolução Mensal, Dados Completos) |
| **PDF** | Relatório gerencial para impressão via `window.print()` |

## Tecnologias

- **HTML5 / CSS3 / JavaScript** — Sem frameworks, 100% vanilla
- **Canvas 2D** — Motor de gráficos customizado (`charts.js`)
- **SVG** — Mapa interativo do Nordeste (`mapa_nordeste.js`)
- **xlsx-js-style** — Geração de `.xlsx` binário com estilos nativos
- **GitHub Pages** — Hospedagem estática

## Estrutura do Projeto

```
├── index.html          # Estrutura HTML do dashboard
├── style.css           # Estilos e responsividade
├── app.js              # Lógica principal, filtros, exportações
├── charts.js           # Motor de gráficos (Canvas 2D)
├── data.js             # Base de dados agregada
├── mapa_nordeste.js    # SVG do mapa interativo
```

## Como Executar Localmente

```bash
# Clonar o repositório
git clone https://github.com/idarlandias/Dashboard-Tur-stico-do-Nordeste.git

# Abrir com servidor local (qualquer um serve)
npx serve .

# Ou simplesmente abrir o index.html no navegador
```

## Autor

**Idarlan Dias** — Projeto Inova Talentos

---

*Dashboard desenvolvido como case prático de análise de dados turísticos do Nordeste brasileiro.*
