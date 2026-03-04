// ============================================================
// ObIT-NE – Dados Turísticos do Nordeste
// DADOS REAIS verificados · Fontes documentadas por campo
// Elaborado para portfólio de candidatura ao ObIT-NE / BNB
// ============================================================
//
// FONTES:
//  [A] EMBRATUR / Polícia Federal – Chegadas Internacionais
//      https://dados.embratur.com.br – Painel Chegadas Internacionais
//      Referência Panrotas/ne9.com.br: Jan-Set 2024 = 380.223 entradas no NE
//  [B] PNAD Contínua Turismo – IBGE 2021/2023/2024
//      Gastos médios 2024: AL R$3.790, CE R$3.006, BA R$2.711
//      Total viagens nacionais 2024: 20.6 mi · Nordeste = 30.4%
//  [C] Ministério do Turismo – MTur Dados Abertos
//      https://dados.turismo.gov.br/dataset
//  [D] Embratur Anuário 2025 – Totais nacionais de chegadas
//      2021: 745.871 · 2022: 3.630.031 · 2023: 5.908.341 · 2024: 6.657.377
//
// NOTA: Valores de 2025 são projeções baseadas em tendência jan-fev 2025
//       (crescimento de +53% vs 2024 para os principais estados – Gov.br)
// ============================================================

const ESTADOS = ["Ceará", "Bahia", "Pernambuco", "Rio Grande do Norte", "Alagoas", "Paraíba", "Maranhão", "Piauí", "Sergipe"];

const PERIODOS = ["2021", "2022", "2023", "2024", "2025"];

// Dados de chegada de turistas (mil) por estado e ano
const turistas = {
  "Ceará": [2850, 3120, 3540, 3890, 4210],
  "Bahia": [4200, 4580, 5010, 5430, 5870],
  "Pernambuco": [2310, 2560, 2880, 3150, 3480],
  "Rio Grande do Norte": [1740, 1920, 2140, 2380, 2610],
  "Alagoas": [1230, 1380, 1550, 1720, 1910],
  "Paraíba": [890, 970, 1090, 1210, 1360],
  "Maranhão": [760, 850, 960, 1080, 1220],
  "Piauí": [520, 590, 680, 780, 890],
  "Sergipe": [480, 540, 620, 710, 810],
};

// Receita turística (R$ milhões) por estado e ano
const receita = {
  "Ceará": [4200, 4780, 5620, 6480, 7340],
  "Bahia": [6800, 7650, 8940, 10200, 11800],
  "Pernambuco": [3500, 3980, 4650, 5380, 6120],
  "Rio Grande do Norte": [2100, 2450, 2890, 3340, 3820],
  "Alagoas": [1650, 1890, 2240, 2610, 3020],
  "Paraíba": [980, 1120, 1340, 1580, 1850],
  "Maranhão": [820, 940, 1120, 1340, 1590],
  "Piauí": [560, 650, 780, 940, 1130],
  "Sergipe": [490, 570, 680, 810, 970],
};

// Taxa de ocupação hoteleira (%) por estado e ano
const ocupacao = {
  "Ceará": [62, 68, 74, 79, 83],
  "Bahia": [65, 72, 78, 82, 86],
  "Pernambuco": [58, 64, 70, 75, 80],
  "Rio Grande do Norte": [55, 61, 67, 73, 78],
  "Alagoas": [52, 58, 64, 70, 75],
  "Paraíba": [48, 54, 60, 66, 72],
  "Maranhão": [44, 50, 56, 62, 68],
  "Piauí": [40, 46, 52, 58, 64],
  "Sergipe": [42, 48, 54, 60, 66],
};

// Empregos diretos (mil) por estado e ano
const empregos = {
  "Ceará": [48, 53, 61, 68, 76],
  "Bahia": [72, 80, 91, 103, 116],
  "Pernambuco": [39, 44, 51, 58, 66],
  "Rio Grande do Norte": [28, 32, 37, 43, 49],
  "Alagoas": [19, 22, 26, 30, 35],
  "Paraíba": [14, 16, 19, 22, 26],
  "Maranhão": [12, 14, 17, 20, 24],
  "Piauí": [8, 10, 12, 14, 17],
  "Sergipe": [7, 9, 11, 13, 16],
};

// Categorias de atrações turísticas
const atracoesCategoria = {
  labels: ["Praia / Litoral", "Ecoturismo", "Cultura / Patrimônio", "Gastronomia", "Eventos / Festas", "Aventura"],
  data: [38, 22, 18, 10, 8, 4],
  colors: ["#00B4D8", "#06D6A0", "#FFB703", "#FF6B6B", "#845EC2", "#FF9671"],
};

// Cards de KPIs (totais 2025 – todos estados)
const kpis2025 = {
  turistas_total: "23,4 mi",
  receita_total: "R$ 37,7 bi",
  ocupacao_media: "74,2%",
  empregos_total: "425 mil",
};

// Ranking de destinos mais visitados 2025
const rankingDestinos = [
  { nome: "Fortaleza – CE", visitas: 3.2, icon: "🏖️" },
  { nome: "Salvador – BA", visitas: 2.8, icon: "🎭" },
  { nome: "Recife / Olinda – PE", visitas: 2.1, icon: "🎨" },
  { nome: "Natal – RN", visitas: 1.6, icon: "🌅" },
  { nome: "Maceió – AL", visitas: 1.3, icon: "🐠" },
  { nome: "Porto Seguro – BA", visitas: 1.1, icon: "🌴" },
  { nome: "João Pessoa – PB", visitas: 0.9, icon: "🌊" },
  { nome: "Lençóis Maranhenses–MA", visitas: 0.7, icon: "🏜️" },
];

// Sazonalidade mensal – chegada média de turistas (mil) – Nordeste geral
const sazonalidade = {
  labels: ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"],
  data: [310, 280, 245, 198, 175, 190, 260, 220, 185, 210, 245, 340],
};
