
// src/components/quotes/QuoteListDisplay.tsx
"use client";

import { useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Quote } from '@/types';
import { useAppContext } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PlusCircle, Edit, Trash2, MoreHorizontal, Search, FileText, SearchSlash } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

export function QuoteListDisplay() {
  const { quotes, deleteQuote, isDataLoaded } = useAppContext();
  const router = useRouter();
  const { toast } = useToast();

  const [quoteToDelete, setQuoteToDelete] = useState<Quote | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const openDeleteDialog = useCallback((quote: Quote) => {
    setQuoteToDelete(quote);
  }, []);

  const confirmDelete = useCallback(() => {
    if (quoteToDelete) {
      deleteQuote(quoteToDelete.id);
      toast({ title: 'Quote Deleted', description: `Quote "${quoteToDelete.name || quoteToDelete.quoteNumber}" has been removed.` });
      setQuoteToDelete(null);
    }
  }, [quoteToDelete, deleteQuote, toast]);

  const filteredQuotes = useMemo(() => {
    const lowerSearchTerm = searchTerm.toLowerCase();
    return quotes.filter(quote =>
        (quote.name && quote.name.toLowerCase().includes(lowerSearchTerm)) ||
        quote.quoteNumber.toLowerCase().includes(lowerSearchTerm) ||
        (quote.clientName && quote.clientName.toLowerCase().includes(lowerSearchTerm)) ||
        (quote.status && quote.status.toLowerCase().includes(lowerSearchTerm))
    ).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [quotes, searchTerm]);

  const getStatusColor = (status: Quote['status']) => {
    switch (status) {
      case 'Draft': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'Sent': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'Accepted': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'Declined': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'Archived': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };


  if (!isDataLoaded) {
    return (
        <div className="flex flex-col h-[calc(100vh-150px)]"> {/* Adjust height as needed */}
            <div className="flex-grow flex items-center justify-center">
                <p className="text-lg text-muted-foreground">Loading quote data...</p>
            </div>
        </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Quotes</h2>
        <Link href="/quotes/new" passHref>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Create New Quote
          </Button>
        </Link>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Quote List</CardTitle>
          <CardDescription>View, search, and manage all your quotes.</CardDescription>
          <div className="mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search quotes (name, number, client, status)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-md pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredQuotes.length === 0 ? (
             <div className="text-center py-12 text-muted-foreground flex flex-col items-center">
              {searchTerm ? (
                <>
                  <SearchSlash className="w-16 h-16 mb-4 text-primary/50" />
                  <p className="text-xl mb-1">No quotes match your search.</p>
                  <p className="text-sm">Try a different search term or clear the search.</p>
                </>
              ) : (
                <>
                  <FileText className="w-16 h-16 mb-4 text-primary/50" />
                  <p className="text-xl mb-1">No quotes created yet.</p>
                  <p className="text-sm">Click "Create New Quote" to get started.</p>
                </>
              )}
            </div>
          ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Number</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuotes.map((quote) => (
                  <TableRow key={quote.id}>
                    <TableCell className="font-medium">{quote.quoteNumber}</TableCell>
                    <TableCell>{quote.name}</TableCell>
                    <TableCell>{quote.clientName || '-'}</TableCell>
                    <TableCell>{format(new Date(quote.startDate), 'PP')}</TableCell>
                    <TableCell>{format(new Date(quote.endDate), 'PP')}</TableCell>
                    <TableCell>${quote.totalAmount.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`py-1 px-2.5 text-xs ${getStatusColor(quote.status)}`}>
                        {quote.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/quotes/${quote.id}`)}>
                            <Edit className="mr-2 h-4 w-4" /> View / Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openDeleteDialog(quote)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          )}
        </CardContent>
      </Card>

      {quoteToDelete && (
        <AlertDialog open={!!quoteToDelete} onOpenChange={(isOpen) => !isOpen && setQuoteToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the quote "{quoteToDelete.name || quoteToDelete.quoteNumber}"? 
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setQuoteToDelete(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
                Delete Quote
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}

