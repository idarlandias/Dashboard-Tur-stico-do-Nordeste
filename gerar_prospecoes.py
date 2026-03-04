# ObIT-NE - Prospecoes 2026 e Indice de Oportunidade de Investimento BNB
# Metodologia: regressao linear simples (OLS) sobre serie 2021-2025 por estado
# Indice: CAGR 35% + Potencial nao explorado 35% + Eficiencia economica 30%

import json, os, sys
sys.stdout.reconfigure(encoding="utf-8")

ESTADOS = {
    "CE":"Ceara","BA":"Bahia","PE":"Pernambuco","RN":"Rio Grande do Norte",
    "AL":"Alagoas","PB":"Paraiba","MA":"Maranhao","PI":"Piaui","SE":"Sergipe"
}
ANOS = [2021,2022,2023,2024,2025]

CHEGADAS = {
    "CE":[52340,72180,88340,98570,119500],
    "BA":[84210,98430,122680,170220,210000],
    "PE":[55670,72340,84920,109240,135000],
    "RN":[22410,38920,44870,63680,80000],
    "AL":[4218,18940,29840,47920,62000],
    "PB":[2890,4120,4890,5315,7200],
    "MA":[3120,4580,5780,6810,8500],
    "PI":[980,1340,1590,1740,2200],
    "SE":[1740,2180,2940,3451,4300],
}
RECEITA = {
    "CE":[4376,6840,11273,14429,17500],
    "BA":[6099,8920,13338,16537,20000],
    "PE":[3364,5210,7301,9870,12000],
    "RN":[1602,2890,3357,4888,6000],
    "AL":[1493,2340,3988,6142,7800],
    "PB":[885,1310,1765,2262,2800],
    "MA":[967,1420,1911,2496,3100],
    "PI":[540,780,1042,1420,1750],
    "SE":[597,870,1049,1351,1680],
}
RATIONALE = {
    "CE":"Forte crescimento e alta eficiencia economica. Excelente ROI em infraestrutura e promocao internacional.",
    "BA":"Lider em volume com sinais de saturacao. Investir em diversificacao de destinos internos e turismo cultural.",
    "PE":"Mercado robusto e crescente. Oportunidade em ecoturismo e turismo de negocios (Porto Digital/Recife).",
    "RN":"Crescimento acelerado com base competitiva. Alto potencial para expansao da malha aerea internacional.",
    "AL":"Maior gasto per capita do NE (R$3.790). Nicho de alto valor com CAGR explosivo. Prioritario para BNB.",
    "PB":"Mercado emergente com infraestrutura em formacao. Investimento em CT&I e turismo pedagogico pode alavancar.",
    "MA":"Lencois Maranhenses: destino unico. Infraestrutura ainda limitada = janela de oportunidade ampla.",
    "PI":"Menor volume absoluto mas crescimento expressivo. Serra da Capivara - turismo cultural subexplorado.",
    "SE":"Menor estado do NE. Potencial concentrado em turismo gastronomico, arqueologico e de natureza.",
}

def regressao_linear(anos, valores):
    n = len(anos)
    x = [a - anos[0] for a in anos]
    mx = sum(x)/n
    my = sum(valores)/n
    b = sum((x[i]-mx)*(valores[i]-my) for i in range(n)) / sum((xi-mx)**2 for xi in x)
    a = my - b*mx
    return a, b

def projetar(anos, valores, ano_alvo):
    a, b = regressao_linear(anos, valores)
    return max(0, round(a + b*(ano_alvo - anos[0])))

def cagr(valores, n=3):
    ini, fim = valores[-(n+1)], valores[-1]
    if ini <= 0:
        return 0.0
    return round(((fim/ini)**(1/n) - 1)*100, 1)

def indice_oportunidade(uf):
    # CAGR component (0-100): CAGR de 30%+ = score 100
    c = min(100, cagr(CHEGADAS[uf]) / 30 * 100)
    # Potencial nao explorado: estados pequenos tem mais espaco de crescimento
    total = sum(CHEGADAS[u][-1] for u in ESTADOS)
    part = CHEGADAS[uf][-1] / total * 100  # participacao atual 0-100
    pot = max(0, min(100, 100 - part*7))   # quanto menor a parte, maior o potencial
    # Eficiencia: receita/chegadas ratio
    ratio = RECEITA[uf][-1] / CHEGADAS[uf][-1] if CHEGADAS[uf][-1] > 0 else 0
    efi = min(100, ratio / 0.20 * 100)     # normalizado, max ~R$0.20/chegada
    return round(c*0.35 + pot*0.35 + efi*0.30, 1)

def classificar(indice):
    if indice >= 65:
        return "ALTA", "🔴"
    if indice >= 45:
        return "MEDIA-ALTA", "🟠"
    if indice >= 30:
        return "MEDIA", "🟡"
    return "CONSOLIDADO", "🔵"

# Calcular e exibir
print("="*62)
print(" ObIT-NE - Prospecoes 2026 e Indice de Oportunidade BNB")
print("="*62)

resultado = {}
for uf, nome in ESTADOS.items():
    ch26 = projetar(ANOS, CHEGADAS[uf], 2026)
    rec26 = projetar(ANOS, RECEITA[uf], 2026)
    cg = cagr(CHEGADAS[uf])
    ind = indice_oportunidade(uf)
    var = round((ch26 - CHEGADAS[uf][-1]) / CHEGADAS[uf][-1] * 100, 1)
    cls, emoji = classificar(ind)
    resultado[uf] = {
        "estado": nome,
        "chegadas_2026_proj": ch26,
        "receita_2026_proj": rec26,
        "variacao_pct_2026": var,
        "cagr_3anos_pct": cg,
        "indice_oportunidade": ind,
        "classificacao": cls,
        "emoji": emoji,
        "rationale": RATIONALE.get(uf, ""),
    }
    print(f"\n  {emoji} {nome} [{uf}]")
    print(f"     Chegadas 2026 projetadas : {ch26:>12,}  (+{var}%)")
    print(f"     Receita 2026 projetada   : R$ {rec26:>7,} mi")
    print(f"     CAGR 3 anos             : {cg:>6.1f}%")
    print(f"     Indice Oportunidade BNB : {ind:>6.1f}/100  [{cls}]")
    print(f"     Estrategia              : {RATIONALE[uf][:70]}")

# Ranking
print("\n" + "="*62)
print(" RANKING OPORTUNIDADE INVESTIMENTO BNB 2026")
print("="*62)
ranking = sorted(resultado.items(), key=lambda x: x[1]["indice_oportunidade"], reverse=True)
for i, (uf, d) in enumerate(ranking, 1):
    bar = "#" * int(d["indice_oportunidade"]/5)
    print(f"  {i}. {d['emoji']} {d['estado']:<26} {d['indice_oportunidade']:>5.1f} {bar}")

# Salvar JSON
saida = {
    "meta": {
        "metodologia": "Regressao linear OLS sobre serie 2021-2025",
        "indice": "CAGR(35%) + Potencial_nao_explorado(35%) + Eficiencia_economica(30%)",
        "fonte_base": "EMBRATUR/PF + PNAD-IBGE 2024",
    },
    "projecoes_2026": resultado,
    "ranking_oportunidade": [
        {"posicao":i+1,"uf":uf,"estado":d["estado"],
         "indice":d["indice_oportunidade"],"classificacao":d["classificacao"]}
        for i,(uf,d) in enumerate(ranking)
    ],
}
out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "prospecoes_2026.json")
with open(out,"w",encoding="utf-8") as f:
    json.dump(saida, f, ensure_ascii=False, indent=2)
print(f"\n  JSON: {out}")
print("="*62)
