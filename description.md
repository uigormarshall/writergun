# 🔫 Writergun: Especificação Técnica (V2)

## 1. Descrição do Projeto

O **Writergun** é uma ferramenta de linha de comando (**CLI**)
desenvolvida em **TypeScript** para automatizar a criação de conteúdo
para blogs.

Ele utiliza o **Ollama** para processar modelos de linguagem locais,
transformando rascunhos humanos e contextos em posts refinados e
revisados, prontos para publicação em **Markdown**.

---

## 2. Estrutura de Pastas (Target)

A CLI deve monitorar e operar dentro de uma pasta raiz de projetos. Cada
publicação é uma subpasta:

```plaintext
/targets
  ├── [nome-da-materia]
  │   ├── context.md   <-- (Input: O que o humano escreveu/planejou)
  │   ├── draft.md     <-- (Output 1: Gerado pelo modelo de escrita)
  │   └── final.md     <-- (Output 2: Revisado pelo modelo de crítica)
```

---

## 3. Comandos da CLI

---

  Comando                         Descrição

---

  `writergun list`                Exibe uma tabela (usando `cli-table3`)
                                  com as pastas, status (**PENDENTE**,
                                  **DRAFT**, **FINAL**) e data de
                                  modificação

  `writergun aim <name>`          Cria a pasta do projeto e um template
                                  de `context.md` pronto para
                                  preenchimento

  `writergun shot <name>`         O gatilho. Executa o pipeline de
                                  Escrita + Revisão

  `writergun shot --all`          Dispara o pipeline para todas as pastas
                                  que possuem `context.md` mas não
                                  possuem `final.md`

  `writergun clean <name>`        Remove os arquivos `draft.md` e
                              `final.md` para reiniciar um "tiro"

---

---

## 4. Estratégia de Modelos

- **Modelo Base (recomendado p/ 8GB VRAM):** `qwen2.5:7b`
- **Escrita (The Bullet):** `qwen2.5:7b` (prompt de escrita, mais criativo)
- **Revisão (The Polish):** `qwen2.5:7b` (prompt de revisor, mais conservador)

> Nota: usar **um único modelo** para as duas fases reduz downloads e tende a
> ser mais previsível/rápido em GPUs com **8GB de VRAM** (ex.: RX 6600),
> evitando offload imprevisível para CPU.

---

## 5. Requisitos de Implementação

### Core Tecnológico

- TypeScript (Strict Mode)
- Node.js (v20+) ou Bun
- commander.js
- ollama (client JS)

### Pipeline `shot`

1. Verificar `context.md`
2. Gerar `draft.md`
3. Gerar `final.md`

### Parâmetros

- num_ctx: 8192\
- temperature: 0.7 / 0.3

### Feedback

- ora (status)
- chalk (cores)

