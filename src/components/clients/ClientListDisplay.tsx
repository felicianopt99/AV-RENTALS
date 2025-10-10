
// src/components/clients/ClientListDisplay.tsx
"use client";

import { useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Client } from '@/types';
import { useAppContext, useAppDispatch } from '@/contexts/AppContext';
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
import { PlusCircle, Edit, Trash2, MoreHorizontal, Search, SearchSlash, Users, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export function ClientListDisplay() {
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
      toast({ title: 'Client Deleted', description: `Client "${clientToDelete.name}" has been removed.` });
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
        <div className="flex flex-col h-[calc(100vh-150px)]"> {/* Adjust height as needed */}
            <div className="flex-grow flex items-center justify-center">
                <p className="text-lg text-muted-foreground">Loading client data...</p>
            </div>
        </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Clients</h2>
        <Button asChild>
          <Link href="/clients/new">
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Client
          </Link>
        </Button>
      </div>
      <Card className="shadow-lg">
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
                className="w-full sm:max-w-sm md:max-w-md pl-10"
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
          <div className="overflow-x-auto">
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
                          <Button variant="ghost" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
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

    