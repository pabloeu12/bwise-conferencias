"""
tests/test_comparador.py
─────────────────────────
Testes automatizados da verificação bidirecional de rubricas
(services/comparador.py), cobrindo os cenários exigidos:

 1. Evento correto nas duas planilhas               -> OK_*
 2. Evento divergente                                -> DIVERGENTE
 3. Evento somente nos lançamentos                   -> NAO_ENCONTRADO
 4/5/6/7. Verificação inversa (sistema -> lançamentos) e casos de não-alerta
 8. Coluna com vários códigos                        -> soma sem falso alerta
 9. Código repetido no sistema                       -> soma consolidada
10. Formatos de arquivo (XLSX e CSV)
11. Nome do funcionário obtido via Planilha do Sistema quando ausente nos lançamentos

Executar com:  .venv\\Scripts\\python -m unittest tests.test_comparador -v
"""

import os
import sys
import unittest
from io import BytesIO

from openpyxl import Workbook

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from services.comparador import (
    executar_comparacao,
    normalizar_codigo_evento,
)


class ArquivoFake(BytesIO):
    """Simula um arquivo de upload do Streamlit (precisa de atributo .name)."""

    def __init__(self, data: bytes, nome: str):
        super().__init__(data)
        self.name = nome


def _xlsx(linhas) -> ArquivoFake:
    wb = Workbook()
    ws = wb.active
    for linha in linhas:
        ws.append(linha)
    buf = BytesIO()
    wb.save(buf)
    return ArquivoFake(buf.getvalue(), "teste.xlsx")


def _csv(linhas) -> ArquivoFake:
    texto = "\n".join(",".join(str(v) for v in linha) for linha in linhas)
    return ArquivoFake(texto.encode("utf-8"), "teste.csv")


# Dataset combinado cobrindo os cenários 1, 2, 3, 5, 6, 7, 8 e 9 de uma vez.
LANCAMENTOS = [
    ["Matricula", "Nome", "Salario Base (100)", "Hora Extra (101)",
     "Comissao (105)", "Bonus X (102) + Bonus Y (103)", "Adicional Noturno (106)",
     "Adicional Consolidado (250)"],
    [1, "FUNCIONARIO UM",   1000.00, 0,       0,      0,      0,   0],
    [2, "FUNCIONARIO DOIS", 0,       500.00,  0,      0,      0,   0],
    [3, "FUNCIONARIO TRES", 0,       0,       300.00, 0,      0,   0],
    [6, "FUNCIONARIO SEIS", 0,       0,       0,      0,      0,   0],
    [8, "FUNCIONARIO OITO", 0,       0,       0,      700.00, 0,   0],
]

SISTEMA = [
    ["Matricula", "Nome Evento", "Cod Evento", "Referencia", "Valor Provento", "Valor Desconto"],
    [1, "Salario Base",           100, 1000.00, 0,      0],
    [2, "Hora Extra",             101, 0,       450.00, 0],
    [6, "Adicional Noturno",      106, 200.00,  0,      0],
    [6, "Zerado Total",           107, 0,       0,      0],
    [8, "Bonus X",                102, 300.00,  0,      0],
    [8, "Bonus Y",                103, 400.00,  0,      0],
    # Código 200 não existe em nenhum título da Planilha de Lançamentos:
    # não deve gerar alerta de ausência (cenário 4/5).
    [9, "Adicional Especial",     200, 100.00,  0,      0],
    [9, "Adicional Especial",     200, 150.00,  0,      0],
    # Código 250 existe no título "Adicional Consolidado (250)" e aparece
    # duas vezes no sistema: deve consolidar em um único resultado (cenário 9).
    [10, "Adicional Consolidado", 250, 100.00,  0,      0],
    [10, "Adicional Consolidado", 250, 150.00,  0,      0],
    # Matrícula 1 existe na Planilha de Lançamentos, mas este evento (999) não
    # está em nenhum título dela: também não deve gerar alerta de ausência.
    [1, "Bonus Fora do Padrao",   999, 0,       80.00,  0],
]


class TestVerificacaoBidirecional(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.resultados = executar_comparacao(_xlsx(LANCAMENTOS), _xlsx(SISTEMA))
        cls.por_chave = {(r["Matrícula"], str(r["Código(s) Evento"])): r for r in cls.resultados}

    # 1. Evento correto nas duas planilhas
    def test_cenario1_evento_correto(self):
        r = self.por_chave[(1, "100")]
        self.assertEqual(r["Status"], "OK_REFERENCIA")

    # 2. Evento divergente
    def test_cenario2_evento_divergente(self):
        r = self.por_chave[(2, "101")]
        self.assertEqual(r["Status"], "DIVERGENTE")

    # 3. Evento somente nos lançamentos
    def test_cenario3_somente_nos_lancamentos(self):
        r = self.por_chave[(3, "105")]
        self.assertEqual(r["Status"], "NAO_ENCONTRADO")

    # 4/5. Matrícula somente no sistema, mas com código que não existe em
    # nenhum título da Planilha de Lançamentos -> não gera alerta de ausência
    def test_cenario4_e_5_matricula_somente_no_sistema_sem_titulo_correspondente(self):
        self.assertNotIn((9, "200"), self.por_chave)

    # Mesma regra vale mesmo quando a matrícula existe na Planilha de
    # Lançamentos: o código do evento é que precisa estar em algum título.
    def test_codigo_sem_titulo_nao_gera_alerta_mesmo_com_matricula_existente(self):
        self.assertNotIn((1, "999"), self.por_chave)

    # 6. Coluna existe no cabeçalho, mas funcionário está zerado
    def test_cenario6_coluna_zerada_no_lancamento(self):
        r = self.por_chave[(6, "106")]
        self.assertEqual(r["Status"], "AUSENTE_NOS_LANCAMENTOS")
        self.assertAlmostEqual(r["Referência Sistema"], 200.00)
        self.assertIn("sem valor informado", r["Observação"].lower())

    # 7. Evento completamente zerado no sistema -> não gera alerta
    def test_cenario7_evento_zerado_nao_gera_alerta(self):
        self.assertNotIn((6, "107"), self.por_chave)

    # 8. Coluna com vários códigos -> soma correta, sem falso alerta inverso
    def test_cenario8_multi_codigo_soma_correta(self):
        r = self.por_chave[(8, "102+103")]
        self.assertEqual(r["Status"], "OK_REFERENCIA")
        self.assertAlmostEqual(r["Referência Sistema"], 700.00)
        # códigos 102 e 103 não podem gerar alerta de ausência
        self.assertNotIn((8, "102"), self.por_chave)
        self.assertNotIn((8, "103"), self.por_chave)

    # 9. Código repetido no sistema -> soma consolidada em um único resultado
    def test_cenario9_codigo_repetido_consolidado(self):
        ocorrencias = [r for r in self.resultados if r["Matrícula"] == 10 and r["Código(s) Evento"] == "250"]
        self.assertEqual(len(ocorrencias), 1)
        self.assertAlmostEqual(ocorrencias[0]["Referência Sistema"], 250.00)

    def test_total_de_linhas_sem_duplicidade(self):
        # 4 linhas do sentido lançamentos->sistema + 2 da verificação inversa
        # (mat 6/cod 106 e mat 10/cod 250; mat 9/cod 200 fica de fora por não
        # ter título correspondente na Planilha de Lançamentos)
        self.assertEqual(len(self.resultados), 6)


class TestFormatosDeArquivo(unittest.TestCase):
    """10. Mesmo resultado ao processar XLSX ou CSV."""

    LANC_SIMPLES = [
        ["Matricula", "Nome", "Salario Base (100)"],
        [1, "FUNCIONARIO UM", 1000.00],
    ]
    SIST_SIMPLES = [
        ["Matricula", "Nome Evento", "Cod Evento", "Referencia", "Valor Provento", "Valor Desconto"],
        [1, "Salario Base", 100, 1000.00, 0, 0],
    ]

    def test_xlsx(self):
        resultados = executar_comparacao(_xlsx(self.LANC_SIMPLES), _xlsx(self.SIST_SIMPLES))
        self.assertEqual(len(resultados), 1)
        self.assertEqual(resultados[0]["Status"], "OK_REFERENCIA")

    def test_csv(self):
        resultados = executar_comparacao(_csv(self.LANC_SIMPLES), _csv(self.SIST_SIMPLES))
        self.assertEqual(len(resultados), 1)
        self.assertEqual(resultados[0]["Status"], "OK_REFERENCIA")


class TestNomeFuncionarioViaSistema(unittest.TestCase):
    """O nome do funcionário deve ser preenchido a partir da Planilha do Sistema
    quando a matrícula não existir (ou estiver sem nome) na Planilha de Lançamentos,
    desde que o Sistema tenha uma coluna reconhecível de nome de funcionário."""

    LANC = [
        ["Matricula", "Nome", "Salario Base (100)", "Comissao Especial (300)"],
        [1, "FUNCIONARIO UM", 1000.00, 0],
    ]
    SIST = [
        ["Matricula", "Funcionario", "Nome Evento", "Cod Evento",
         "Referencia", "Valor Provento", "Valor Desconto"],
        [1, "FUNCIONARIO UM DA FOLHA", "Salario Base", 100, 1000.00, 0, 0],
        [99, "FUNCIONARIO NOVENTA E NOVE", "Comissao Especial", 300, 500.00, 0, 0],
    ]

    @classmethod
    def setUpClass(cls):
        cls.resultados = executar_comparacao(_xlsx(cls.LANC), _xlsx(cls.SIST))
        cls.por_mat = {r["Matrícula"]: r for r in cls.resultados}

    def test_nome_preenchido_via_sistema_quando_ausente_nos_lancamentos(self):
        r = self.por_mat[99]
        self.assertEqual(r["Status"], "AUSENTE_NOS_LANCAMENTOS")
        self.assertEqual(r["Funcionário"], "FUNCIONARIO NOVENTA E NOVE")

    def test_nome_dos_lancamentos_tem_prioridade_quando_disponivel(self):
        r = self.por_mat[1]
        self.assertEqual(r["Funcionário"], "FUNCIONARIO UM")


class TestNormalizacaoCodigoEvento(unittest.TestCase):
    """Normalização de código: numérico, texto, decimal .0, espaços e vazio."""

    def test_codigo_inteiro(self):
        self.assertEqual(normalizar_codigo_evento(100), "100")

    def test_codigo_float_terminado_em_zero(self):
        self.assertEqual(normalizar_codigo_evento(100.0), "100")

    def test_codigo_texto_decimal(self):
        self.assertEqual(normalizar_codigo_evento("100.0"), "100")

    def test_codigo_com_espacos(self):
        self.assertEqual(normalizar_codigo_evento("  101  "), "101")

    def test_codigo_vazio(self):
        self.assertEqual(normalizar_codigo_evento(None), "")
        self.assertEqual(normalizar_codigo_evento(""), "")


if __name__ == "__main__":
    unittest.main()
