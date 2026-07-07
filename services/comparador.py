"""
services/comparador.py
──────────────────────
Lógica de leitura e comparação das planilhas de Rubricas.
"""

import re
import unicodedata
import openpyxl
import pandas as pd
from io import BytesIO
from openpyxl.styles import Alignment, Font
from openpyxl.utils import get_column_letter

# Importando as funções globais e constantes do core
from core.utils import (
    moeda_para_float, limpar_str, 
    COR_VERDE, COR_VERMELHO, COR_AMARELO, COR_CABECALHO, COR_RESUMO, 
    FONTE_CAB, FONTE_BOLD, FONTE_NORMAL, BORDA
)

# ── Configurações ────────────────────────────────────────────
TOLERANCIA = 0.05   # diferença máxima aceita como OK (R$)

COLUNAS_SAIDA = [
    "Matrícula", "Funcionário", "Código(s) Evento", "Nome do Evento",
    "Valor Lançamento", "Referência Sistema", "Provento Sistema",
    "Desconto Sistema", "Tipo Identificado", "Status", "Observação",
]

# ════════════════════════════════════════════════════════════
# FUNÇÕES AUXILIARES
# ════════════════════════════════════════════════════════════

def _nome_arquivo(arquivo) -> str:
    return str(getattr(arquivo, "name", getattr(arquivo, "filename", ""))).lower()

def _reposicionar(arquivo):
    try:
        arquivo.seek(0)
    except Exception:
        pass

def _carregar_matriz(arquivo) -> list[tuple]:
    """
    Lê a planilha (XLSX ou CSV) e devolve uma matriz de linhas (lista de tuplas),
    no mesmo formato que `ws.iter_rows(values_only=True)` do openpyxl produzia
    originalmente. Mantém o restante da lógica de leitura idêntico para ambos
    os formatos aceitos no uploader (.xlsx e .csv).
    """
    _reposicionar(arquivo)
    nome = _nome_arquivo(arquivo)

    if nome.endswith(".csv"):
        df = pd.read_csv(arquivo, header=None, sep=None, engine="python", dtype=object)
        df = df.where(pd.notnull(df), None)
        return [tuple(linha) for linha in df.itertuples(index=False, name=None)]

    wb = openpyxl.load_workbook(arquivo, data_only=True)
    ws = wb.active
    dados = list(ws.iter_rows(values_only=True))
    wb.close()
    return dados

def extrair_codigos(nome_coluna: str) -> list[str]:
    """Extrai todos os códigos numéricos de um nome de coluna."""
    return re.findall(r"\((\d+)\)", limpar_str(nome_coluna))

def normalizar_cabecalho(valor) -> str:
    texto = limpar_str(valor).lower()
    texto = unicodedata.normalize("NFKD", texto)
    texto = "".join(ch for ch in texto if not unicodedata.combining(ch))
    return re.sub(r"[^a-z0-9]+", " ", texto).strip()

def normalizar_codigo_evento(valor) -> str:
    if isinstance(valor, int):
        return str(valor)
    if isinstance(valor, float) and valor.is_integer():
        return str(int(valor))

    texto = limpar_str(valor)
    match = re.fullmatch(r"(\d+)(?:[,.]0+)?", texto)
    return match.group(1) if match else texto

def comparar(val_lanc, ref, prov, desc) -> tuple[str, str]:
    v = moeda_para_float(val_lanc)
    if v == 0.0:
        return None, None
    r, p, d = moeda_para_float(ref), moeda_para_float(prov), moeda_para_float(desc)
    
    if abs(v - r) <= TOLERANCIA and r != 0.0:
        return "OK_REFERENCIA", "Referência"
    if abs(v - p) <= TOLERANCIA and p != 0.0:
        return "OK_PROVENTO", "Provento"
    if abs(v - d) <= TOLERANCIA and d != 0.0:
        return "OK_DESCONTO", "Desconto"
    return "DIVERGENTE", "—"

# ════════════════════════════════════════════════════════════
# LEITURA DAS PLANILHAS
# ════════════════════════════════════════════════════════════

def ler_lancamentos(arquivo) -> tuple[dict, dict, list]:
    dados = _carregar_matriz(arquivo)

    if not dados:
        raise ValueError("Planilha de lançamentos está vazia.")

    cabecalho = dados[0]
    colunas = []
    for idx, nome in enumerate(cabecalho):
        if idx < 2 or nome is None:
            continue
        codigos = extrair_codigos(nome)
        if not codigos:
            continue
        colunas.append({
            "idx":    idx,
            "nome":   limpar_str(nome),
            "codigos": codigos,
            "chave":  f"{limpar_str(nome)}||col{idx}",
            "multi":  len(codigos) > 1,
        })

    lanc_por_mat, nomes = {}, {}
    for linha in dados[1:]:
        if not linha or linha[0] is None:
            continue
        try:
            mat = int(float(str(linha[0]).strip()))
        except (ValueError, TypeError):
            continue
        nomes[mat] = limpar_str(linha[1]) if len(linha) > 1 else ""
        lanc_por_mat[mat] = {
            col["chave"]: moeda_para_float(linha[col["idx"]] if col["idx"] < len(linha) else None)
            for col in colunas
        }

    return lanc_por_mat, nomes, colunas

def ler_sistema(arquivo) -> dict:
    dados = _carregar_matriz(arquivo)

    if not dados:
        raise ValueError("Planilha do sistema está vazia.")

    inicio_dados, idxs = _mapear_colunas_sistema(dados)
    sistema = {}
    for linha in dados[inicio_dados:]:
        if not linha or idxs["mat"] >= len(linha) or linha[idxs["mat"]] is None:
            continue
        try:
            mat  = int(float(str(linha[idxs["mat"]]).strip()))
            cod  = normalizar_codigo_evento(linha[idxs["cod"]] if idxs["cod"] < len(linha) else None)
            nome = limpar_str(linha[idxs["nome"]]) if idxs["nome"] < len(linha) else ""
            ref  = moeda_para_float(linha[idxs["ref"]] if idxs["ref"] < len(linha) else None)
            prov = moeda_para_float(linha[idxs["prov"]] if idxs["prov"] < len(linha) else None)
            desc = moeda_para_float(linha[idxs["desc"]] if idxs["desc"] < len(linha) else None)
        except (ValueError, IndexError, TypeError):
            continue
        if not cod:
            continue
        sistema.setdefault(mat, {})
        if cod in sistema[mat]:
            sistema[mat][cod]["ref"]  += ref
            sistema[mat][cod]["prov"] += prov
            sistema[mat][cod]["desc"] += desc
        else:
            sistema[mat][cod] = {"nome": nome, "ref": ref, "prov": prov, "desc": desc}

    return sistema

def _mapear_colunas_sistema(dados) -> tuple[int, dict]:
    aliases = {
        "mat":  ("matricula",),
        "cod":  ("cod evento", "codigo evento", "cod evento do recibo", "codigo evento do recibo"),
        "nome": ("evento", "nome evento", "nome do evento"),
        "ref":  ("referencia",),
        "prov": ("valor provento", "provento", "provento sistema"),
        "desc": ("valor desconto", "desconto", "desconto sistema"),
    }

    for pos, cabecalho in enumerate(dados):
        normalizados = {
            normalizar_cabecalho(nome): idx
            for idx, nome in enumerate(cabecalho)
            if limpar_str(nome)
        }
        idxs = {}
        for campo, opcoes in aliases.items():
            idx = next((normalizados[opcao] for opcao in opcoes if opcao in normalizados), None)
            if idx is None:
                break
            idxs[campo] = idx
        else:
            return pos + 1, idxs

    if dados and len(dados[0]) >= 7:
        return 1, {"mat": 0, "cod": 2, "nome": 3, "ref": 4, "prov": 5, "desc": 6}

    raise ValueError("Não foi possível identificar as colunas da planilha do sistema.")

# ════════════════════════════════════════════════════════════
# COMPARAÇÃO PRINCIPAL
# ════════════════════════════════════════════════════════════

def executar_comparacao(arquivo_lanc, arquivo_sist) -> list[dict]:
    lanc_por_mat, nomes, colunas = ler_lancamentos(arquivo_lanc)
    sistema = ler_sistema(arquivo_sist)
    resultados = []

    for mat, valores in lanc_por_mat.items():
        nome_func   = nomes.get(mat, "")
        ev_sistema  = sistema.get(mat)

        for col in colunas:
            val_lanc = valores.get(col["chave"], 0.0)
            if val_lanc == 0.0:
                continue

            codigos    = col["codigos"]
            nome_event = col["nome"]

            if ev_sistema is None:
                resultados.append(_linha(
                    mat, nome_func, "+".join(codigos), nome_event,
                    val_lanc, "", "", "", "—",
                    "NAO_ENCONTRADO", "Matrícula não encontrada no sistema",
                ))
                continue

            if col["multi"]:
                achados    = [c for c in codigos if c in ev_sistema]
                ref_tot    = sum(ev_sistema[c]["ref"]  for c in achados)
                prov_tot   = sum(ev_sistema[c]["prov"] for c in achados)
                desc_tot   = sum(ev_sistema[c]["desc"] for c in achados)

                if not achados:
                    status, tipo, obs = "NAO_ENCONTRADO", "—", "Nenhum dos códigos encontrado"
                else:
                    status, tipo = comparar(val_lanc, ref_tot, prov_tot, desc_tot)
                    if status is None: continue
                    obs = f"Soma de {len(achados)} eventos: {' + '.join(achados)}"

                resultados.append(_linha(
                    mat, nome_func, "+".join(codigos), nome_event,
                    val_lanc, round(ref_tot, 2), round(prov_tot, 2), round(desc_tot, 2),
                    tipo, status, obs,
                ))
                continue

            cod = codigos[0]
            if cod not in ev_sistema:
                resultados.append(_linha(
                    mat, nome_func, cod, nome_event, val_lanc, "", "", "", "—",
                    "NAO_ENCONTRADO", f"Evento {cod} não encontrado no sistema",
                ))
                continue

            ev = ev_sistema[cod]
            status, tipo = comparar(val_lanc, ev["ref"], ev["prov"], ev["desc"])
            if status is None: continue

            resultados.append(_linha(
                mat, nome_func, cod, nome_event, val_lanc,
                round(ev["ref"], 2), round(ev["prov"], 2), round(ev["desc"], 2),
                tipo, status, "",
            ))

    return resultados

def _linha(mat, func, cod, evento, val, ref, prov, desc, tipo, status, obs) -> dict:
    return {
        "Matrícula":          mat,
        "Funcionário":        func,
        "Código(s) Evento":   cod,
        "Nome do Evento":     evento,
        "Valor Lançamento":   val,
        "Referência Sistema": ref,
        "Provento Sistema":   prov,
        "Desconto Sistema":   desc,
        "Tipo Identificado":  tipo,
        "Status":             status,
        "Observação":         obs,
    }

# ════════════════════════════════════════════════════════════
# GERAÇÃO DO EXCEL FORMATADO
# ════════════════════════════════════════════════════════════

def gerar_excel(resultados: list[dict]) -> bytes:
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "CONFERÊNCIA"

    for ci, titulo in enumerate(COLUNAS_SAIDA, 1):
        c = ws.cell(row=1, column=ci, value=titulo)
        c.fill, c.font, c.border = COR_CABECALHO, FONTE_CAB, BORDA
        c.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
    ws.row_dimensions[1].height = 30

    for ri, reg in enumerate(resultados, 2):
        for ci, col in enumerate(COLUNAS_SAIDA, 1):
            valor = reg.get(col, "")
            c = ws.cell(row=ri, column=ci, value=valor)
            c.font, c.border, c.alignment = FONTE_NORMAL, BORDA, Alignment(vertical="center")
            if col in ("Valor Lançamento", "Referência Sistema", "Provento Sistema", "Desconto Sistema") and isinstance(valor, float):
                c.number_format = "#,##0.00"

        status = reg.get("Status", "")
        cor = COR_VERDE if "OK" in status else COR_VERMELHO if status == "DIVERGENTE" else COR_AMARELO if status == "NAO_ENCONTRADO" else None
        if cor:
            for ci in range(1, len(COLUNAS_SAIDA) + 1): ws.cell(row=ri, column=ci).fill = cor

    ws.auto_filter.ref, ws.freeze_panes = ws.dimensions, "C2"
    larguras = [12, 38, 16, 38, 18, 18, 18, 18, 18, 18, 45]
    for ci, larg in enumerate(larguras, 1): ws.column_dimensions[get_column_letter(ci)].width = larg

    ws2 = wb.create_sheet("RESUMO")
    total = len(resultados)
    ok_ref = sum(1 for r in resultados if r["Status"] == "OK_REFERENCIA")
    ok_prov = sum(1 for r in resultados if r["Status"] == "OK_PROVENTO")
    ok_desc = sum(1 for r in resultados if r["Status"] == "OK_DESCONTO")
    ok_tot = ok_ref + ok_prov + ok_desc
    diverg = sum(1 for r in resultados if r["Status"] == "DIVERGENTE")
    nao_enc = sum(1 for r in resultados if r["Status"] == "NAO_ENCONTRADO")
    perc = round(ok_tot / total * 100, 1) if total else 0

    linhas = [
        ("CONFERÊNCIA DE FOLHA DE PAGAMENTO — MAÇANEIRO", "", ""),
        ("", "", ""),
        ("INDICADOR", "QUANTIDADE", "PERCENTUAL"),
        ("Total comparado",       total,   "100%"),
        ("✅ OK — Referência",    ok_ref,  f"{round(ok_ref/total*100,1) if total else 0}%"),
        ("✅ OK — Provento",      ok_prov, f"{round(ok_prov/total*100,1) if total else 0}%"),
        ("✅ OK — Desconto",      ok_desc, f"{round(ok_desc/total*100,1) if total else 0}%"),
        ("✅ Total OK",           ok_tot,  f"{perc}%"),
        ("❌ Divergentes",        diverg,  f"{round(diverg/total*100,1) if total else 0}%"),
        ("⚠️  Não encontrados",    nao_enc, f"{round(nao_enc/total*100,1) if total else 0}%"),
        ("", "", ""),
        ("PERCENTUAL DE ACERTO GERAL", "", f"{perc}%"),
    ]

    for ri, tripla in enumerate(linhas, 1):
        a, b, c_val = tripla if isinstance(tripla, tuple) else (tripla, "", "")
        for ci, val in enumerate((a, b, c_val), 1):
            cel = ws2.cell(row=ri, column=ci, value=val)
            cel.border, cel.font = BORDA, FONTE_NORMAL
            cel.alignment = Alignment(horizontal="center" if ci > 1 else "left", vertical="center")

    ws2.merge_cells("A1:C1")
    ws2["A1"].fill, ws2["A1"].font, ws2["A1"].alignment = COR_CABECALHO, Font(color="FFFFFF", bold=True, name="Calibri", size=13), Alignment(horizontal="center", vertical="center")
    ws2.row_dimensions[1].height = 35
    for ci in range(1, 4): ws2.cell(row=3, column=ci).fill, ws2.cell(row=3, column=ci).font = COR_RESUMO, FONTE_BOLD
    for r, cor in [(8, COR_VERDE), (9, COR_VERMELHO), (10, COR_AMARELO), (12, COR_CABECALHO)]:
        for ci in range(1, 4): 
            ws2.cell(row=r, column=ci).fill = cor
            if r in (8, 12): ws2.cell(row=r, column=ci).font = FONTE_BOLD if r == 8 else Font(color="FFFFFF", bold=True, name="Calibri", size=11)

    ws2.column_dimensions["A"].width, ws2.column_dimensions["B"].width, ws2.column_dimensions["C"].width = 38, 16, 16

    buf = BytesIO()
    wb.save(buf)
    return buf.getvalue()
