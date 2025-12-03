const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const fixes = [
    { source: 'Quick Actions', translation: 'Ações rápidas' },
    { source: 'Quotes', translation: 'Orçamentos' },
    { source: 'Clear', translation: 'Limpar' },
    { source: 'Add Fee', translation: 'Adicionar taxa' },
    { source: 'Are you sure?', translation: 'Tem a certeza?' },
    { source: 'Filters', translation: 'Filtros' },
    { source: 'Rentals Calendar', translation: 'Calendário de alugueres' },
    { source: 'Equipment & Inventory', translation: 'Equipamento e Inventário' },
    { source: 'Save', translation: 'Guardar' },
    { source: 'Cancel', translation: 'Cancelar' },
    { source: 'Edit', translation: 'Editar' },
    { source: 'Delete', translation: 'Eliminar' },
    { source: 'Name', translation: 'Nome' },
    { source: 'Description', translation: 'Descrição' },
    { source: 'Price', translation: 'Preço' },
    { source: 'Quantity', translation: 'Quantidade' },
    { source: 'Total', translation: 'Total' },
    { source: 'Status', translation: 'Estado' },
    { source: 'Date', translation: 'Data' },
    { source: 'Actions', translation: 'Ações' },
    { source: 'Confirm', translation: 'Confirmar' },
    { source: 'Close', translation: 'Fechar' },
    { source: 'Back', translation: 'Voltar' },
    { source: 'Next', translation: 'Próximo' },
    { source: 'Previous', translation: 'Anterior' },
    { source: 'Overview', translation: 'Visão Geral' },
    { source: 'Recent Activity', translation: 'Atividade Recente' },
    { source: 'Reports', translation: 'Relatórios' },
    { source: 'Apply', translation: 'Aplicar' },
    { source: 'Loading', translation: 'A carregar...' },
    { source: 'No results', translation: 'Sem resultados' },
    { source: 'Try again', translation: 'Tentar novamente' }
  ];

  try {
    let created = 0;
    let updated = 0;
    let skipped = 0;
    
    console.log('Starting translation fixes...');
    
    for (const { source, translation } of fixes) {
      try {
        // Check if translation already exists
        const existing = await p.translation.findUnique({
          where: {
            sourceText_targetLang: {
              sourceText: source,
              targetLang: 'pt'
            }
          }
        });

        if (existing) {
          // Update existing translation if different
          if (existing.translatedText !== translation) {
            await p.translation.update({
              where: { id: existing.id },
              data: { 
                translatedText: translation,
                isAutoTranslated: false // Mark as manual translation
              }
            });
            console.log(`✓ Updated: "${source}" -> "${translation}"`);
            updated++;
          } else {
            console.log(`- No change: "${source}"`);
            skipped++;
          }
        } else {
          // Create new translation
          await p.translation.create({
            data: {
              sourceText: source,
              targetLang: 'pt',
              translatedText: translation,
              isAutoTranslated: false, // Mark as manual translation
              status: 'approved'
            }
          });
          console.log(`+ Created: "${source}" -> "${translation}"`);
          created++;
        }
      } catch (error) {
        console.error(`Error processing "${source}":`, error);
      }
    }

    console.log('\n--- Translation Fixes Summary ---');
    console.log(`Total fixes: ${fixes.length}`);
    console.log(`Created: ${created}`);
    console.log(`Updated: ${updated}`);
    console.log(`Skipped (no changes): ${skipped}`);
    
  } catch (error) {
    console.error('Error in translation fixes script:', error);
    process.exit(1);
  } finally {
    await p.$disconnect();
  }
}

main();
