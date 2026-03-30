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

Painel analítico interativo de inteligência turística desenvolvido como entrega do **Case Turismo — BNB / ObIT-NE**. O dashboard consolida **432 registros mensais** provenientes exclusivamente da base de dados oficial fornecida (`base_case_turismo.xlsx`), cobrindo os estados do **Ceará, Rio Grande do Norte, Pernambuco e Piauí**, com 12 cidades e 3 categorias de empreendimento (Hotel, Pousada e Agência).

Toda a interface é construída com **HTML + CSS + JavaScript puro**, sem frameworks front-end, e publicada via GitHub Pages com deploy automático.

## 📊 Indicadores-Chave (KPIs)

| Indicador | Valor | Melhor Mês | Menor Mês |
| :--- | :--- | :--- | :--- |
| **Total de Clientes** | 472.607 | Mar (44.302) | Set (32.181) |
| **Receita Total** | R$ 75,8M | Mai (R$ 7,3M) | Nov (R$ 5,2M) |
| **Ocupação Média** | 68% | Nov (71,1%) | Mar (60,6%) |
| **Avaliação Média** | 4,0 / 5,0 | Jul (4,2) | Jan (3,9) |

## 🗺️ Cobertura Geográfica

| Estado | Cidades |
| :--- | :--- |
| **Ceará (CE)** | Fortaleza · Jericoacoara · Canoa Quebrada |
| **Rio Grande do Norte (RN)** | Natal · Pipa · Genipabu |
| **Pernambuco (PE)** | Recife · Porto de Galinhas · Olinda |
| **Piauí (PI)** | Teresina · Luís Correia · Parnaíba |

## ✨ Funcionalidades

### Painel Principal
| Módulo | Descrição |
| :--- | :--- |
| **Visão Geral** | KPIs consolidados com mín/máx por mês e comparativo anual |
| **Mapa Interativo (GeoViz)** | Clique nos polígonos dos estados para cross-filtering em todo o dashboard |
| **Comparativo por Estado / Cidade** | Gráfico de barras com indicador selecionado · Anual |
| **Distribuição por Tipo** | Donut chart — % da receita por tipo de empreendimento |
| **Principais Insights** | Geração automática dos 5 insights mais relevantes da base |

## 🏗️ Estrutura do Projeto

```text
Dashboard-Turistico-do-Nordeste/
│
├── index.html → SPA principal (Dashboard completo)
├── style.css → Estilização e layout responsivo (Dark Mode)
├── app.js → Core: Filtros, KPIs e lógica de interação
├── charts.js → Engine: Gráficos Canvas API customizados
├── data.js → Dataset: Dados provenientes da base_case_turismo.xlsx
└── mapa_nordeste.js → GeoData: Polígonos dos estados do Nordeste
```

## 🛠️ Stack Tecnológica

| Camada | Tecnologia |
| :--- | :--- |
| **Frontend** | HTML5 + CSS3 + JavaScript puro (ES6+) |
| **Gráficos** | Canvas API nativa — sem bibliotecas externas |
| **Mapa** | SVG interativo com malha GeoJSON real do IBGE |
| **Design** | Dark mode · Google Fonts Syne + Inter |
| **Exportação** | CSV (Blob) · Excel (.xls) · PDF (print CSS A4) |
| **Deploy** | GitHub Pages — CI/CD automático via GitHub Actions |

## 🚀 Como Executar

### Opção 1 — Acesso direto (sem instalação)
Acesse: [https://idarlandias.github.io/Dashboard-Tur-stico-do-Nordeste/](https://idarlandias.github.io/Dashboard-Tur-stico-do-Nordeste/)

### Opção 2 — Localmente
1. Clone o repositório ou baixe os arquivos.
2. Abra o arquivo `index.html` em qualquer navegador moderno.

## 📋 Descrição Analítica

A análise dos dados revela que o **Ceará** concentra a maior fatia da receita regional (25,5%), impulsionado principalmente por Fortaleza e Jericoacoara. A sazonalidade é um fator relevante: **maio** apresenta o maior faturamento, enquanto **novembro** registra o menor movimento.

Entre os tipos de empreendimento, as **agências** lideram em receita média por unidade. **Genipabu (RN)** se destaca com a maior taxa de ocupação (73,2%), e **Canoa Quebrada** lidera na satisfação do cliente com avaliação 4,2/5.

---
**Desenvolvido com dedicação para o Nordeste · CE · RN · PE · PI · 2026**
