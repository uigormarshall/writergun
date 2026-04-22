# Writergun 🔫

CLI em **TypeScript** para automatizar a criação de posts em **Markdown** a partir de um `context.md`, usando **Ollama** (modelos locais).

- **Input**: `context.md` (rascunho/brief humano)
- **Output 1**: `draft.md` (escrita)
- **Output 2**: `final.md` (revisão)

## Por que isso existe

O Writergun te dá um fluxo simples e repetível para transformar anotações em um post publicável, mantendo tudo em arquivos Markdown dentro de pastas por publicação.

## Requisitos

- **Node.js v20+** *ou* **Bun**
- **Ollama** instalado e rodando

### Modelos (recomendação viável)

Para o pipeline de **Escrita + Revisão**, o projeto recomenda usar **um único modelo** para as duas fases:

- **Modelo**: `qwen2.5:7b`
- **Parâmetros**:
  - `num_ctx`: `8192`
  - `temperature`: `0.7` (escrita) / `0.3` (revisão)

Baixe o modelo:

```bash
ollama pull qwen2.5:7b
```

## Configuração via `.env`

O Writergun lê um arquivo `.env` no diretório onde você roda o comando (opcional).
Copie o exemplo:

```bash
cp .env.example .env
```

Variáveis úteis:

- `WRITERGUN_ROOT`: pasta raiz dos targets (default: `targets`)
- `WRITERGUN_LOCALE` (ou `WRITERGUN_LANG`): idioma do `draft`/`final` (default: `pt-BR`)
- `OLLAMA_HOST`: host do servidor do Ollama (default: `http://127.0.0.1:11434`)
- `OLLAMA_API_KEY`: necessário para `webSearch/webFetch` (se você habilitar `WRITERGUN_WEB=true`)
- `WRITERGUN_MODEL`: modelo default do comando `shot`
- `WRITERGUN_NUM_CTX`: `num_ctx` default do `shot`
- `WRITERGUN_TIMEOUT_MS`: timeout default por chamada ao Ollama (ms)
- `WRITERGUN_WEB`: habilita pesquisa automática via webSearch no `shot` (`true/false`)
- `WRITERGUN_WEB_MAX_RESULTS`: máximo de resultados do webSearch
- `WRITERGUN_WEB_TIMEOUT_MS`: timeout do webSearch (ms)
- `WRITERGUN_MIN_WORDS`: tamanho alvo do post (default: `1200`)
- `WRITERGUN_PARAGRAPH_SENTENCES`: guia de tamanho de parágrafo (default: `3–6`)
- `WRITERGUN_CITATIONS`: inclui seção `## Fontes` no final com links (default: `true`)

## Hardware (referência)

Esta configuração foi escolhida para ser previsível em máquinas como:

- **RAM**: 32 GB DDR4
- **GPU**: AMD **RX 6600 (8 GB VRAM)**

Em 8 GB de VRAM, modelos 12B podem ter comportamento mais variável (offload para CPU e maior latência). Um 7B bem instruível tende a ser um “ponto doce” para velocidade/qualidade nesse perfil.

## Estrutura de pastas

A CLI opera dentro de uma pasta raiz (ex.: `targets/`). Cada post é uma subpasta:

```plaintext
/targets
  ├── [nome-da-materia]
  │   ├── context.md   <-- (Input)
  │   ├── draft.md     <-- (Output 1)
  │   └── final.md     <-- (Output 2)
```

## Comandos

- `**writergun list**`
  - Lista as pastas e status (**PENDENTE**, **DRAFT**, **FINAL**) e data de modificação (tabela com `cli-table3`)
- `**writergun aim <name>`**
  - Cria a pasta do post e um template de `context.md`
- `**writergun shot <name>`**
  - Executa o pipeline:
    - verifica `context.md`
    - gera `draft.md`
    - gera `final.md`
- `**writergun shot --all`**
  - Executa o pipeline em todas as pastas com `context.md` e sem `final.md`
- `**writergun clean <name>**`
  - Remove `draft.md` e `final.md` para reiniciar um “tiro”
- `**writergun guide <name>**`
  - Assistente interativo para montar `context.md` (melhora coerência do texto)
- `**writergun research <name>**`
  - Faz `webSearch` e salva `research.md` para enriquecer o contexto

## Notas de uso

- Se o Ollama não estiver rodando, o `shot` deve falhar com uma mensagem clara.
- O status do post pode ser inferido pelos arquivos existentes:
  - **PENDENTE**: tem `context.md`, não tem `draft.md`/`final.md`
  - **DRAFT**: tem `draft.md`, não tem `final.md`
  - **FINAL**: tem `final.md`

## Desenvolvimento

Especificação técnica: `description.md`.

### Rodar globalmente (sem `node dist/...`)

Dentro do projeto:

```bash
npm install
npm run build
sudo npm link
```

Depois você pode chamar:

```bash
writergun --help
writergun shot <name>
```

