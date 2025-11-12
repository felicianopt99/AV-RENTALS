import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '@/lib/db';

import { useTranslate } from '@/contexts/TranslationContext';
const inventoryAnalysisSchema = z.object({
  input: z.string().min(1, 'Product URL or description is required'),
  type: z.enum(['url', 'description']).default('description'),
  createMissingCategory: z.boolean().default(false),
  createMissingSubcategory: z.boolean().default(false),
});

// Define the structure we want Gemini to return
const equipmentSchema = z.object({
  name: z.string(),
  description: z.string(),
  category: z.string(),
  subcategory: z.string().optional(),
  dailyRate: z.number().optional(),
  specifications: z.array(z.string()).optional(),
  imageUrl: z.string().url().optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  weight: z.string().optional(),
  dimensions: z.string().optional(),
  powerRequirements: z.string().optional(),
  connectivity: z.array(z.string()).optional(),
});

// Helper function to get appropriate icon for category
function getCategoryIcon(categoryName: string): string {
  const categoryLower = categoryName.toLowerCase();
  
  if (categoryLower.includes('audio')) return '🎵';
  if (categoryLower.includes('video')) return '📹';
  if (categoryLower.includes('lighting')) return '💡';
  if (categoryLower.includes('power')) return '🔌';
  if (categoryLower.includes('rigging')) return '🔗';
  if (categoryLower.includes('staging')) return '🎭';
  if (categoryLower.includes('cables')) return '🔌';
  if (categoryLower.includes('accessories')) return '🛠️';
  
  return '📦'; // Default icon
}

export async function POST(request: NextRequest) {
  // Translation hooks
  const { translated: textPowerspecsifmentioneText } = useTranslate('Power specs if mentioned');
  const { translated: textDimensionsifmentioneText } = useTranslate('Dimensions if mentioned');
  const { translated: textBrandnameifmentionedText } = useTranslate('Brand name if mentioned');
  const { translated: textConnectiontypesasarrText } = useTranslate('Connection types as array');
  const { translated: textPowerspecsText } = useTranslate('Power specs');
  const { translated: textWeightwithunitsText } = useTranslate('Weight with units');
  const { translated: textBrandnameText } = useTranslate('Brand name');

  try {
    const body = await request.json();
    console.log('AI request received:', { type: body.type, inputLength: body.input?.length });
    
    // Check if API key is configured
    if (!process.env.GOOGLE_GENAI_API_KEY) {
      console.error('GOOGLE_GENAI_API_KEY is not configured');
      return NextResponse.json(
        { error: 'AI service is not configured. Please contact administrator.' },
        { status: 500 }
      );
    }
    
    const { input, type, createMissingCategory, createMissingSubcategory } = inventoryAnalysisSchema.parse(body);

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENAI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    let analysisPrompt = '';
    
    if (type === 'url') {
      analysisPrompt = `
        Analyze this product URL/link and extract equipment information: ${input}
        
        Please provide the following information in JSON format:
        {
          "name": "Product name (max 80 characters)",
          "description": "Detailed description (max 400 characters)",
          "category": "Equipment category (Audio, Video, Lighting, etc.)",
          "subcategory": "Specific subcategory if applicable",
          "dailyRate": "Estimated daily rental rate in USD (number)",
          "specifications": ["Key specifications as array"],
          "imageUrl": "Product image URL if available",
          "brand": {textBrandnameText},
          "model": "Model number/name",
          "weight": {textWeightwithunitsText},
          "dimensions": "Dimensions (L x W x H)",
          "powerRequirements": {textPowerspecsText},
          "connectivity": [{textConnectiontypesasarrText}]
        }
        
        For daily rate, estimate based on typical AV equipment rental prices.
        For category, use one of: Audio, Video, Lighting, Power, Rigging, Staging, Cables, Accessories
        
        CRITICAL: Keep name under 80 characters and description under 400 characters. Be concise but informative.
      `;
    } else {
      analysisPrompt = `
        Based on this equipment description, extract and format the information: ${input}
        
        Please provide the following information in JSON format:
        {
          "name": "Product name (max 80 characters)",
          "description": "Enhanced detailed description (max 400 characters)",
          "category": "Equipment category (Audio, Video, Lighting, etc.)",
          "subcategory": "Specific subcategory if applicable",
          "dailyRate": "Estimated daily rental rate in USD (number)",
          "specifications": ["Key specifications as array"],
          "imageUrl": "Product image URL if available",
          "brand": {textBrandnameifmentionedText},
          "model": "Model number/name if mentioned",
          "weight": "Weight with units if mentioned",
          "dimensions": {textDimensionsifmentioneText},
          "powerRequirements": {textPowerspecsifmentioneText},
          "connectivity": ["Connection types as array if mentioned"]
        }
        
        For daily rate, estimate based on typical AV equipment rental prices.
        For category, use one of: Audio, Video, Lighting, Power, Rigging, Staging, Cables, Accessories
        Fill in reasonable details even if not explicitly mentioned in the description.
        
        CRITICAL: Keep name under 80 characters and description under 400 characters. Be concise but informative.
      `;
    }

    console.log('Sending request to Gemini...');
    
    // Generate content with Gemini
    const result = await model.generateContent(analysisPrompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('Gemini response received, length:', text.length);

    let equipmentData;
    try {
      // Try to parse the JSON response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        equipmentData = JSON.parse(jsonMatch[0]);
        console.log('Parsed equipment data:', equipmentData);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      console.error('Raw response:', text);
      return NextResponse.json(
        { error: 'Failed to parse equipment information from AI response', details: text },
        { status: 500 }
      );
    }

    // Validate the response against our schema
    const validatedData = equipmentSchema.parse(equipmentData);

    // Ensure description fits within form limits
    if (validatedData.description && validatedData.description.length > 450) {
      validatedData.description = validatedData.description.substring(0, 447) + '...';
    }
    
    // Ensure name fits within form limits  
    if (validatedData.name && validatedData.name.length > 90) {
      validatedData.name = validatedData.name.substring(0, 87) + '...';
    }

    // Handle category and subcategory checking and optional creation
    let categoryInfo = null;
    let subcategoryInfo = null;
    let needsNewCategory = false;
    let needsNewSubcategory = false;
    let createdCategory = false;
    let createdSubcategory = false;

    if (validatedData.category) {
      try {
        // Check if category exists
        let existingCategory = await prisma.category.findFirst({
          where: {
            name: {
              equals: validatedData.category
            }
          }
        });

        if (!existingCategory) {
          needsNewCategory = true;
          
          // Create category if user confirmed
          if (createMissingCategory) {
            existingCategory = await prisma.category.create({
              data: {
                name: validatedData.category,
                icon: getCategoryIcon(validatedData.category)
              }
            });
            createdCategory = true;
            console.log(`Created new category: ${validatedData.category}`);
          }
        }

        if (existingCategory) {
          categoryInfo = existingCategory;

          // Handle subcategory if provided
          if (validatedData.subcategory) {
            let existingSubcategory = await prisma.subcategory.findFirst({
              where: {
                name: {
                  equals: validatedData.subcategory
                },
                parentId: existingCategory.id
              }
            });

            if (!existingSubcategory) {
              needsNewSubcategory = true;
              
              // Create subcategory if user confirmed
              if (createMissingSubcategory) {
                existingSubcategory = await prisma.subcategory.create({
                  data: {
                    name: validatedData.subcategory,
                    parentId: existingCategory.id
                  }
                });
                createdSubcategory = true;
                console.log(`Created new subcategory: ${validatedData.subcategory} under ${validatedData.category}`);
              }
            }

            if (existingSubcategory) {
              subcategoryInfo = existingSubcategory;
            }
          }
        }
      } catch (dbError) {
        console.error('Database error during category operations:', dbError);
        // Continue without failing the entire request
      }
    }

    return NextResponse.json({
      success: true,
      equipment: validatedData,
      categoryInfo: categoryInfo ? {
        id: categoryInfo.id,
        name: categoryInfo.name,
        created: createdCategory
      } : null,
      subcategoryInfo: subcategoryInfo ? {
        id: subcategoryInfo.id,
        name: subcategoryInfo.name,
        created: createdSubcategory
      } : null,
      needsNewCategory,
      needsNewSubcategory,
      suggestedCategoryName: needsNewCategory ? validatedData.category : null,
      suggestedSubcategoryName: needsNewSubcategory ? validatedData.subcategory : null,
      rawResponse: text, // For debugging
    });

  } catch (error) {
    console.error('AI Analysis error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Failed to analyze equipment information', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}