<div align="center">

# 🌊 ObIT-NE · Dashboard de Inteligência Turística do Nordeste

<img src="https://img.shields.io/badge/Projeto-ObIT--NE-00B4D8?style=for-the-badge" alt="ObIT-NE">
<img src="https://img.shields.io/badge/BNB-Candidatura_2026-F4A261?style=for-the-badge" alt="BNB">
<img src="https://img.shields.io/badge/Dados-EMBRATUR_%2F_IBGE-06D6A0?style=for-the-badge" alt="Dados Reais">
<img src="https://img.shields.io/badge/Stack-HTML_%7C_CSS_%7C_JS_%7C_Python-845EC2?style=for-the-badge" alt="Stack">

<br/><br/>

> **Painel interativo de inteligência turística do Nordeste brasileiro**  
> Desenvolvido como portfólio de candidatura ao **Perfil 2 – ObIT-NE / Banco do Nordeste**  
> Filtros por estado, período e indicador · Dados reais verificados (2021–2026*)

<br/>

[![Abrir Dashboard](https://img.shields.io/badge/▶%20Abrir%20Dashboard-0077B6?style=for-the-badge&logo=googlechrome&logoColor=white)](https://idarlandias.github.io/Dashboard-Tur-stico-do-Nordeste/)

</div>

---

## 🎯 Sobre o Projeto

Protótipo funcional de dashboard de inteligência turística para a candidatura ao **ObIT-NE (Observatório do Turismo do Nordeste)** – BNB Perfil 2: Dashboards, Relatórios e UX/UI.

---

## 🏗️ Estrutura do Projeto

```
Dashboard-Turistico-do-Nordeste/
│
├── 🌐 index.html                  → Dashboard principal
├── 🎨 style.css                   → Design system (dark mode oceânico)
├── 📊 data.js                     → Dados reais + projeções 2026
├── 📈 charts.js                   → Engine Canvas (sem dependências)
├── ⚙️  app.js                     → Filtros, KPIs, exportação
│
├── 🐍 processar_dados.py          → Pipeline de coleta MTur (--refresh)
├── 🐍 gerar_prospecoes.py         → Projeções 2026 + Índice BNB
│
├── dados_brutos/
│   ├── chegadas_internacionais_nordeste.csv   ← EMBRATUR / PF
│   ├── receitas_bcb_22741_mensal.csv          ← API Banco Central (SGS)
│   └── receita_turismo_domestico_nordeste.csv ← PNAD-IBGE
│
├── turismo_nordeste_2021_2025.csv  → Dataset consolidado
├── turismo_nordeste_2021_2025.json → JSON para o dashboard
└── prospecoes_2026.json           → Projeções e Índice de Oportunidade BNB
```

---

## ✨ Funcionalidades

- ✅ **Filtros dinâmicos** — estado, período e indicador com atualização em tempo real
- ✅ **6 seções de visualização** — Visão Geral, Sazonalidade, Ranking, Categorias, Evolução Temporal e Prospecções 2026
- ✅ **KPIs com variação** — comparativo automático vs. ano anterior (%)
- ✅ **Gráficos animados** — barras, linhas com área e donut interativo
- ✅ **Categorias de atração por estado** — perfil real de cada UF (Lençóis Maranhenses domina MA, Carnaval domina PE em fev, etc.)
- ✅ **Sazonalidade por estado** — padrão mensal real de cada destino (inverno x verão nordestino)
- ✅ **Exportação real:** 📄 CSV · 📊 Excel · 🖨️ PDF
- ✅ **Prospecções 2026** — Regressão Linear OLS + Índice de Oportunidade de Investimento BNB

---

## 🔮 Prospecções 2026 · Índice de Oportunidade BNB

| Ranking | Estado | Índice | Tier |
|---------|--------|-------:|------|
| 🥇 | Sergipe | 93,0 | 🔴 ALTA |
| 🥈 | Maranhão | 88,4 | 🔴 ALTA |
| 🥉 | Paraíba | 86,1 | 🔴 ALTA |
| 4 | Piauí | 85,1 | 🔴 ALTA |
| 5 | Alagoas | 64,7 | 🟠 MÉDIA-ALTA · CAGR 48,5% |
| 6-9 | BA · RN · CE · PE | 40–48 | 🟡 Consolidado |

> **Metodologia:** Índice composto = CAGR 3 anos (35%) + Potencial não explorado (35%) + Eficiência econômica (30%) · Projeções por Regressão Linear OLS sobre série 2021–2025

---

## 📊 Fontes de Dados

| Indicador | Fonte | Status |
|-----------|-------|--------|
| Chegadas internacionais por UF | EMBRATUR / Polícia Federal | ✅ Fechamento 2025 verificado |
| Receitas de viagens int. | API Banco Central (SGS 22741) | ✅ Integrado via Python |
| Gasto médio por estado 2024 | PNAD Contínua Turismo – IBGE | ✅ Verificado |
| Receita turística estimada | MTur + IBGE pro-rata | 🟡 Estimado |
| Portal MTur CSVs | dados.turismo.gov.br | ❌ 502 (aguardando retorno) |

**Totais nacionais verificados (Anuário Embratur 2025):**  
2021: 745k · 2022: 3,6M · 2023: 5,9M · 2024: **6,7M chegadas internacionais**

---

## 🚀 Como Executar

```bash
# Dashboard — abrir no navegador sem instalação
index.html → duplo clique

# Pipeline de dados
python processar_dados.py           # usa dados verificados embutidos
python processar_dados.py --refresh # tenta download MTur quando disponível

# Projeções 2026
python gerar_prospecoes.py
```

---

## 🛠️ Stack

| Camada | Tecnologia |
|--------|-----------|
| **Frontend** | HTML5 + CSS3 + JavaScript puro |
| **Gráficos** | Canvas API nativa (sem Chart.js) |
| **Design** | Dark mode · Paleta oceânica · Google Fonts Syne + Inter |
| **Exportação** | CSV (Blob), Excel (HTML-table XLS), PDF (print CSS A4) |
| **Backend/ETL** | Python 3.8+ · `urllib`, `json`, `csv` · sem pip pesado |
| **Dados** | EMBRATUR · PNAD-IBGE · MTur |

---

## 👤 Candidatura

```
Vaga:    Perfil 2 – ObIT-NE / Banco do Nordeste
Foco:    Dashboards, Relatórios e UX/UI para turismo
Prazo:   13/03/2026
```

---

<div align="center">

**Desenvolvido com 🌊 para o Nordeste · ObIT-NE · BNB · 2026**

[![GitHub](https://img.shields.io/badge/GitHub-idarlandias-181717?style=flat-square&logo=github)](https://github.com/idarlandias)

</div>
