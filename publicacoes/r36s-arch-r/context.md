# O que é Arch-r e o que ele muda no R36S?

O **Arch-r** é uma distribuição Linux customizada projetada especificamente para a série R36S de consoles portáteis. Ele se baseia em cima do projeto [ROCKNIX](https://github.com/ROCKNIX/distribution), mas oferece um ambiente com a arquitetura Arch Linux, proporcionando uma plataforma robusta para amantes de jogos retrô.

A principal vantagem do Arch-r é que ele suporta 16 perfis de placa (board profiles) e mais de 20 painéis de exibição (display panels), garantindo compatibilidade com diversos tipos de hardware. Além disso, ele vem pré-instalado com o **EmulationStation** e mais de 18 núcleos de emulação.

O Arch-r oferece um conjunto de recursos impressionantes:

- **Suporte à bateria**: Monitoramento da capacidade e avisos LED para a saúde da bateria.
- **Saída HDMI**: Capacidade de saída de áudio e vídeo via HDMI.
- **Áudio USB**: Suporte ao uso de dispositivos de áudio USB.
- **Rede de jogos locais e remotos**.
- **Controle de desempenho**: Fornecimento fino do controle da bateria e desempenho.
- **Suporte Bluetooth**: Suporte para alto-falantes e controles via Bluetooth.

---

# Por que vale a pena?

Se você quer uma experiência de jogo retrô mais estável, bonita e funcional, Arch-r é uma opção incrível. Ele oferece uma combinação perfeita de estabilidade, desempenho e personalização.

### Passo 1: Preparação

Antes de começar a instalar o Arch-r em seu R36S, você precisa reunir alguns recursos:

- Um cartão microSD de pelo menos 8 GB.
- Um leitor USB que suporta transferência de arquivos para SD.
- Tempo suficiente para realizar a instalação e configuração.
- Bateria recarregável do console.

### Passo 2: Backup

É crucial fazer um backup do seu cartão microSD atual antes de começar. Isso garantirá que você possa restaurar sua configuração original em caso de problemas durante o processo.

1. **Entrada no modo Flasher**: Certifique-se de que o R36S esteja ligado e conectado a uma fonte USB.
2. **Início da cópia do cartão SD**:
   ```bash
   sudo dd if=/dev/sdX of=archr_backup.img bs=4M status=progress
   sync
   ```

### Passo 3: Preparação do Cartão microSD

Agora que você tem um backup, prepare o novo cartão SD para a instalação.

1. **Baixar as imagens**: Você pode baixar as imagens mais recentes diretamente do GitHub.
   ```bash
   wget https://github.com/archr-linux/Arch-R/releases/download/v1.0.0/ArchR-R36S-*.img.xz
   ```

2. **Descomprimir a imagem**:
   ```bash
   xz -d ArchR-R36S-*.img.xz
   ```

3. **Gravar a imagem no cartão SD**:
   ```bash
   sudo dd if=ArchR-R36S-*.img of=/dev/sdX bs=4M status=progress
   sync
   ```

### Passo 4: Primeiro Boot e Configuração Inicial

1. **Inserir o cartão SD no R36S**.
2. **Ligar o console**: O primeiro boot iniciará o processo de instalação.

Durante a inicialização, o sistema automaticamente seleciona os perfis corretos (board DTB) com base na placa do seu R36S.

### Passo 5: Organização de ROMs e BIOS

Agora que o Arch-r está instalado, você pode começar a organizar suas ROMs e BIOS. Crie as seguintes pastas no diretório `/storage`:

```bash
mkdir -p /storage/roms
mkdir -p /storage/bios
```

### Passo 6: Ajustes Finais

Para personalizar ainda mais sua experiência, você pode ajustar o tema, hotkeys, desempenho e shaders se houver.

1. **Tema**: Edite os arquivos de configuração do EmulationStation.
2. **Hotkeys**: Personalize as combinações de teclas no arquivo `config.txt`.
3. **Desempenho**: Configure o gerenciamento da bateria e a velocidade do processador.

### Passo 7: Problemas comuns e soluções rápidas

Se você encontrar problemas durante o processo, aqui estão algumas soluções rápidas:

- **Problema de inicialização**: Verifique se os perfis (board DTB) foram selecionados corretamente.
- **Problema de áudio**: Certifique-se de que a saída de áudio esteja configurada corretamente no EmulationStation.

### Passo 8: Checklist Final

Aqui está um checklist final para garantir que tudo esteja funcionando perfeitamente:

1. **Verificar o carregamento da bateria**.
2. **Testar a saída HDMI e USB de áudio**.
3. **Iniciar o EmulationStation e verificar se todas as ROMs foram detectadas corretamente**.

---

# Vale a pena para quem?

O Arch-r é ideal para:

- Usuários que querem uma experiência mais estável e personalizável em seu R36S.
- Amantes de jogos retrô que buscam uma interface moderna e funcional.
- Enthusiastes de hardware e sistemas operacionais customizados.

Se você se enquadra nessa descrição, vale a pena dar o Arch-r uma chance!

---

## Fontes

- [Arch-r GitHub](https://github.com/archr-linux/Arch-R)
- [ROCKNIX Documentation](https://github.com/ROCKNIX/distribution)
