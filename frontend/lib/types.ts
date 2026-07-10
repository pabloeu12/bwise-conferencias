/**
 * Tipos compartilhados entre as páginas do frontend. Mantidos num só lugar
 * para refletir exatamente o que o backend (services/*.py) devolve.
 */

/** Uma linha de resultado genérica (Rubricas, Adiantamento, Consignados).
 * As colunas variam por módulo, então os valores ficam como `unknown` —
 * quem exibe (DataTable) já sabe formatar texto, número e moeda com segurança. */
export type LinhaResultado = Record<string, unknown>;

export interface MetaAdiantamento {
  mes_ant: number;
  mes_atu: number;
  tot_ant: number;
  tot_atu: number;
  total_ativos: number;
  total_corretos: number;
  total_errados: number;
  total_isentos: number;
}

export interface MetaConsignados {
  total_funcionarios: number;
  total_corretos: number;
  total_errados: number;
  valor_divergente: number;
  limites_ultrapassados: number;
}

export interface VerificacaoFerias {
  evento: string;
  formula: string;
  calculado: number;
  pdf: number;
  diferenca: number;
}

export interface ResultadoFerias {
  matricula: number | string;
  salario_contratual: number;
  periodo_aquisitivo: string;
  verificacoes_base: VerificacaoFerias[];
  detalhes_medias: string[];
  total_proventos_atualizados: number;
  media_mensal_apurada: number;
  verificacoes_medias: VerificacaoFerias[];
}
