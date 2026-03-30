<div align="center">

# 🌊 Dashboard Turístico do Nordeste

![Stack](https://img.shields.io/badge/Stack-HTML_%7C_CSS_%7C_JavaScript-845EC2?style=for-the-badge)
![Deploy](https://img.shields.io/badge/Deploy-GitHub_Pages-00B4D8?style=for-the-badge)
![Dados](https://img.shields.io/badge/Dados-432_registros_mensais-06D6A0?style=for-the-badge)
![Estados](https://img.shields.io/badge/Cobertura-CE_%C2%B7_RN_%C2%B7_PE_%C2%B7_PI-F4A261?style=for-the-badge)

> **Painel interativo de inteligência turística do Nordeste brasileiro**
> 4 Estados · 12 Cidades · 3 Tipos de Empreendimento · 432 Registros Mensais
> Filtros por estado, cidade, tipo e mês com atualização em tempo real

### [🔗 Abrir Dashboard ao Vivo](https://idarlandias.github.io/Dashboard-Tur-stico-do-Nordeste/)

</div>

---

## 🎯 Sobre o Projeto

Painel analítico interativo de inteligência turística desenvolvido como entrega do **Case Turismo — BNB / ObIT-NE**.
O dashboard consolida **432 registros mensais** da base `base_case_turismo.xlsx`, cobrindo os estados do **Ceará, Rio Grande do Norte, Pernambuco e Piauí**, com 12 cidades e 3 categorias de empreendimento (Hotel, Pousada e Agência).

Toda a interface é construída com **HTML + CSS + JavaScript puro**, sem frameworks front-end, e publicada via GitHub Pages com deploy automático.

---

## 📊 Indicadores-Chave (KPIs)

| Indicador | Valor | Melhor Mês | Menor Mês |
|---|---|---|---|
| **Total de Clientes** | 472.607 | Mar (44.302) | Set (32.181) |
| **Receita Total** | R$ 75,8M | Mai (R$ 7,3M) | Nov (R$ 5,2M) |
| **Ocupação Média** | 68% | Nov (71,1%) | Mar (60,6%) |
| **Avaliação Média** | 4,0 / 5,0 | Jul (4,2) | Jan (3,9) |

---

## 🗺️ Cobertura Geográfica

| Estado | Cidades |
|---|---|
| **Ceará (CE)** | Fortaleza · Jericoacoara · Canoa Quebrada |
| **Rio Grande do Norte (RN)** | Natal · Pipa · Genipabu |
| **Pernambuco (PE)** | Recife · Porto de Galinhas · Olinda |
| **Piauí (PI)** | Teresina · Luís Correia · Parnaíba |

---

## ✨ Funcionalidades

### Painel Principal

| Módulo | Descrição |
|---|---|
| **Visão Geral** | KPIs consolidados com mín/máx por mês e comparativo anual |
| **Mapa Interativo (GeoViz)** | Clique nos polígonos dos estados para cross-filtering em todo o dashboard |
| **Comparativo por Estado / Cidade** | Gráfico de barras com indicador selecionado · Anual |
| **Distribuição por Tipo** | Donut chart — Hotel 33,0% · Pousada 32,9% · Agência 34,1% |
| **Principais Insights** | Geração automática dos 5 insights mais relevantes da base |

### Análises

| Módulo | Descrição |
|---|---|
| **Sazonalidade** | Padrão mensal real por estado e indicador |
| **Mapa de Calor** | Intensidade cruzada estado × mês |
| **Ranking de Cidades** | Ordenação dinâmica por qualquer indicador selecionado |
| **Tipos de Empreendimento** | Comparativo receita, ocupação e avaliação por categoria |
| **Evolução Mensal** | Série temporal com linha de tendência |
| **Radar Comparativo** | Perfil multidimensional por estado |

### Inteligência

| Módulo | Descrição |
|---|---|
| **Análise Comparativa** | Scatter plot ocupação × receita por cidade |
| **Insights Automáticos** | Destaques gerados dinamicamente com base nos filtros ativos |
| **Descrição Analítica** | Síntese completa da entrega do case com interpretação dos dados |

---

## 🔍 Filtros Disponíveis

- **Estado:** Todos · Ceará · Pernambuco · Rio Grande do Norte · Piauí
- **Cidade:** Todas as 12 cidades cobertas
- **Tipo:** Todos · Hotel · Pousada · Agência
- **Mês:** Todos · Janeiro a Dezembro

> Todos os filtros são combinados e atualizam os gráficos, KPIs e insights em tempo real.

---

## 💡 Principais Insights

- **Ceará** lidera em receita com **R$ 19.336.349**, representando **25,5%** do faturamento total
- **Genipabu (RN)** tem a maior taxa de ocupação média (**73,2%**), enquanto **Pipa** apresenta a menor (**61,1%**) — diferença de 12,1 p.p.
- O segmento **Agência** apresenta a maior receita média por unidade (**R$ 179.494**), sugerindo maior potencial de retorno por empreendimento
- **Maio** é o mês de maior faturamento e **Novembro** o de menor — oportunidade para ações promocionais em períodos de baixa
- **Canoa Quebrada** destaca-se na satisfação do cliente com nota média **4,2 / 5,0**, referência de benchmark para as demais localidades

---

## 🏗️ Estrutura do Projeto

```
Dashboard-Turistico-do-Nordeste/
│
├── entrevista-bnb.html    → SPA principal (Dashboard completo)
├── app.js                 → Filtros, KPIs, lógica de exportação
├── charts.js              → Engine de gráficos Canvas API (sem dependências)
├── data.js                → Dataset consolidado (432 registros mensais)
│
├── fetch_map.py           → Geração de malha GeoJSON (IBGE)
│
├── case-turismo/          → Materiais do case original
└── dados_brutos/
    ├── chegadas_internacionais_nordeste.csv   ← EMBRATUR / PF
    ├── receitas_bcb_22741_mensal.csv          ← API Banco Central (SGS)
    └── receita_turismo_domestico_nordeste.csv ← PNAD-IBGE
```

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| **Frontend** | HTML5 + CSS3 + JavaScript puro (ES6+) |
| **Gráficos** | Canvas API nativa — sem Chart.js, D3 ou bibliotecas externas |
| **Mapa** | SVG interativo com malha GeoJSON real do IBGE |
| **Design** | Dark mode · Paleta oceânica · Google Fonts Syne + Inter |
| **Exportação** | CSV (Blob) · Excel (.xls) · PDF (print CSS A4) |
| **ETL** | Python 3.8+ · `urllib`, `json`, `csv` — sem dependências pesadas |
| **Deploy** | GitHub Pages — CI/CD automático via GitHub Actions |

---

## 🚀 Como Executar

```bash
# Opção 1 — Acesso direto (sem instalação)
# https://idarlandias.github.io/Dashboard-Tur-stico-do-Nordeste/

# Opção 2 — Localmente
# Abrir entrevista-bnb.html no navegador (duplo clique)

# Opção 3 — Atualizar malha do mapa (GeoJSON IBGE)
python fetch_map.py
```

---

## 📋 Descrição Analítica

A análise dos dados de **432 registros mensais** revela que o **Ceará** concentra a maior fatia da receita regional (25,5%), impulsionado principalmente por Fortaleza e Jericoacoara. A sazonalidade é um fator relevante: **maio** apresenta o maior faturamento, enquanto **novembro** registra o menor movimento — indicando oportunidade para campanhas de incentivo na baixa temporada.

Entre os tipos de empreendimento, as **agências** lideram em receita média por unidade, sugerindo maior ticket médio nesse segmento. **Genipabu (RN)** se destaca com a maior taxa de ocupação (73,2%), enquanto **Pipa** apresenta a menor (61,1%), apontando potencial de crescimento com estratégias de marketing direcionadas.

Em satisfação do cliente, **Canoa Quebrada** lidera com avaliação 4,2/5, demonstrando excelência no atendimento que pode servir de benchmark para as demais localidades. A correlação entre ocupação e receita confirma que **ocupação elevada não garante alta receita** — o tipo de empreendimento e o perfil do destino influenciam diretamente o faturamento.

---

## 👤 Autor

```
Desenvolvido por: Idarlan Dias
GitHub:           github.com/idarlandias
Projeto:          Case Turismo — BNB / ObIT-NE · 2026
```

---

<div align="center">

**Desenvolvido com dedicação para o Nordeste · CE · RN · PE · PI · 2026**

</div>
