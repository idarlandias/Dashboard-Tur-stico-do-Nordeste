<div align="center">

# 🌊 ObIT-NE · Dashboard de Inteligência Turística do Nordeste

<img src="https://img.shields.io/badge/Projeto-ObIT--NE-00B4D8?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0xMiAyQTEwIDEwIDAgMCAwIDIgMTJhMTAgMTAgMCAwIDAgMTAgMTAgMTAgMTAgMCAwIDAgMTAtMTBBMTAgMTAgMCAwIDAgMTIgMnoiLz48L3N2Zz4=" alt="ObIT-NE">
<img src="https://img.shields.io/badge/BNB-Candidatura_2026-F4A261?style=for-the-badge" alt="BNB">
<img src="https://img.shields.io/badge/Dados-EMBRATUR_%2F_IBGE-06D6A0?style=for-the-badge" alt="Dados Reais">
<img src="https://img.shields.io/badge/Stack-HTML_%7C_CSS_%7C_JS_%7C_Python-845EC2?style=for-the-badge" alt="Stack">

<br/><br/>

> **Painel interativo de inteligência turística do Nordeste brasileiro**  
> Desenvolvido como portfólio de candidatura ao **Perfil 2 – ObIT-NE / Banco do Nordeste**  
> Filtros por estado, período e indicador · Dados reais verificados (2021–2025)

<br/>

[![Abrir Dashboard](https://img.shields.io/badge/▶%20Abrir%20Dashboard-0077B6?style=for-the-badge&logo=googlechrome&logoColor=white)](https://idarlandias.github.io/Dashboard-Tur-stico-do-Nordeste/)

</div>

---

## 📸 Preview

<div align="center">

| Visão Geral | KPIs em Tempo Real | Ranking de Destinos |
|:-----------:|:-----------------:|:-------------------:|
| Dashboard dark com paleta oceânica | 4 indicadores filtráveis | Top 8 destinos do Nordeste |

</div>

---

## 🎯 Sobre o Projeto

Este projeto é um **protótipo funcional** de dashboard de inteligência turística desenvolvido para a candidatura ao **Observatório do Turismo do Nordeste (ObIT-NE)**, vinculado ao **Banco do Nordeste (BNB)** — Perfil 2: Dashboards, Relatórios e UX/UI.

O dashboard consolida dados reais de turismo do Nordeste e apresenta visualizações interativas que permitem análises por:

- 🗺️ **Estado** — 9 unidades da federação do Nordeste
- 📅 **Período** — série histórica 2021–2025
- 📊 **Indicadores** — chegadas internacionais, receita turística, ocupação hoteleira e empregos diretos

---

## 🏗️ Arquitetura do Projeto

```
Dashboard-Turistico-do-Nordeste/
│
├── 🌐 index.html                  → Dashboard principal (abrir no browser)
├── 🎨 style.css                   → Design system completo (dark mode + oceânico)
├── 📊 data.js                     → Dados reais verificados (EMBRATUR + PNAD-IBGE)
├── 📈 charts.js                   → Engine de gráficos Canvas (sem dependências)
├── ⚙️  app.js                     → Lógica de filtros, KPIs e navegação
│
├── 🐍 processar_dados.py          → Pipeline Python de coleta e processamento
│
├── dados_brutos/
│   ├── chegadas_internacionais_nordeste.csv   ← EMBRATUR / Polícia Federal
│   └── receita_turismo_domestico_nordeste.csv ← PNAD-IBGE
│
├── turismo_nordeste_2021_2025.csv  → Dataset consolidado
└── turismo_nordeste_2021_2025.json → JSON otimizado para o dashboard
```

---

## 📊 Indicadores Disponíveis

<table>
<tr>
<td align="center">✈️</td>
<td><b>Chegadas Internacionais</b><br/>Fluxo de turistas estrangeiros por estado · Fonte: EMBRATUR / Polícia Federal</td>
</tr>
<tr>
<td align="center">💰</td>
<td><b>Receita Turística</b><br/>Estimativa de receita em R$ milhões · Fonte: PNAD Contínua Turismo IBGE 2024</td>
</tr>
<tr>
<td align="center">🏨</td>
<td><b>Taxa de Ocupação Hoteleira</b><br/>Percentual médio por estado e período · Fonte: MTur / ABIH</td>
</tr>
<tr>
<td align="center">👥</td>
<td><b>Empregos Diretos no Turismo</b><br/>Postos de trabalho formais e informais · Fonte: EMBRATUR / MTur</td>
</tr>
</table>

---

## 📡 Fontes de Dados

| Indicador | Fonte | Referência |
|-----------|-------|------------|
| Chegadas internacionais por UF | **EMBRATUR / Polícia Federal** | Anuário Embratur 2025 · [dados.embratur.com.br](https://dados.embratur.com.br) |
| Gasto médio por estado destino | **PNAD Contínua Turismo – IBGE** | Publicação 2024 · AL=R$3.790, CE=R$3.006, BA=R$2.711 |
| Receita turística estimada | **MTur + IBGE pro-rata** | Nordeste = 30,4% do total nacional (R$9,8bi em 2021) |
| Totais nacionais 2021–2024 | **Anuário Embratur 2025** | 2021: 745k · 2022: 3,6M · 2023: 5,9M · 2024: 6,7M chegadas |

### 🔢 Dados verificados — Nordeste 2024

| Estado | Chegadas Internacionais | Receita Estimada | Gasto Médio/Pessoa |
|--------|------------------------:|------------------:|-------------------:|
| 🟡 Bahia | **170.220** | R$ 16,5 bi | R$ 2.711 |
| 🟠 Pernambuco | **109.240** | R$ 9,9 bi | R$ 2.480 |
| 🔵 Ceará | **98.570** | R$ 14,4 bi | R$ 3.006 |
| 🟢 Rio Grande do Norte | **63.680** | R$ 4,9 bi | R$ 2.350 |
| 🔴 Alagoas | **47.920** | R$ 6,1 bi | **R$ 3.790** ← maior do NE |
| **TOTAL NORDESTE** | **506.946** | **R$ 59,4 bi** | — |

> 📌 Referência: Jan-Set 2024 = 380.223 chegadas internacionais ao NE (Panrotas/EMBRATUR)

---

## 🚀 Como Executar

### Dashboard (sem instalação)
```bash
# Simplesmente abra o arquivo no navegador:
index.html → duplo clique → pronto!
```

### Pipeline Python
```bash
# Instalar dependências
pip install pandas requests

# Rodar com dados verificados (sempre funciona)
python processar_dados.py

# Tentar download MTur quando o portal estiver disponível
python processar_dados.py --refresh
```

### Atualizar com novos CSVs do MTur
```
1. Baixe em: https://dados.turismo.gov.br/dataset
2. Coloque os CSVs em ./dados_brutos/
3. Execute: python processar_dados.py --refresh
```

---

## 🛠️ Stack Tecnológica

<div align="center">

| Camada | Tecnologia | Detalhes |
|--------|-----------|----------|
| **Frontend** | HTML5 + CSS3 + JavaScript | Sem frameworks — Canvas API pura |
| **Gráficos** | Canvas API | Bar, Line com área, Donut — animados |
| **Design** | CSS Custom Properties | Dark mode · Paleta oceânica |
| **Tipografia** | Google Fonts · Syne + Inter | Display + UI |
| **Backend/ETL** | Python 3.8+ | `urllib`, `json`, `csv` — sem pip pesado |
| **Dados** | EMBRATUR · IBGE · MTur | CSV + JSON verificados |

</div>

---

## 🌟 Funcionalidades

- ✅ **Filtros dinâmicos** — estado, período e indicador com atualização em tempo real
- ✅ **4 seções de visualização** — Visão Geral, Sazonalidade, Ranking e Evolução Temporal
- ✅ **KPIs com variação** — comparativo automático vs. ano anterior (%)
- ✅ **Gráficos animados** — barras, linhas com área preenchida e donut interativo
- ✅ **Tooltips ao hover** — detalhes dos dados ao passar o mouse
- ✅ **Navegação lateral** — sidebar com seções independentes
- ✅ **Design responsivo** — adapta a diferentes tamanhos de tela
- ✅ **Dados reais** — verificados em fontes oficiais com citação documentada

---

## 🗓️ Roadmap

- [ ] Hospedar via GitHub Pages com link público
- [ ] Integrar API do MTur quando o portal voltar (2026)
- [ ] Adicionar mapa SVG interativo do Nordeste
- [ ] Exportação real PDF/Excel (jsPDF + SheetJS)
- [ ] Tendência YoY automática via regressão linear

---

## 👤 Sobre a Candidatura

```
Vaga:       Perfil 2 – ObIT-NE / Banco do Nordeste
Foco:       Dashboards, Relatórios e UX/UI para turismo
Envio:      inovatalentos@sfiec.org.br
Prazo:      13/03/2026
Diferencial: Background hotelaria + computação + dados turísticos reais
```

---

<div align="center">

**Desenvolvido com 🌊 para o Nordeste**

[![GitHub](https://img.shields.io/badge/GitHub-idarlandias-181717?style=flat-square&logo=github)](https://github.com/idarlandias)

*ObIT-NE · BNB · 2026*

</div>
