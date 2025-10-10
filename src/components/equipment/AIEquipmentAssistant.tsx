"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles, Link, FileText, Wand2, AlertCircle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface EquipmentData {
  name: string;
  description: string;
  category: string;
  subcategory?: string;
  dailyRate?: number;
  specifications?: string[];
  imageUrl?: string;
  brand?: string;
  model?: string;
  weight?: string;
  dimensions?: string;
  powerRequirements?: string;
  connectivity?: string[];
}

interface AIEquipmentAssistantProps {
  onEquipmentGenerated: (equipment: EquipmentData, refreshData?: () => Promise<void>) => void;
  refreshData: () => Promise<void>;
  disabled?: boolean;
}

export default function AIEquipmentAssistant({ onEquipmentGenerated, refreshData, disabled }: AIEquipmentAssistantProps) {
  const [input, setInput] = useState('');
  const [inputType, setInputType] = useState<'url' | 'description'>('description');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [pendingResult, setPendingResult] = useState<any>(null);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [showSubcategoryDialog, setShowSubcategoryDialog] = useState(false);
  const { toast } = useToast();

  const handleAnalyze = async (createMissingCategory = false, createMissingSubcategory = false) => {
    if (!input.trim()) {
      toast({
        variant: 'destructive',
        title: 'Input required',
        description: 'Please provide a product URL or description.',
      });
      return;
    }

    setIsAnalyzing(true);

    try {
      const response = await fetch('/api/ai/analyze-equipment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: input.trim(),
          type: inputType,
          createMissingCategory,
          createMissingSubcategory,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to analyze equipment');
      }

      const result = await response.json();
      
      if (result.success && result.equipment) {
        // Check if we need to prompt for category creation
        if (result.needsNewCategory && !createMissingCategory) {
          setPendingResult(result);
          setShowCategoryDialog(true);
          setIsAnalyzing(false);
          return;
        }
        
        // Check if we need to prompt for subcategory creation
        if (result.needsNewSubcategory && !createMissingSubcategory) {
          setPendingResult(result);
          setShowSubcategoryDialog(true);
          setIsAnalyzing(false);
          return;
        }

        // All good, proceed with form filling
        const needsRefresh = result.categoryInfo?.created || result.subcategoryInfo?.created;
        
        onEquipmentGenerated({
          ...result.equipment,
          categoryId: result.categoryInfo?.id,
          subcategoryId: result.subcategoryInfo?.id,
        }, needsRefresh ? refreshData : undefined);
        
        let successMessage = `Generated details for: ${result.equipment.name}`;
        if (result.categoryInfo?.created) {
          successMessage += ` (Created new category: ${result.categoryInfo.name})`;
        }
        if (result.subcategoryInfo?.created) {
          successMessage += ` (Created new subcategory: ${result.subcategoryInfo.name})`;
        }
        
        toast({
          title: 'Equipment analyzed successfully!',
          description: successMessage,
        });
        
        // Clear the input after successful analysis
        setInput('');
        setPendingResult(null);
      } else {
        throw new Error('Invalid response from AI service');
      }

    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        variant: 'destructive',
        title: 'Analysis failed',
        description: error instanceof Error ? error.message : 'Failed to analyze equipment. Please try again.',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleInitialAnalyze = () => {
    handleAnalyze(false, false);
  };

  const handleCreateCategory = async () => {
    setShowCategoryDialog(false);
    if (pendingResult) {
      await handleAnalyze(true, false);
    }
  };

  const handleSkipCategory = () => {
    setShowCategoryDialog(false);
    if (pendingResult) {
      // Check if we still need subcategory
      if (pendingResult.needsNewSubcategory) {
        setShowSubcategoryDialog(true);
      } else {
        // Proceed without creating category, but still need to refresh to get latest data
        onEquipmentGenerated({
          ...pendingResult.equipment,
          categoryId: pendingResult.categoryInfo?.id,
        }, refreshData);
        setInput('');
        setPendingResult(null);
        toast({
          title: 'Equipment analyzed!',
          description: `Generated details for: ${pendingResult.equipment.name} (without new category)`,
        });
      }
    }
  };

  const handleCreateSubcategory = async () => {
    setShowSubcategoryDialog(false);
    if (pendingResult) {
      await handleAnalyze(pendingResult.categoryInfo?.created || false, true);
    }
  };

  const handleSkipSubcategory = () => {
    setShowSubcategoryDialog(false);
    if (pendingResult) {
      // Proceed without creating subcategory, but refresh to get latest data
      onEquipmentGenerated({
        ...pendingResult.equipment,
        categoryId: pendingResult.categoryInfo?.id,
      }, refreshData);
      setInput('');
      setPendingResult(null);
      toast({
        title: 'Equipment analyzed!',
        description: `Generated details for: ${pendingResult.equipment.name} (without new subcategory)`,
      });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          AI Equipment Assistant
        </CardTitle>
        <CardDescription>
          Provide a product URL or description, and AI will automatically fill out the equipment details for you.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="input-type">Input Type</Label>
          <Select
            value={inputType}
            onValueChange={(value: 'url' | 'description') => setInputType(value)}
            disabled={disabled || isAnalyzing}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="description">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Description
                </div>
              </SelectItem>
              <SelectItem value="url">
                <div className="flex items-center gap-2">
                  <Link className="h-4 w-4" />
                  Product URL
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="ai-input">
            {inputType === 'url' ? 'Product URL' : 'Equipment Description'}
          </Label>
          {inputType === 'url' ? (
            <Input
              id="ai-input"
              type="url"
              placeholder="https://example.com/product-page"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={disabled || isAnalyzing}
            />
          ) : (
            <Textarea
              id="ai-input"
              placeholder="Describe the equipment you want to add. Include details like brand, model, type, specifications, etc. For example: 'Shure SM58 dynamic microphone with XLR connection, professional vocal mic for live sound'"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={disabled || isAnalyzing}
              rows={4}
            />
          )}
        </div>

        <Button
          onClick={handleInitialAnalyze}
          disabled={disabled || isAnalyzing || !input.trim()}
          className="w-full"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing with AI...
            </>
          ) : (
            <>
              <Wand2 className="mr-2 h-4 w-4" />
              Generate Equipment Details
            </>
          )}
        </Button>

        <div className="text-xs text-muted-foreground">
          <p className="font-medium mb-1">Examples:</p>
          <ul className="space-y-1">
            <li>• "Professional LED par can light with RGBW color mixing"</li>
            <li>• "Canon EOS R5 mirrorless camera with 24-70mm lens"</li>
            <li>• "Mackie ProFX16v3 16-channel mixer with USB interface"</li>
          </ul>
        </div>
      </CardContent>

      {/* Category Creation Dialog */}
      <AlertDialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-blue-500" />
              Create New Category?
            </AlertDialogTitle>
            <AlertDialogDescription>
              The AI suggested the category "{pendingResult?.suggestedCategoryName}" which doesn't exist yet. 
              Would you like to create this new category?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleSkipCategory}>
              Skip Category
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleCreateCategory}>
              Create Category
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Subcategory Creation Dialog */}
      <AlertDialog open={showSubcategoryDialog} onOpenChange={setShowSubcategoryDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-blue-500" />
              Create New Subcategory?
            </AlertDialogTitle>
            <AlertDialogDescription>
              The AI suggested the subcategory "{pendingResult?.suggestedSubcategoryName}" under "{pendingResult?.suggestedCategoryName}" which doesn't exist yet. 
              Would you like to create this new subcategory?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleSkipSubcategory}>
              Skip Subcategory
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleCreateSubcategory}>
              Create Subcategory
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}