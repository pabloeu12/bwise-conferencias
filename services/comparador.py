"""
services/comparador.py
──────────────────────
Lógica de leitura e comparação das planilhas de Rubricas.
"""

import re
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

def extrair_codigos(nome_coluna: str) -> list[str]:
    """Extrai todos os códigos numéricos de um nome de coluna."""
    return re.findall(r"\((\d+)\)", limpar_str(nome_coluna))

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
    wb = openpyxl.load_workbook(arquivo, data_only=True)
    ws = wb.active
    dados = list(ws.iter_rows(values_only=True))
    wb.close()

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
    wb = openpyxl.load_workbook(arquivo, data_only=True)
    ws = wb.active
    dados = list(ws.iter_rows(values_only=True))
    wb.close()

    if not dados:
        raise ValueError("Planilha do sistema está vazia.")

    sistema = {}
    for linha in dados[1:]:
        if not linha or linha[0] is None:
            continue
        try:
            mat  = int(float(str(linha[0]).strip()))
            cod  = str(linha[2]).strip() if linha[2] is not None else ""
            nome = limpar_str(linha[3])
            ref  = moeda_para_float(linha[4])
            prov = moeda_para_float(linha[5])
            desc = moeda_para_float(linha[6])
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