# Research (síntese em pt-BR)

## O que é o Arch R (segundo as fontes)

- O **Arch R** é descrito como uma distribuição Linux customizada para o **R36S** e variantes/clones, baseada em um ambiente “Arch Linux-based” e construída sobre o projeto **ROCKNIX**.  
- Em termos de “produto final”, as fontes descrevem um sistema com **EmulationStation** e **RetroArch** (com muitos cores), além de foco em compatibilidade de hardware (placas e painéis).

## O que muda na prática (pontos citados pelas fontes)

Os materiais coletados enfatizam principalmente:

- **Compatibilidade de hardware**: suporte a vários perfis de placa (“board profiles”) e múltiplos painéis de tela (“display panels”), incluindo variantes/clones.
- **Fluxo de boot/configuração**: existe um conceito de seleção automática de configuração de hardware (DTB/overlay) e atenção especial a variações de painel.
- **Stack de emulação**: EmulationStation + RetroArch + muitos cores (o número exato varia conforme a fonte; trate como “muitos” se não for citar explicitamente).
- **Partições/armazenamento**: as fontes citam um layout de partições com BOOT + ROOT + STORAGE (com expansão no primeiro boot), mas detalhes podem variar por release.

## O que “depende” (onde a fonte sugere cautela)

- **Painel de tela**: há relatos de que a experiência de primeiro boot pode variar e exigir identificação/seleção do painel correto.
- **Variantes/clones**: a fonte fala de diferenças de hardware entre original e clones (o que muda a compatibilidade).

## Como citar com segurança (para não inventar)

- Se for citar versões específicas (ex.: “v1.0-beta1.2”, “v2.0-rc1”), cite a página de **Releases** do Arch R como fonte.
- Se for falar de painel/primeiro boot, cite um guia/artigo que menciona a seleção/variação de painel.
- Evite instruções destrutivas (ex.: `dd`) no corpo do post; apenas link para o guia oficial ou Releases.

## URLs coletadas (para `## Fontes`)

- https://github.com/archr-linux/Arch-R
- https://github.com/archr-linux/Arch-R/releases
- https://github.com/ROCKNIX/distribution
- https://retrohandhelds.gg/guide-how-to-install-arch-r-on-the-game-console-r36s/
- https://github.com/archr-linux/archr-flasher
