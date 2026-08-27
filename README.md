# Plataforma de Conferências — Bwise & Maçaneiro

Sistema de auditoria e conferência de folha de pagamento, construído para o
cliente **Maçaneiro** e operado pela **Bwise Contabilidade**. Automatiza
quatro rotinas de Departamento Pessoal que hoje seriam feitas manualmente em
Excel: cruzamento de rubricas, conferência de adiantamento salarial,
conferência de recibo de férias e conferência de empréstimos consignados.

| # | Módulo | O que faz |
|---|--------|-----------|
| 1 | [Auditoria de Rubricas](#1-auditoria-de-rubricas) | Cruza a planilha de lançamentos (folha "horizontal") com o extrato do sistema (folha "vertical", evento a evento), nos dois sentidos. |
| 2 | [Adiantamento Salarial](#2-adiantamento-salarial) | Recalcula o adiantamento esperado (40% do salário, com proporcionalidade de férias) e compara com o que foi efetivamente pago. |
| 3 | [Conferência de Férias](#3-conferência-de-férias) | Lê o PDF do recibo de férias, refaz o cálculo de férias, abono e médias de variáveis com reajustes salariais históricos. |
| 4 | [Conferência de Consignados](#4-conferência-de-consignados) | Cruza Emprega Brasil x folha e valida o limite legal de desconto de 35% do salário. |

## Stack

**Next.js 16 + React 19 + Tailwind 4** no frontend, **FastAPI** no backend
("Motor Bwise"). O frontend faz upload dos arquivos via `multipart/form-data`
para a API, que devolve os resultados em JSON (renderizados em tabela) e, sob
demanda, gera o relatório em Excel (`.xlsx`) para download.

> Este projeto já teve uma versão em Streamlit rodando em paralelo à atual.
> Ela foi descontinuada e removida do repositório — a plataforma hoje tem
> **uma única interface**, em Next.js + FastAPI. Toda a lógica de negócio que
> antes era compartilhada entre as duas telas permanece intacta em
> `services/`, agora consumida só pelo backend FastAPI.

## Arquitetura

```
┌───────────────────────────────┐
│  services/*.py                 │  ← lógica de negócio, sem nenhuma
│  (comparador, adiantamento,    │    dependência de framework web
│  ferias, consignados)          │    (só pandas / openpyxl / pdfplumber)
└───────────────┬─────────────── ┘
                │
┌───────────────▼────────────────┐         HTTP / JSON          ┌──────────────────────────────┐
│  FastAPI (app.py)               │ ◄────────────────────────►   │  Next.js (frontend/)          │
│  "Motor Bwise"                  │   multipart (upload) /       │  fetch() para cada rota        │
│  4 rotas POST de auditoria +    │   JSON (resultados) /        │  DataTable, MetricsRow,        │
│  3 rotas de exportação Excel    │   blob (.xlsx)                │  PassoAPasso, Sidebar, Topbar  │
└──────────────────────────────── ┘                               └──────────────────────────────┘
```

`core/utils.py` concentra as funções de limpeza de dados usadas pelos quatro
serviços (conversão de moeda BR, normalização de matrícula, leitura de CSV
com fallback de encoding, constantes de cor/fonte do Excel) — fonte única
para regras de parsing repetidas nos quatro módulos.

## Estrutura do projeto

```
bwise-conferencias/
├── app.py                           # backend FastAPI ("Motor Bwise") — ponto de entrada da API
├── core/
│   ├── __init__.py
│   └── utils.py                     # limpeza/parsing de dados compartilhado entre os serviços
├── services/                        # lógica de cálculo de cada módulo
│   ├── comparador.py                # módulo 1 — Rubricas
│   ├── adiantamento.py              # módulo 2 — Adiantamento Salarial
│   ├── ferias.py                    # módulo 3 — Férias (leitura de PDF)
│   └── consignados.py               # módulo 4 — Consignados
├── tests/
│   └── test_comparador.py           # suíte unittest do módulo de Rubricas (21 casos)
├── frontend/                        # site em Next.js 16 / React 19 / Tailwind 4 (Vercel)
│   ├── app/
│   │   ├── page.tsx                 # painel inicial
│   │   ├── rubricas/page.tsx
│   │   ├── adiantamento/page.tsx
│   │   ├── ferias/page.tsx
│   │   ├── consignados/page.tsx
│   │   └── components/
│   │       ├── Sidebar.tsx          # menu lateral recolhível
│   │       ├── Topbar.tsx           # cabeçalho com logos, título por rota
│   │       ├── DataTable.tsx        # tabela genérica: filtro por coluna, drag-to-reorder
│   │       ├── MetricsRow.tsx       # cards de indicadores (KPIs)
│   │       └── PassoAPasso.tsx      # accordion com o passo a passo de extração
│   └── lib/
│       ├── api.ts                   # URL base do backend (NEXT_PUBLIC_API_URL)
│       └── types.ts                 # tipos TS espelhando o retorno de services/
├── package.json                     # raiz: script "dev" sobe backend+frontend juntos (concurrently)
├── requirements.txt                 # dependências Python (FastAPI + libs de leitura/Excel/PDF)
└── DEPLOY.md                        # passo a passo de publicação gratuita (Render + Vercel)
```

## Como rodar localmente

```bash
# Terminal 1 — backend
pip install -r requirements.txt
uvicorn app:app --reload --port 8000

# Terminal 2 — frontend
cd frontend
npm install
npm run dev
```

Ou, a partir da raiz, `npm run dev` sobe os dois processos juntos (via
`concurrently`, ver `package.json`). Acesse `http://localhost:3000`. Sem
nenhuma variável de ambiente configurada, o frontend já aponta para
`http://127.0.0.1:8000` (`frontend/lib/api.ts`) e o backend já libera CORS
para `http://localhost:3000` (`app.py`). Veja [DEPLOY.md](DEPLOY.md) para
publicar de graça em Render (backend) + Vercel (frontend).

## Testes automatizados

```bash
python -m unittest tests.test_comparador -v
```

Cobre 21 cenários do módulo de Rubricas: comparação direta, divergência,
verificação inversa (sistema → lançamentos) nos seus vários casos de
não-alerta, colunas com múltiplos códigos somados, códigos repetidos
consolidados, leitura via XLSX e via CSV, e as regras de preenchimento do
nome do funcionário quando ele está ausente na Planilha de Lançamentos.

---

## Funcionamento detalhado dos módulos

### 1. Auditoria de Rubricas

**Arquivos de entrada:** Planilha de Lançamentos (.xlsx/.csv) + Planilha/Extrato
do Sistema — "Lista de Eventos de Recibos de Pagamento" (.xlsx/.csv).

**Lógica** (`services/comparador.py`):

- A **Planilha de Lançamentos** é "horizontal": cada coluna é um evento, e o
  nome da coluna carrega o(s) código(s) do evento entre parênteses — ex.:
  `"Bonus X (102) + Bonus Y (103)"` é uma coluna que soma dois códigos. Os
  códigos são extraídos por regex (`\((\d+)\)`) diretamente do cabeçalho.
- A **Planilha do Sistema** é "vertical": uma linha por (matrícula, evento).
  As colunas são localizadas por uma tabela de aliases tolerante a variações
  de nome (`matricula`, `cod evento`/`codigo evento do recibo`, `referencia`,
  `valor provento`/`provento sistema` etc.) — se nenhum alias bater, cai num
  fallback de 7 colunas fixas (posições 0–6). A coluna do **nome do
  funcionário é opcional**: se o cabeçalho não a identificar por texto, o
  sistema assume a coluna C (índice 2), que é onde o Extrato KMM
  normalmente a coloca.
- **Comparação**: para cada valor lançado, o sistema testa se ele bate (com
  tolerância de R$ 0,05) contra a Referência, o Provento ou o Desconto do
  evento correspondente no Sistema, nessa ordem — e marca `OK_REFERENCIA`,
  `OK_PROVENTO` ou `OK_DESCONTO`. Se nenhum bater, é `DIVERGENTE`. Se a
  matrícula/evento não existir no Sistema, é `NAO_ENCONTRADO`.
- **Verificação inversa (particularidade central do módulo):** depois da
  comparação direta, o sistema varre a Planilha do Sistema procurando
  eventos com valor efetivo que **não foram cobertos** pela comparação
  anterior — sinalizados como `AUSENTE_NOS_LANCAMENTOS`. Só gera esse alerta
  se o código do evento aparecer em **algum** cabeçalho da Planilha de
  Lançamentos (ou seja, um evento que a planilha nem rastreia não gera
  alerta) e se o valor no sistema não for zero. Isso pega o caso em que o
  funcionário existe, a coluna existe, mas o valor ficou zerado por engano.
- Colunas com múltiplos códigos (ex.: soma de dois eventos) são tratadas
  agregando os valores de todos os códigos encontrados antes de comparar —
  e cada código coberto é marcado como "processado" para não gerar
  falso-positivo na verificação inversa.
- Saída: tabela com 11 colunas + relatório Excel de duas abas (`CONFERÊNCIA`
  colorida por status + `RESUMO` com totais e percentual de acerto).

**Particularidades da tela:** além dos filtros por Status, Funcionário (nome
ou matrícula) e Evento, tem um modal dedicado para escolher quais eventos
"Ausentes nos Lançamentos" aparecem na tabela (evita que uma lista enorme de
ausências polua a visão). A `DataTable` genérica ainda suporta **filtro por
coluna estilo Excel** (dropdown com contagem por valor) e **reordenar
colunas arrastando o cabeçalho**.

### 2. Adiantamento Salarial

**Arquivos de entrada:** Lista de Eventos de Recibos de Pagamento (tipo
"Adiantamento", dois meses), Lista de Funcionários Ativos, Lista de Períodos
Aquisitivos e Concessivos de Férias.

**Lógica** (`services/adiantamento.py`):

- As três planilhas são lidas **por posição de coluna fixa** (não por nome de
  cabeçalho) — ex.: `df_at_raw.iloc[2:, [1, 4, 44, 51, 62, 64]]` extrai
  Matrícula, Nome, Data de Admissão, Categoria, Salário e a flag "Opta
  Adiantamento" da Lista de Ativos, pulando as duas primeiras linhas
  (cabeçalho duplo típico do exportador do sistema de origem). **Isso torna o
  módulo sensível ao layout exato do relatório exportado** — se o sistema de
  origem mudar a ordem das colunas, o mapeamento precisa ser atualizado aqui.
- O mês anterior e o mês atual são detectados automaticamente como os dois
  menores valores distintos da coluna `Mês` da planilha de eventos — a
  planilha **precisa conter exatamente esses dois meses**, senão o processamento
  falha com erro explícito.
- Só o evento de código **100** é considerado adiantamento; qualquer outro
  código presente na planilha de eventos marca a matrícula com
  "Contém evento diferente de 100" (mas ela ainda é processada).
  Aprendizes (categoria contendo "Aprendiz (Lei 10.097/2000)") não devem
  receber adiantamento algum — se receberem, é erro.
- **Regra de proporcionalidade de férias:** para cada matrícula, o sistema
  soma os dias de férias que caem dentro do mês (limitado a 30/mês) e calcula
  `dias_trabalhados = 30 - dias_ferias`. Se `dias_trabalhados < 15`, o
  adiantamento esperado é R$ 0,00 (não há direito no mês); caso contrário, o
  valor esperado é `(salário × 0,40) / 30 × dias_trabalhados`, comparado ao
  valor pago com tolerância de R$ 0,02.
- **Direito ao adiantamento por data de admissão:** um funcionário só tem
  direito ao adiantamento do mês se foi admitido até o dia 6 daquele mês (ou
  em mês anterior). Quem foi admitido depois do dia 6 é isento nesse mês —
  e se ainda assim recebeu, isso é sinalizado como erro
  ("Recebeu indevidamente").
- Funcionário cujo primeiro mês com direito é justamente o mês atual (ou
  seja, não tinha direito no mês anterior) recebe o status especial
  **"Funcionário Novo"** — fica isento da comparação com o mês anterior, já
  que não existe adiantamento anterior para comparar.
- O ano de cada mês (para calcular corretamente os dias de férias) é
  inferido pela **moda** (valor mais frequente) da coluna `Ano` daquele mês
  na planilha de eventos — com fallback hardcoded para `2026` se a inferência
  falhar (planilha vazia ou sem essa coluna).
- Saída: Excel de duas abas (`CONFERÊNCIA` + `RESUMO`), com totais globais
  pagos em cada mês e a diferença líquida entre eles.

### 3. Conferência de Férias

**Arquivos de entrada:** Recibo de Férias em **PDF** (documento oficial
emitido pelo sistema), Lista de Eventos do período aquisitivo, Histórico de
Cargos e Salários.

**Lógica** (`services/ferias.py`):

- O PDF é lido com `pdfplumber`, e os dados são extraídos por **expressões
  regulares** sobre o texto puro extraído (não há parsing estruturado de
  tabela): salário contratual, período aquisitivo (datas de início/fim),
  matrícula, e uma varredura linha a linha capturando qualquer linha no
  formato `CÓDIGO - DESCRIÇÃO   REFERÊNCIA   VALOR` para montar o dicionário
  de eventos do recibo. **Isso torna a extração dependente do layout exato do
  PDF gerado pelo sistema de origem** — uma mudança no template do recibo
  quebraria o parsing.
- **Conferência de base** (eventos 0189 "Férias Normais" e 0191 "Abono
  Pecuniário"): o valor esperado é `salário / 30 × referência do evento no
  PDF`, comparado ao valor que o próprio PDF declara.
- **Conferência de médias de variáveis** (eventos 0223 e 0224): é a parte
  mais elaborada do sistema. Para os 12 meses do período aquisitivo, o
  sistema soma os proventos de uma lista fixa de códigos de evento variáveis
  (`EVENTOS_MEDIAS`, 16 códigos como horas extras, comissões, adicionais
  etc.). Cada valor histórico é **reajustado para o salário atual** —
  usando o Histórico de Cargos e Salários, o sistema localiza qual era o
  salário vigente naquele mês/ano específico e aplica a regra:
  `valor_ajustado = (valor_original / salário_da_época) × salário_atual`
  (só corrige para cima, se o salário da época era **menor** que o atual — se
  era igual ou maior, mantém o valor original). A soma de todos os meses
  ajustados dividida por 12 é a "média mensal apurada", usada para recalcular
  os eventos 0223/0224 do mesmo jeito que 0189/0191.
- Todo valor calculado é arredondado com `ROUND_HALF_UP` (arredondamento
  "comercial", igual ao usado em folha de pagamento — diferente do
  arredondamento bancário padrão do Python).
- Não há geração de Excel neste módulo — o resultado é só exibido na tela
  (JSON estruturado com fórmula, valor calculado, valor do PDF e diferença
  para cada evento verificado).

### 4. Conferência de Consignados

**Arquivos de entrada:** relatório do "Emprega Brasil" (empréstimos
consignados autorizados externamente), Lista de Recibo de Pagamento, Lista
de Eventos de Recibos de Pagamento.

**Lógica** (`services/consignados.py`):

- Diferente dos outros módulos, o cruzamento entre o Emprega Brasil e a
  folha **não usa matrícula** (o Emprega Brasil não a fornece) — é feito por
  **nome normalizado**: maiúsculas, sem acento, sem caracteres não
  alfabéticos, espaços colapsados. Isso é uma fonte potencial de
  falso-negativo em caso de nomes grafados de forma diferente entre os dois
  sistemas (abreviações, nomes sociais, etc.).
- A Lista de Recibo de Pagamento é lida **por posição de coluna fixa**
  (Matrícula na 1, Nome na 2, Base INSS na 27, Valor INSS na 29, IRRF na 42),
  igual ao módulo de Adiantamento — mesma fragilidade a mudanças de layout
  do exportador.
- **Base de cálculo do limite:**
  `Base = Base de Cálculo do INSS − INSS − IRRF − Férias do período`
  (os eventos de férias, códigos 189/190/223, são somados à parte e
  subtraídos, pois não entram na margem consignável).
  `Limite de Desconto (35%) = Base × 0,35`.
- O valor "oficial" descontado em folha é a soma dos eventos de empréstimo
  (lista fixa de 20 códigos em `CODIGOS_EMPRESTIMO`) na Lista de Eventos.
  O sistema calcula duas divergências: **Emprega Brasil x Lista de Eventos**
  (o valor deveria ser o mesmo nos dois relatórios) e **Limite x Lista de
  Eventos** (o valor descontado não pode ultrapassar os 35% da base).
  Tolerância de R$ 0,05 para ambas.
- Status `"Errado"` se qualquer uma das duas divergências for maior que a
  tolerância; `"Certo"` caso contrário.
- Saída: Excel de duas abas (`CONFERÊNCIA` + `RESUMO` com total de
  divergências em valor financeiro e quantidade de limites ultrapassados).

---

## Particularidades e pontos de atenção gerais

- **`services/` é a única fonte de verdade para regras de negócio.**
  `app.py` (rotas FastAPI) e `frontend/app/*` (telas Next.js) só enviam
  arquivos, recebem o JSON e formatam a exibição — nenhum cálculo é
  duplicado na API nem no frontend. Qualquer correção de regra de negócio
  deve ser feita uma única vez em `services/`.
- **Tolerâncias monetárias:** a maioria das comparações usa tolerância de
  R$ 0,05 (rubricas, consignados) ou R$ 0,02 (adiantamento) para absorver
  arredondamento de centavos — não são bugs, são limiares deliberados.
- **Conversão de moeda BR resiliente** (`moeda_para_float` em
  `core/utils.py`): trata `"R$ 1.234,56"`, `"1234,56"`, `"1234.56"`, números
  já convertidos e valores nulos/`NaN`, todos retornando `float` de forma
  segura (nunca lança exceção para o chamador).
- **Leitura de CSV com fallback de encoding** (`ler_csv_com_fallback`):
  tenta `utf-8-sig` primeiro; se falhar (comum em exportações de sistemas de
  RH que usam Windows-1252/Latin-1, com acentos em nomes e cargos), refaz a
  leitura em `latin1`, que aceita qualquer byte sem lançar erro.
- **Fragilidade por posição de coluna:** os módulos de Adiantamento,
  Consignados (Lista de Recibo) e Férias (parsing do PDF) dependem de
  layouts específicos dos relatórios exportados pelo sistema de folha de
  origem (posições fixas de coluna, ou regex sobre o texto do PDF). O módulo
  de Rubricas, em contraste, é o mais resiliente: identifica colunas por
  nome de cabeçalho (com tabela de aliases) em vez de posição fixa.
- **Sem persistência/banco de dados.** Todo processamento é feito em memória
  a partir do upload; nada é salvo em disco ou banco entre requisições. Os
  resultados ficam em estado de componente React no frontend — perdidos ao
  recarregar a página.
- **CORS controlado por variável de ambiente** (`FRONTEND_ORIGINS` em
  `app.py`): em desenvolvimento local não precisa configurar nada
  (`localhost:3000` já é liberado); em produção, é obrigatório apontar para
  a URL pública do Vercel, senão o navegador bloqueia as chamadas.
- **Exportação Excel a partir do que está na tela, não do resultado bruto:**
  as rotas `/excel` do backend recebem o conjunto de resultados **já
  filtrado** pela interface, e recalculam os totais do resumo em cima desse
  subconjunto — assim o arquivo baixado sempre reflete exatamente o que o
  usuário está vendo na tela, não o total original da conferência completa.
- **Ano fixo de fallback (`2026`) no módulo de Adiantamento:** se a coluna
  `Ano` da planilha de eventos estiver ausente ou vazia, o sistema assume o
  ano 2026 como padrão — vale revisar esse valor manualmente se o sistema
  seguir em uso além desse ano.
