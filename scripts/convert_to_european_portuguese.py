#!/usr/bin/env python3
"""
Portuguese Variant Converter
============================

Script to convert existing Brazilian Portuguese translations 
to European Portuguese in your database.
"""

import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()

async def update_portuguese_translations():
    """Update Brazilian Portuguese translations to European Portuguese variants"""
    
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        print("❌ DATABASE_URL not found")
        return
    
    # Common Brazilian -> European Portuguese conversions
    conversions = {
        # Common UI terms
        'Gerenciamento': 'Gestão',
        'gerenciamento': 'gestão',
        'Aplicativo': 'Aplicação',
        'aplicativo': 'aplicação',
        'Deletar': 'Eliminar',
        'deletar': 'eliminar',
        'Salvar': 'Guardar',
        'salvar': 'guardar',
        'Baixar': 'Transferir',
        'baixar': 'transferir',
        'Carregar': 'Carregar', # Same in both
        'Cadastrar': 'Registar',
        'cadastrar': 'registar',
        'Usuário': 'Utilizador',
        'usuário': 'utilizador',
        'Usuários': 'Utilizadores',
        'usuários': 'utilizadores',
        
        # Business terms
        'Orçamento': 'Orçamento', # Same
        'Locação': 'Aluguer',
        'locação': 'aluguer',
        'Aluguel': 'Aluguer',
        'aluguel': 'aluguer',
        
        # Technical terms
        'Sistema': 'Sistema', # Same
        'Equipamento': 'Equipamento', # Same
        'Vídeo': 'Vídeo', # Same
        'Áudio': 'Áudio', # Same
        
        # Verbs and common words
        'você': 'o utilizador',
        'Você': 'O utilizador',
        'conectar': 'ligar',
        'Conectar': 'Ligar',
        'desconectar': 'desligar',
        'Desconectar': 'Desligar',
    }
    
    print("🔄 Converting Brazilian Portuguese to European Portuguese...")
    print("=" * 60)
    
    pool = await asyncpg.create_pool(database_url)
    
    try:
        async with pool.acquire() as conn:
            # Get all Portuguese translations
            translations = await conn.fetch(
                'SELECT id, "sourceText", "translatedText" FROM "Translation" WHERE "targetLang" = \'pt\''
            )
            
            print(f"📊 Found {len(translations)} Portuguese translations")
            
            updated_count = 0
            
            for translation in translations:
                original_text = translation['translatedText']
                updated_text = original_text
                
                # Apply conversions
                for brazilian, european in conversions.items():
                    if brazilian in updated_text:
                        updated_text = updated_text.replace(brazilian, european)
                
                # If text was changed, update it
                if updated_text != original_text:
                    await conn.execute(
                        '''
                        UPDATE "Translation" 
                        SET "translatedText" = $1, "updatedAt" = NOW()
                        WHERE id = $2
                        ''',
                        updated_text, translation['id']
                    )
                    
                    print(f"✅ Updated: '{original_text}' -> '{updated_text}'")
                    updated_count += 1
            
            print(f"\n🎉 Updated {updated_count} translations to European Portuguese")
            
    finally:
        await pool.close()

if __name__ == '__main__':
    asyncio.run(update_portuguese_translations())