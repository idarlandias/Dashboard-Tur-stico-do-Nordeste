# ObIT-NE - Prospecoes 2026 e Indice de Oportunidade de Investimento BNB v2.1
# Metodologia: regressao linear simples (OLS) sobre serie 2021-2025 por estado
# Indice: CAGR 35% + Potencial nao explorado 35% + Eficiencia economica 30%

import json, os, sys, logging

sys.stdout.reconfigure(encoding="utf-8")

# ── Logging ──────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("ObIT-NE-Prosp")

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


def validar_dados():
    """Valida integridade dos dados antes de calcular projeções."""
    for uf in ESTADOS:
        if uf not in CHEGADAS or uf not in RECEITA:
            raise ValueError(f"UF '{uf}' ausente em CHEGADAS ou RECEITA")
        if len(CHEGADAS[uf]) != len(ANOS):
            raise ValueError(f"CHEGADAS[{uf}]: {len(CHEGADAS[uf])} valores, esperado {len(ANOS)}")
        if len(RECEITA[uf]) != len(ANOS):
            raise ValueError(f"RECEITA[{uf}]: {len(RECEITA[uf])} valores, esperado {len(ANOS)}")
        if any(v < 0 for v in CHEGADAS[uf]):
            raise ValueError(f"CHEGADAS[{uf}] contém valor negativo")
        if any(v < 0 for v in RECEITA[uf]):
            raise ValueError(f"RECEITA[{uf}] contém valor negativo")


def regressao_linear(anos, valores):
    """OLS sobre série temporal. Requer no mínimo 2 pontos."""
    n = len(anos)
    if n < 2:
        log.warning("Regressão requer >= 2 pontos, recebeu %d", n)
        return valores[-1] if valores else 0, 0

    x = [a - anos[0] for a in anos]
    mx = sum(x) / n
    my = sum(valores) / n

    denom = sum((xi - mx) ** 2 for xi in x)
    if denom == 0:
        log.warning("Variância zero em x — todos os anos iguais")
        return my, 0

    b = sum((x[i] - mx) * (valores[i] - my) for i in range(n)) / denom
    a = my - b * mx
    return a, b

def projetar(anos, valores, ano_alvo):
    a, b = regressao_linear(anos, valores)
    return max(0, round(a + b * (ano_alvo - anos[0])))

def cagr(valores, n=3):
    if len(valores) < n + 1:
        log.warning("CAGR requer %d+ valores, recebeu %d", n + 1, len(valores))
        return 0.0
    ini, fim = valores[-(n+1)], valores[-1]
    if ini <= 0:
        return 0.0
    return round(((fim / ini) ** (1 / n) - 1) * 100, 1)

def indice_oportunidade(uf):
    # CAGR component (0-100): CAGR de 30%+ = score 100
    c = min(100, cagr(CHEGADAS[uf]) / 30 * 100)

    # Potencial nao explorado: estados pequenos tem mais espaco de crescimento
    total = sum(CHEGADAS[u][-1] for u in ESTADOS)
    if total == 0:
        log.warning("Total de chegadas é zero — índice de potencial indefinido")
        pot = 50
    else:
        part = CHEGADAS[uf][-1] / total * 100
        pot = max(0, min(100, 100 - part * 7))

    # Eficiencia: receita/chegadas ratio
    if CHEGADAS[uf][-1] > 0:
        ratio = RECEITA[uf][-1] / CHEGADAS[uf][-1]
    else:
        ratio = 0
    efi = min(100, ratio / 0.20 * 100)

    return round(c * 0.35 + pot * 0.35 + efi * 0.30, 1)

def classificar(indice):
    if indice >= 65:
        return "ALTA", "🔴"
    if indice >= 45:
        return "MEDIA-ALTA", "🟠"
    if indice >= 30:
        return "MEDIA", "🟡"
    return "CONSOLIDADO", "🔵"


def main():
    print("=" * 62)
    print(" ObIT-NE - Prospecoes 2026 e Indice de Oportunidade BNB v2.1")
    print("=" * 62)

    # Validação
    log.info("Validando dados de entrada...")
    validar_dados()
    log.info("Validação OK: %d UFs × %d anos", len(ESTADOS), len(ANOS))

    resultado = {}
    for uf, nome in ESTADOS.items():
        ch26 = projetar(ANOS, CHEGADAS[uf], 2026)
        rec26 = projetar(ANOS, RECEITA[uf], 2026)
        cg = cagr(CHEGADAS[uf])
        ind = indice_oportunidade(uf)

        if CHEGADAS[uf][-1] > 0:
            var = round((ch26 - CHEGADAS[uf][-1]) / CHEGADAS[uf][-1] * 100, 1)
        else:
            var = 0.0
            log.warning("Chegadas 2025 = 0 para %s, variação definida como 0%%", uf)

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
    print("\n" + "=" * 62)
    print(" RANKING OPORTUNIDADE INVESTIMENTO BNB 2026")
    print("=" * 62)
    ranking = sorted(resultado.items(), key=lambda x: x[1]["indice_oportunidade"], reverse=True)
    for i, (uf, d) in enumerate(ranking, 1):
        bar = "#" * int(d["indice_oportunidade"] / 5)
        print(f"  {i}. {d['emoji']} {d['estado']:<26} {d['indice_oportunidade']:>5.1f} {bar}")

    # Salvar JSON
    saida = {
        "meta": {
            "versao": "2.1",
            "metodologia": "Regressao linear OLS sobre serie 2021-2025",
            "indice": "CAGR(35%) + Potencial_nao_explorado(35%) + Eficiencia_economica(30%)",
            "fonte_base": "EMBRATUR/PF + PNAD-IBGE 2024",
            "limitacoes": [
                "Regressao linear assume tendencia constante",
                "Serie curta (5 pontos) limita robustez estatistica",
                "Nao incorpora variaveis exogenas (cambio, PIB, conectividade aerea)",
                "Projecoes sao cenarios tendenciais, nao previsoes",
            ],
        },
        "projecoes_2026": resultado,
        "ranking_oportunidade": [
            {"posicao":i+1,"uf":uf,"estado":d["estado"],
             "indice":d["indice_oportunidade"],"classificacao":d["classificacao"]}
            for i,(uf,d) in enumerate(ranking)
        ],
    }
    out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "prospecoes_2026.json")
    with open(out, "w", encoding="utf-8") as f:
        json.dump(saida, f, ensure_ascii=False, indent=2)
    log.info("JSON salvo: %s", out)
    print("=" * 62)


if __name__ == "__main__":
    main()
