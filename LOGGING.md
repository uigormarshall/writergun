# Logs locais (Writergun)

## Onde ficam

Por padrão, um arquivo **por dia** em:

```text
<diretório onde você rodou o comando>/.writergun/logs/writergun-YYYY-MM-DD.ndjson
```

Override:

- `WRITERGUN_LOG_DIR` — pasta absoluta ou relativa ao `cwd`.

## Formato

- **NDJSON**: uma linha = um objeto JSON (UTF-8).
- Esquema: `logging.schema.json` na raiz do projeto.

Campos obrigatórios por linha: `ts`, `level`, `event`, `msg`. Campo opcional: `meta` (objeto).

## Eventos úteis


| `event`            | Quando                                         |
| ------------------ | ---------------------------------------------- |
| `cli.command`      | Antes de cada subcomando                       |
| `shot.start`       | Início do `shot` (lista de alvos, modelo, web) |
| `shot.web.ok`      | `research.md` gravado com hits                 |
| `shot.web.empty`   | Busca sem trechos                              |
| `shot.web.error`   | Falha no web search                            |
| `shot.draft.ok`    | `draft.md` gerado                              |
| `shot.draft.error` | Falha no draft                                 |
| `shot.final.ok`    | `final.md` gerado                              |
| `shot.final.error` | Falha no final                                 |


## Variáveis de ambiente


| Variável              | Default | Significado                        |
| --------------------- | ------- | ---------------------------------- |
| `WRITERGUN_LOG`       | `1`     | `0`/`false` desliga arquivo de log |
| `WRITERGUN_LOG_LEVEL` | `info`  | `debug`, `info`, `warn`, `error`   |


## Ler no terminal

Últimas 20 linhas:

```bash
tail -n 20 .writergun/logs/writergun-$(date -u +%F).ndjson
```

Filtrar só `shot`:

```bash
grep '"event":"shot' .writergun/logs/writergun-$(date -u +%F).ndjson
```

