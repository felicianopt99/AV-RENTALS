# **App Name**: AV Rentals

## Core Features:

- Equipment Entry: Adicionar novo equipamento com Nome, descrição, Categoria e subcategoria, Quantidade disponível, Estado (bom, danificado, manutenção) e Localização física
- Equipment Listing: Visualização em cartões com ícones, agrupados por categoria. Pesquisa por nome. Filtros por categoria e estado
- Category Management: Criar, editar e remover categorias e subcategorias
- Rental Management: Criar alugueres com Equipamento selecionado, Datas de início e fim, Local do evento, Cliente (nome ou empresa) e Responsável interno
- Calendar View: Integração com `react-big-calendar` ou `fullcalendar`. Exibir alugueres ativos por dia/mês. Equipamento alugado com cor de fundo especial
- Conflict Detection: Deteção de sobreposição de datas. Alerta visual em vermelho para conflitos de disponibilidade

## Style Guidelines:

- Background principal: #121212 (quase preto, estilo YouTube dark)
- Cards/elementos UI: #1E1E1E (cinza escuro para destacar conteúdos)
- Texto primário: #FFFFFF (branco)
- Texto secundário: #B0B0B0 (cinza claro)
- Cor principal: #8AB4F8 (azul claro – estilo Google dark mode)
- Cor de destaque (accent): #BB86FC (roxo vivo – interações)
- Cor de alerta: #FF6B6B (vermelho suave para conflitos)
- Fonte: sans-serif moderna e legível (ex: Inter, Roboto, DM Sans)
- Cartões com cantos arredondados e sombras suaves
- Ícones visuais por categoria
- Transições suaves
- Compatível com dark mode puro