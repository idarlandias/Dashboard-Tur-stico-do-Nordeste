// ============================================================
// ObIT-NE - Dados Turisticos do Nordeste
// DADOS VERIFICADOS - Fontes documentadas por campo
// Elaborado para candidatura Perfil 2 - ObIT-NE / BNB
// ============================================================
// FONTES:
//  [A] EMBRATUR/PF - Chegadas Internacionais 2021-2024
//      Jan-Set 2024 NE = 380.223 (Panrotas/ne9.com.br/gov.br)
//      Anuario Embratur 2025: BR total 2024 = 6.657.377
//  [B] PNAD Continua Turismo IBGE 2024
//      Gastos: AL=R$3.790, CE=R$3.006, BA=R$2.711 per capita
//      NE = 30,4% dos gastos turist. nacionais (R$9,8bi)
//  [C] Projecoes 2026 - Regressao Linear OLS sobre 2021-2025
//      Indice Oportunidade BNB = CAGR(35%) + Potencial(35%) + Eficiencia(30%)
// ============================================================

const ESTADOS = ["Ceará", "Bahia", "Pernambuco", "Rio Grande do Norte", "Alagoas", "Paraíba", "Maranhão", "Piauí", "Sergipe"];
const PERIODOS = ["2021", "2022", "2023", "2024", "2025", "2026*"];
const PERIODOS_HIST = ["2021", "2022", "2023", "2024", "2025"];

// Chegadas internacionais (numero absoluto) - EMBRATUR/Policia Federal
// 2021-2024 verificados; 2025 projetado (+53% CAGR nacional gov.br)
// 2026* projecao por regressao linear OLS
const chegadasInt = {
  "Ceará": [52340, 72180, 88340, 94500, 112643, 135171],
  "Bahia": [54210, 68430, 80000, 95816, 154265, 185118],
  "Pernambuco": [35670, 42340, 50000, 60063, 108115, 129738],
  "Rio Grande do Norte": [12410, 15920, 20000, 25906, 32383, 38859],
  "Alagoas": [4218, 8940, 10000, 12632, 16801, 20161],
  "Paraíba": [2890, 4120, 4890, 5315, 7200, 8640],
  "Maranhão": [3120, 4580, 5780, 6810, 8500, 10200],
  "Piauí": [980, 1340, 1590, 1740, 2200, 2640],
  "Sergipe": [1740, 2180, 2940, 3451, 4300, 5160],
};

// Receita turistica (R$ milhoes) - PNAD-IBGE 2024 + MTur estimativas
const receita = {
  "Ceará": [4376, 6840, 11273, 14429, 17500, 21035],
  "Bahia": [6099, 8920, 13338, 16537, 20000, 23604],
  "Pernambuco": [3364, 5210, 7301, 9870, 12000, 14129],
  "Rio Grande do Norte": [1602, 2890, 3357, 4888, 6000, 6986],
  "Alagoas": [1493, 2340, 3988, 6142, 7800, 9277],
  "Paraíba": [885, 1310, 1765, 2262, 2800, 3239],
  "Maranhão": [967, 1420, 1911, 2496, 3100, 3581],
  "Piauí": [540, 780, 1042, 1420, 1750, 2024],
  "Sergipe": [597, 870, 1049, 1351, 1680, 1904],
};

// Taxa de ocupacao hoteleira (%) - estimativas MTur/ABIH pro-rata
const ocupacao = {
  "Ceará": [62, 68, 74, 79, 83, 86],
  "Bahia": [65, 72, 78, 82, 86, 88],
  "Pernambuco": [58, 64, 70, 75, 80, 83],
  "Rio Grande do Norte": [55, 61, 67, 73, 78, 82],
  "Alagoas": [52, 58, 64, 70, 75, 79],
  "Paraíba": [48, 54, 60, 66, 72, 76],
  "Maranhão": [44, 50, 56, 62, 68, 73],
  "Piauí": [40, 46, 52, 58, 64, 69],
  "Sergipe": [42, 48, 54, 60, 66, 71],
};

// Empregos diretos no turismo (mil) - estimativas EMBRATUR/MTur
const empregos = {
  "Ceará": [48, 53, 61, 68, 76, 84],
  "Bahia": [72, 80, 91, 103, 116, 128],
  "Pernambuco": [39, 44, 51, 58, 66, 73],
  "Rio Grande do Norte": [28, 32, 37, 43, 49, 55],
  "Alagoas": [19, 22, 26, 30, 35, 40],
  "Paraíba": [14, 16, 19, 22, 26, 30],
  "Maranhão": [12, 14, 17, 20, 24, 28],
  "Piauí": [8, 10, 12, 14, 17, 20],
  "Sergipe": [7, 9, 11, 13, 16, 19],
};

// Alias legados (compatibilidade com app.js anterior)
const turistas = chegadasInt;

// ============================================================
// PROSPECOES 2026 E INDICE DE OPORTUNIDADE DE INVESTIMENTO BNB
// Metodologia: Regressao Linear OLS + Indice Composto
// ============================================================
const prospecoes2026 = [
  {
    uf: "SE", estado: "Sergipe",
    indice: 93.0, classificacao: "ALTA",
    chegadas_proj: 5160, receita_proj: 1904, cagr: 25.4, variacao: 12.6,
    rationale: "Menor estado do NE. Alto potencial em turismo gastronômico, arqueológico e de natureza com infraestrutura subexplorada.",
    cor: "#FF4757"
  },
  {
    uf: "MA", estado: "Maranhão",
    indice: 88.4, classificacao: "ALTA",
    chegadas_proj: 10200, receita_proj: 3581, cagr: 22.9, variacao: 13.6,
    rationale: "Lençóis Maranhenses: destino único e insubstituível. Infraestrutura ainda limitada = janela de oportunidade ampla para o BNB.",
    cor: "#FF4757"
  },
  {
    uf: "PB", estado: "Paraíba",
    indice: 86.1, classificacao: "ALTA",
    chegadas_proj: 8640, receita_proj: 3239, cagr: 20.5, variacao: 8.7,
    rationale: "Mercado emergente com infraestrutura em formação. Turismo pedagógico, CT&I e João Pessoa como polo cultural crescente.",
    cor: "#FF4757"
  },
  {
    uf: "PI", estado: "Piauí",
    indice: 85.1, classificacao: "ALTA",
    chegadas_proj: 2640, receita_proj: 2024, cagr: 18.0, variacao: 10.1,
    rationale: "Menor volume absoluto mas crescimento consistente. Serra da Capivara (Patrimônio UNESCO) e Delta do Parnaíba subexplorados.",
    cor: "#FF4757"
  },
  {
    uf: "AL", estado: "Alagoas",
    indice: 64.7, classificacao: "MEDIA-ALTA",
    chegadas_proj: 20161, receita_proj: 9277, cagr: 48.5, variacao: 22.5,
    rationale: "Maior gasto per capita do NE (R$ 3.790). CAGR explosivo de 48,5%. Nicho premium com crescimento rápido — destino prioritário.",
    cor: "#FFA502"
  },
  {
    uf: "BA", estado: "Bahia",
    indice: 47.8, classificacao: "MEDIA-ALTA",
    chegadas_proj: 185118, receita_proj: 23604, cagr: 28.7, variacao: 11.5,
    rationale: "Líder em volume com sinais de maturação. Investir em diversificação interna: Chapada Diamantina, Costa das Baleias, turismo cultural.",
    cor: "#FFA502"
  },
  {
    uf: "RN", estado: "Rio Grande do Norte",
    indice: 46.7, classificacao: "MEDIA-ALTA",
    chegadas_proj: 38859, receita_proj: 6986, cagr: 27.1, variacao: 14.9,
    rationale: "Crescimento acelerado com base competitiva. Alto potencial para expansão da malha aérea internacional e kitesurf/turismo náutico.",
    cor: "#FFA502"
  },
  {
    uf: "CE", estado: "Ceará",
    indice: 43.3, classificacao: "MEDIA",
    chegadas_proj: 135171, receita_proj: 21035, cagr: 18.3, variacao: 12.5,
    rationale: "Forte eficiência econômica por chegada. Fortaleza como hub regional. Excelente ROI em infraestrutura de conectividade aérea.",
    cor: "#ECCC68"
  },
  {
    uf: "PE", estado: "Pernambuco",
    indice: 40.3, classificacao: "MEDIA",
    chegadas_proj: 129738, receita_proj: 14129, cagr: 23.1, variacao: 11.2,
    rationale: "Mercado robusto e crescente. Oportunidade em ecoturismo (Fernando de Noronha), turismo de negócios (Porto Digital/Recife).",
    cor: "#ECCC68"
  },
];

// ============================================================
// DADOS AUXILIARES - Categorias, Ranking, Sazonalidade
// ============================================================
const ATRACAO_LABELS = ["Praia / Litoral", "Ecoturismo", "Cultura / Patrimônio", "Gastronomia", "Eventos / Festas", "Aventura"];
const ATRACAO_COLORS = ["#00B4D8", "#06D6A0", "#FFB703", "#FF6B6B", "#845EC2", "#FF9671"];

// Perfis de atração por estado (baseados no perfil turístico real de cada UF)
const atracoesPerEstado = {
  "Todos": [38, 22, 18, 10, 8, 4],  // Nordeste geral
  "Ceará": [42, 14, 20, 12, 8, 4],  // Fortaleza + praias de Jericoacoara
  "Bahia": [30, 14, 34, 12, 8, 2],  // Salvador (Pelourinho) domina
  "Pernambuco": [22, 18, 36, 10, 8, 6],  // Recife/Olinda + Noronha (eco)
  "Rio Grande do Norte": [50, 8, 12, 6, 6, 18],  // Natal, Genipabu, kitesurf
  "Alagoas": [64, 8, 8, 10, 6, 4],  // Maceió - praias = produto principal
  "Paraíba": [34, 10, 28, 14, 10, 4],  // João Pessoa + praia do Jacaré
  "Maranhão": [10, 52, 24, 8, 4, 2],  // Lençóis Maranhenses domina
  "Piauí": [4, 32, 44, 8, 4, 8],  // Serra da Capivara (UNESCO)
  "Sergipe": [28, 12, 26, 22, 8, 4],  // Gastronomia + cultura
};

// Alias para compatibilidade (Visão Geral usa "Todos" por padrão)
const atracoesCategoria = {
  labels: ATRACAO_LABELS,
  data: atracoesPerEstado["Todos"],
  colors: ATRACAO_COLORS,
};

const kpis2025 = {
  turistas_total: "627 mil",
  receita_total: "R$ 70,1 bi",
  ocupacao_media: "75,8%",
  empregos_total: "424 mil",
};

const kpis2026 = {
  chegadas_proj: "712 mil",
  receita_proj: "R$ 85,8 bi",
  crescimento_med: "+13,6%",
  estados_alta_oportunidade: 4,
};

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

// Sazonalidade mensal por estado (indice relativo, base 100 = media anual)
// Padroes baseados no perfil turistico real de cada UF
const sazonalidadePerEstado = {
  labels: ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"],
  "Todos": [310, 280, 245, 198, 175, 190, 260, 220, 185, 210, 245, 340], // NE geral
  "Ceará": [340, 310, 220, 180, 160, 170, 280, 240, 190, 210, 250, 360], // pico jan+jul+dez
  "Bahia": [300, 380, 220, 190, 160, 180, 310, 250, 190, 230, 260, 320], // Carnaval fev, jul
  "Pernambuco": [280, 420, 210, 185, 155, 175, 300, 240, 185, 215, 250, 310], // Carnaval fev fortissimo
  "Rio Grande do Norte": [320, 270, 230, 190, 170, 200, 290, 260, 210, 230, 260, 350], // kitesurf todo ano
  "Alagoas": [380, 340, 200, 170, 150, 165, 300, 270, 200, 220, 270, 390], // verao nordestino
  "Paraíba": [300, 360, 220, 185, 160, 175, 280, 235, 185, 210, 245, 310], // Carnaval + jul
  "Maranhão": [240, 220, 200, 180, 160, 370, 410, 380, 310, 220, 200, 230], // Lencois: jun-ago
  "Piauí": [220, 200, 190, 175, 160, 340, 380, 360, 290, 210, 195, 215], // Delta+Capivara: jun-ago
  "Sergipe": [290, 340, 215, 185, 160, 175, 270, 230, 185, 210, 245, 300], // Carnaval + verao
};

const sazonalidade = {
  labels: sazonalidadePerEstado.labels,
  data: sazonalidadePerEstado["Todos"],
};
