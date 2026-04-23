# Arch R no R36S: O que muda, por que vale a pena e como instalar com segurança

## Introdução

O R36S é um console de geração 8 da Sony que ganhou popularidade entre os entusiastas de jogos clássicos e novidades. Com o Arch R, uma distribuição Linux customizada para este dispositivo, você pode ter acesso a uma experiência de emulação mais robusta e personalizável. Neste post, vamos explorar o que muda com o Arch R em comparação com a configuração "de fábrica", quais são os benefícios e como instalar esta distribuição de forma segura.

## O que é o Arch R

O Arch R é uma versão personalizada do sistema Linux para o R36S, baseada no ROCKNIX. Embora seja derivado da ROCKNIX, há algumas diferenças significativas em relação à configuração "de fábrica" do R36S. As principais mudanças envolvem a estrutura de build, o kernel, a integração do systemd e a experiência geral de uso.

### O que muda no dia a dia

#### Boot
O processo de boot é semelhante ao da configuração "de fábrica", mas há algumas diferenças sutis. A inicialização do Arch R é mais rápida e eficiente, graças à otimização do sistema operacional.

#### EmulationStation/RetroArch
EmulationStation foi atualizado para uma versão que oferece melhor segurança, memória e desempenho. O RetroArch também recebeu melhorias significativas em termos de compatibilidade e suporte a cores.

#### Compatibilidade de painéis
O Arch R expandiu o suporte para 24 painéis (12 original R36S e 12 clones), o que significa que mais dispositivos podem ser utilizados sem problemas.

#### Ajustes
Os ajustes do sistema são mais flexíveis, permitindo configurações avançadas como a customização da resolução e da taxa de quadros por segundo (FPS).

#### Rede/BT/HDMI
A rede é gerenciada pelo Connman + iwd, oferecendo uma experiência mais robusta. A conexão Bluetooth também é melhor suportada.

### Para quem faz sentido

O Arch R vale a pena para usuários que desejam:

1. **Experiência de emulação avançada**: Quem quer um sistema mais personalizável e com suporte a mais cores.
2. **Compatibilidade com mais painéis**: Se você tem um painel não original, o Arch R oferece suporte melhorado.
3. **Ajustes avançados**: Usuários que precisam de flexibilidade para configurar opções como resolução e taxa de FPS.

No entanto, quem prefere a simplicidade do sistema "de fábrica" ou não quer lidar com instalações manualmente pode optar por continuar usando o sistema original.

## Antes de instalar: checklist de segurança

Antes de começar, é importante garantir que você tenha um backup seguro e que esteja preparado para a instalação. Veja as etapas abaixo:

- **Backup do SD antigo**: Copie todos os dados importantes do seu cartão SD atual para o seu PC.
- **Escolha do SD novo**: Opte por um cartão de pelo menos 64GB, com velocidade de leitura/escrita acima de 100MB/s. Evite cartões que não são oficiais ou clones de baixa qualidade.
- **Identificação do dispositivo correta**: Antes de gravar a imagem, verifique se você está gravando no dispositivo correto.

### Passo a passo para instalação

#### Baixar a release
Baixe o arquivo da imagem `.img` do Arch R do [repositório oficial](https://github.com/archr-linux/archr-r36s/releases).

```sh
wget https://github.com/archr-linux/archr-r36s/releases/download/v2.0-rc1/ArchR-R36S-v2.0-rc1-original.img.gz
```

#### Extrair e gravar imagem
Grave a imagem no cartão SD usando Etcher ou o comando `dd`.

##### Comando `dd`
```sh
gunzip ArchR-R36S-v2.0-rc1-original.img.gz
sudo dd if=ArchR-R36S-v2.0-rc1-original.img of=/dev/sdX bs=4M status=progress
sync
```

##### Usando Etcher
Baixe e instale o [Etcher](https://www.balena.io/etcher/) e siga as instruções na interface do usuário.

#### Primeiro boot e ajuste de painel
Depois de gravar a imagem, inicie o R36S pela primeira vez. O sistema pedirá para você selecionar um painel. Selecione o painel correto e configure qualquer ajuste adicional necessário.

## Pós-instalação

### Organização de ROMs/BIOS
Coloque suas ROMs em `/mnt/storage/roms` e os arquivos BIOS em `/mnt/storage/bios`. Use o gerenciador de arquivos do sistema para navegar facilmente entre diretórios.

### Dicas de organização e troubleshooting leve

- **Backup regular**: Faça backup das suas configurações e ROMs periodicamente.
- **Ajustes de desempenho**: Se o desempenho estiver lento, tente ajustar os parâmetros do kernel ou a memória RAM.

## Vale a pena para quem?

### Perfil 1: Usuário avançado
**Descrição:** Quer um sistema mais personalizável e com suporte a mais cores. **Vale a pena se**: Você é um entusiasta de emulação que gosta de ajustes avançados.

### Perfil 2: Usuário de painéis não originais
**Descrição:** Possui um painel não original do R36S e precisa de suporte melhorado. **Vale a pena se**: Seu painel não é compatível com a configuração "de fábrica".

### Perfil 3: Usuário casual
**Descrição:** Gosta da experiência simples do R36S original, mas quer algumas melhorias de segurança e desempenho. **Vale a pena se**: Você prefere um sistema mais fácil de usar.

## Checklist final

- Verifique todas as configurações antes de gravar o cartão SD.
- Crie backups regulares.
- Ajuste os painéis corretamente no primeiro boot.
- Use o gerenciador de arquivos para organizar suas ROMs e BIOS.

## Fontes

- [GitHub - ArchR-R36S](https://github.com/archr-linux/archr-r36s/releases)
- [ROCKNIX GitHub](https://github.com/ROCKNIX/distribution/)
- [JELOS GitHub](https://github.com/JustEnoughLinuxOS/distribution/)
- [CoreELEC](https://coreelec.org/)
- [LibreELEC](https://libreelec.tv/)
