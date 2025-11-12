
// src/components/clients/ClientListDisplay.tsx
"use client";

import { useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Client } from '@/types';
import { useAppContext, useAppDispatch } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { useTranslate } from '@/contexts/TranslationContext';
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
import { PlusCircle, Edit, Trash2, MoreHorizontal, Search, SearchSlash, Users, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export function ClientListDisplay() {
  // Translation hooks
  const { translated: toastClientDeletedTitleText } = useTranslate('Client Deleted');

  const { clients, isDataLoaded } = useAppContext();
  const { deleteClient } = useAppDispatch();
  const router = useRouter();
  const { toast } = useToast();

  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const openDeleteDialog = useCallback((client: Client) => {
    setClientToDelete(client);
  }, []);

  const confirmDelete = useCallback(() => {
    if (clientToDelete) {
      deleteClient(clientToDelete.id);
      toast({ title: toastClientDeletedTitleText, description: `Client "${clientToDelete.name}" has been removed.` });
      setClientToDelete(null);
    }
  }, [clientToDelete, deleteClient, toast]);

  const filteredClients = useMemo(() => clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.contactPerson && client.contactPerson.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (client.phone && client.phone.toLowerCase().includes(searchTerm.toLowerCase()))
  ), [clients, searchTerm]);

  if (!isDataLoaded) {
    return (
        <div className="flex flex-col"> {/* Adjust height as needed */}
            <div className="flex-grow flex items-center justify-center">
                <p className="text-lg text-muted-foreground">Loading client data...</p>
            </div>
        </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-xl md:text-2xl font-semibold">Clients</h2>
        <Button asChild variant="glass" className="w-full sm:w-auto">
          <Link href="/clients/new">
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Client
          </Link>
        </Button>
      </div>
      <Card className="glass-card bg-card text-card-foreground shadow-xl border border-border/40">
        <CardHeader>
          <CardTitle>Client List</CardTitle>
          <CardDescription>View, search, and manage all your clients.</CardDescription>
          <div className="mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search clients (name, contact, email, phone)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:max-w-sm md:max-w-md pl-10 bg-background/70 border border-border/30 focus:border-primary/60"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredClients.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground flex flex-col items-center">
              {searchTerm ? (
                <>
                  <SearchSlash className="w-16 h-16 mb-4 text-primary/50" />
                  <p className="text-xl mb-1">No clients match your search.</p>
                  <p className="text-sm">Try a different search term or clear the search.</p>
                </>
              ) : (
                <>
                  <Users className="w-16 h-16 mb-4 text-primary/50" />
                  <p className="text-xl mb-1">No clients yet.</p>
                  <p className="text-sm">Click "Add New Client" to get started.</p>
                </>
              )}
            </div>
          ) : (
          <>
            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {filteredClients.map((client) => (
                <Card key={client.id} className="p-3 cursor-pointer glass-card bg-card/80 hover:bg-card/90 transition-all shadow-md border border-border/30" onClick={() => router.push(`/clients/${client.id}`)}>
                  <div className="flex justify-between items-start">
                    <div className="flex-grow min-w-0">
                      <h3 className="font-medium text-sm truncate">{client.name}</h3>
                      {client.contactPerson && <p className="text-xs text-muted-foreground truncate mt-0.5">{client.contactPerson}</p>}
                      <div className="flex items-center gap-2 mt-1">
                        {client.email && <span className="text-xs text-muted-foreground truncate">{client.email}</span>}
                        {client.phone && (
                          <>
                            <span className="text-xs text-muted-foreground">•</span>
                            <span className="text-xs text-muted-foreground">{client.phone}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-7 w-7 p-0 text-muted-foreground" onClick={(e) => e.stopPropagation()}>
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => {e.stopPropagation(); router.push(`/clients/${client.id}`)}}>
                          <Eye className="mr-2 h-4 w-4" /> View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {e.stopPropagation(); router.push(`/clients/${client.id}/edit`)}}>
                          <Edit className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {e.stopPropagation(); openDeleteDialog(client)}} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </Card>
              ))}
            </div>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact Person</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => (
                    <TableRow key={client.id} className="cursor-pointer" onClick={() => router.push(`/clients/${client.id}`)}>
                      <TableCell className="font-medium">{client.name}</TableCell>
                      <TableCell>{client.contactPerson || '-'}</TableCell>
                      <TableCell>{client.email || '-'}</TableCell>
                      <TableCell>{client.phone || '-'}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="accentGhost" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => {e.stopPropagation(); router.push(`/clients/${client.id}`)}}>
                              <Eye className="mr-2 h-4 w-4" /> View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => {e.stopPropagation(); router.push(`/clients/${client.id}/edit`)}}>
                              <Edit className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => {e.stopPropagation(); openDeleteDialog(client)}} className="text-destructive focus:text-destructive focus:bg-destructive/10">
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
          </>
          )}
        </CardContent>
      </Card>
      {clientToDelete && (
        <AlertDialog open={!!clientToDelete} onOpenChange={(isOpen) => !isOpen && setClientToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the client "{clientToDelete.name}"? 
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setClientToDelete(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
                Delete Client
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}

    