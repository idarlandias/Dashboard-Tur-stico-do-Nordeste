# 📊 Painel de Desempenho — Turismo Nordeste

<div align="center">

![Dashboard Preview](https://img.shields.io/badge/Status-Live-brightgreen?style=for-the-badge)
![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Publicado-blue?style=for-the-badge&logo=github)
![Versão](https://img.shields.io/badge/Versão-2.0-purple?style=for-the-badge)
![Licença](https://img.shields.io/badge/Licença-MIT-orange?style=for-the-badge)

**Dashboard interativo de análise do desempenho turístico do Nordeste brasileiro**  
Desenvolvido como entrega do Case Prático — Projeto Inova Talentos | BNB

🌐 **[Acessar Dashboard ao Vivo](https://idarlandias.github.io/caseturismo/)**

</div>

---

## 📸 Preview

<div align="center">

| KPIs & Filtros | Gráficos de Participação |
|---|---|
| Receita, Clientes, Ocupação e Avaliação com indicadores de variação mensal | Donuts de participação por Estado e Tipo + Resumo Rápido |

</div>

---

## 🎯 Sobre o Projeto

Este painel analítico foi desenvolvido para explorar e visualizar dados do setor de turismo em **4 estados do Nordeste brasileiro** (Ceará, Pernambuco, Rio Grande do Norte e Piauí), abrangendo **12 cidades** e **432 registros mensais**.

O objetivo é fornecer uma visão gerencial clara e interativa para tomada de decisões estratégicas no setor, com foco em receita, ocupação hoteleira, volume de clientes e satisfação.

---

## ✨ Funcionalidades

### 📌 KPIs Principais
- **Receita Total** — faturamento acumulado do período filtrado
- **Total de Clientes** — volume de visitantes
- **Ocupação Média** — taxa de ocupação dos empreendimentos
- **Avaliação Média** — satisfação do cliente (escala 1–5)
- 🆕 **Indicadores de variação** — melhor e pior mês para cada métrica

### 📊 Visualizações
| Gráfico | Tipo | Descrição |
|---|---|---|
| Receita Mensal por Estado | Linha | Evolução ao longo dos 12 meses |
| Receita por Tipo de Empreendimento | Barras | Comparativo acumulado anual |
| Taxa de Ocupação por Cidade | Barras Horizontais | Ranking de ocupação média |
| Clientes por Mês | Barras | Volume mensal de visitantes |
| Avaliação Média por Cidade | Barras Horizontais | Ranking de satisfação |
| Receita vs Ocupação | Scatter Plot | Correlação com labels de cidade |
| Participação por Estado | Donut | % da receita total por estado |
| Participação por Tipo | Donut | % da receita total por tipo |

### 🔍 Filtros Interativos
- Filtro por **Estado** (CE, PE, RN, PI)
- Filtro por **Cidade** (dinâmico conforme estado selecionado)
- Filtro por **Tipo** (Hotel, Pousada, Agência)
- Botão **Limpar Filtros**

### 📤 Exportação
- **📄 PDF** — captura completa do dashboard em múltiplas páginas via `html2canvas` + `jsPDF`
- **📊 Excel** — 5 abas: Dados Completos, Por Estado, Por Cidade, Por Tipo e Por Mês

---

## 🗂 Estrutura de Dados

```
432 registros = 4 estados × 3 tipos × 12 meses × 3 cidades por estado
```

| Campo | Tipo | Descrição |
|---|---|---|
| `mes` | String | Mês em português (Janeiro–Dezembro) |
| `mesAbrev` | String | Abreviação (Jan–Dez) |
| `mesIdx` | Number | Índice do mês (0–11) |
| `estado` | String | Sigla do estado (CE, PE, RN, PI) |
| `cidade` | String | Nome da cidade |
| `tipo` | String | Hotel / Pousada / Agência |
| `receita` | Number | Receita em R$ |
| `clientes` | Number | Total de visitantes |
| `ocupacao` | Number | Taxa de ocupação em % |
| `avaliacao` | Number | Nota média (1.0–5.0) |

---

## 🛠 Tecnologias Utilizadas

| Tecnologia | Versão | Uso |
|---|---|---|
| **HTML5** | — | Estrutura semântica |
| **CSS3** | — | Glassmorphism, animações, responsividade |
| **JavaScript** | Vanilla ES6+ | Lógica, filtros e renderização |
| **Chart.js** | 4.4.7 | Todos os gráficos interativos |
| **chartjs-plugin-datalabels** | 2.x | Labels no scatter plot |
| **SheetJS (XLSX)** | 0.18.5 | Exportação para Excel |
| **html2canvas** | 1.4.1 | Captura do dashboard para PDF |
| **jsPDF** | 2.5.1 | Geração do arquivo PDF |
| **Google Fonts (Inter)** | — | Tipografia moderna |

---

## 🚀 Como Executar Localmente

Não há dependências de servidor — o projeto roda diretamente no navegador:

```bash
# Clone o repositório
git clone https://github.com/idarlandias/caseturismo.git

# Acesse a pasta
cd caseturismo

# Abra no navegador
# Basta abrir o arquivo index.html no seu navegador
```

> **Requer conexão com internet** para carregar as bibliotecas via CDN (Chart.js, jsPDF, etc.)

---

## 📁 Estrutura do Projeto

```
caseturismo/
├── index.html      # Estrutura HTML do dashboard
├── style.css       # Estilos: tema dark, glassmorphism, responsividade
├── app.js          # Lógica: filtros, gráficos, exportação, insights
├── dados.js        # Base de dados (432 registros estáticos)
└── .gitignore      # Arquivos ignorados pelo Git
```

---

## 💡 Principais Insights Analíticos

- 🏆 **Ceará** concentra ~25,5% da receita regional, liderado por Fortaleza e Jericoacoara
- 📅 **Maio** é o mês de maior faturamento; **Novembro** registra o menor movimento
- 🏨 **Agências** apresentam o maior ticket médio por unidade de empreendimento
- 📍 **Genipabu (RN)** lidera em taxa de ocupação média (73,2%)
- ⭐ **Canoa Quebrada** destaca-se em satisfação do cliente (4,2/5)
- 📊 Ocupação elevada não garante alta receita — o tipo de empreendimento é determinante

---

## 🎨 Design

- **Tema:** Dark mode com glassmorphism
- **Paleta:** Azul (`#38bdf8`), Roxo (`#a78bfa`), Âmbar (`#fbbf24`), Verde (`#34d399`)
- **Tipografia:** Inter (Google Fonts)
- **Responsividade:** Desktop, tablet e mobile

---

## 📬 Autor

<div align="center">

**Idarlan Dias**  
Case Prático — Projeto Inova Talentos | BNB  

[![GitHub](https://img.shields.io/badge/GitHub-idarlandias-181717?style=flat-square&logo=github)](https://github.com/idarlandias)

</div>

---

<div align="center">

*Desenvolvido com dedicação para o Projeto Inova Talentos — Banco do Nordeste do Brasil*

</div>
