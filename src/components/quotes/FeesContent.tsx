"use client";

import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Fee } from '@/types';

export function FeesContent() {
  const [fees, setFees] = useState<Fee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  // Edit modal state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editFee, setEditFee] = useState<Fee | null>(null);
  // Delete modal state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteFeeId, setDeleteFeeId] = useState<string | null>(null);
  // Platform popup state
  const [popup, setPopup] = useState<{ open: boolean; title: string; description: string; type: 'success' | 'error' }>({ open: false, title: '', description: '', type: 'success' });

  // New fee form state
  const [newFee, setNewFee] = useState({
    name: '',
    description: '',
    amount: 0,
    type: 'fixed' as 'fixed' | 'percentage',
    category: '',
    isRequired: false,
  });

  useEffect(() => {
    fetchFees();
  }, []);

  const fetchFees = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/fees');
      if (response.ok) {
        const data = await response.json();
        setFees(data);
      } else {
        throw new Error('Failed to fetch fees');
      }
    } catch (error) {
      setPopup({ open: true, title: 'Error', description: 'Failed to fetch fees', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateFee = async () => {
    if (!newFee.name || !newFee.amount) {
      setPopup({ open: true, title: 'Error', description: 'Please fill in all required fields', type: 'error' });
      return;
    }
    try {
      const response = await fetch('/api/fees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newFee, amount: Number(newFee.amount), isActive: true }),
      });
      if (response.ok) {
        setPopup({ open: true, title: 'Success', description: 'Fee created successfully', type: 'success' });
        setNewFee({ name: '', description: '', amount: 0, type: 'fixed', category: '', isRequired: false });
        setIsCreating(false);
        fetchFees();
      } else {
        throw new Error('Failed to create fee');
      }
    } catch (error) {
      setPopup({ open: true, title: 'Error', description: 'Failed to create fee', type: 'error' });
    }
  };

  const handleDeleteFee = async () => {
    if (!deleteFeeId) return;
    try {
      const response = await fetch(`/api/fees/${deleteFeeId}`, { method: 'DELETE' });
      if (response.ok) {
        setPopup({ open: true, title: 'Success', description: 'Fee deleted successfully', type: 'success' });
        fetchFees();
      } else {
        throw new Error('Failed to delete fee');
      }
    } catch (error) {
      setPopup({ open: true, title: 'Error', description: 'Failed to delete fee', type: 'error' });
    } finally {
      setIsDeleteOpen(false);
      setDeleteFeeId(null);
    }
  };

  const handleEditFee = (fee: Fee) => {
    setEditFee(fee);
    setIsEditOpen(true);
  };

  const handleUpdateFee = async () => {
    if (!editFee) return;
    if (!editFee.name || !editFee.amount) {
      setPopup({ open: true, title: 'Error', description: 'Please fill in all required fields', type: 'error' });
      return;
    }
    try {
      const response = await fetch(`/api/fees/${editFee.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...editFee, amount: Number(editFee.amount) }),
      });
      if (response.ok) {
        setPopup({ open: true, title: 'Success', description: 'Fee updated successfully', type: 'success' });
        setIsEditOpen(false);
        setEditFee(null);
        fetchFees();
      } else {
        throw new Error('Failed to update fee');
      }
    } catch (error) {
      setPopup({ open: true, title: 'Error', description: 'Failed to update fee', type: 'error' });
    }
  };

  const filteredFees = fees.filter(fee =>
    fee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fee.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fee.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="flex-1 overflow-y-auto p-2 md:p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Fees</h1>
                <p className="text-muted-foreground mt-2">
                  Manage fees that can be added to quotes
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-1/2 mb-4"></div>
                    <div className="h-8 bg-muted rounded w-1/3"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 overflow-y-auto p-2 md:p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Fees</h1>
              <p className="text-muted-foreground mt-2">
                Manage fees that can be added to quotes
              </p>
            </div>
            <Button onClick={() => setIsCreating(!isCreating)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Fee
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search fees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Create Fee Form */}
          {isCreating && (
            <Card>
              <CardHeader>
                <CardTitle>Create New Fee</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Name *</label>
                    <Input
                      value={newFee.name}
                      onChange={(e) => setNewFee({ ...newFee, name: e.target.value })}
                      placeholder="Fee name"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Category</label>
                    <Input
                      value={newFee.category}
                      onChange={(e) => setNewFee({ ...newFee, category: e.target.value })}
                      placeholder="e.g., Delivery, Setup, Insurance"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Amount *</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={newFee.amount}
                      onChange={(e) => setNewFee({ ...newFee, amount: Number(e.target.value) })}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Type</label>
                    <select
                      value={newFee.type}
                      onChange={(e) => setNewFee({ ...newFee, type: e.target.value as 'fixed' | 'percentage' })}
                      className="w-full p-2 border border-input rounded-md bg-background"
                    >
                      <option value="fixed">Fixed Amount</option>
                      <option value="percentage">Percentage</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <textarea
                    value={newFee.description}
                    onChange={(e) => setNewFee({ ...newFee, description: e.target.value })}
                    placeholder="Fee description"
                    className="w-full p-2 border border-input rounded-md bg-background min-h-[100px]"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={newFee.isRequired}
                    onCheckedChange={(checked) => setNewFee({ ...newFee, isRequired: checked })}
                  />
                  <label className="text-sm font-medium">
                    Auto-add to all quotes (Required)
                  </label>
                </div>
                <div className="flex space-x-2">
                  <Button onClick={handleCreateFee}>Create Fee</Button>
                  <Button variant="outline" onClick={() => setIsCreating(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Fees Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFees.map((fee) => (
              <Card key={fee.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold text-lg">{fee.name}</h3>
                    </div>
                    <div className="flex space-x-1">
                      <Button size="sm" variant="ghost" onClick={() => handleEditFee(fee)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => { setDeleteFeeId(fee.id); setIsDeleteOpen(true); }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
      {/* Edit Fee Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Fee</DialogTitle>
          </DialogHeader>
          {editFee && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Name *</label>
                  <Input
                    value={editFee.name}
                    onChange={e => setEditFee({ ...editFee, name: e.target.value })}
                    placeholder="Fee name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <Input
                    value={editFee.category || ''}
                    onChange={e => setEditFee({ ...editFee, category: e.target.value })}
                    placeholder="e.g., Delivery, Setup, Insurance"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Amount *</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editFee.amount}
                    onChange={e => setEditFee({ ...editFee, amount: Number(e.target.value) })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Type</label>
                  <select
                    value={editFee.type}
                    onChange={e => setEditFee({ ...editFee, type: e.target.value as 'fixed' | 'percentage' })}
                    className="w-full p-2 border border-input rounded-md bg-background"
                  >
                    <option value="fixed">Fixed Amount</option>
                    <option value="percentage">Percentage</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <textarea
                  value={editFee.description || ''}
                  onChange={e => setEditFee({ ...editFee, description: e.target.value })}
                  placeholder="Fee description"
                  className="w-full p-2 border border-input rounded-md bg-background min-h-[100px]"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={editFee.isRequired}
                  onCheckedChange={checked => setEditFee({ ...editFee, isRequired: checked })}
                />
                <label className="text-sm font-medium">
                  Auto-add to all quotes (Required)
                </label>
              </div>
              <div className="flex space-x-2">
                <Button onClick={handleUpdateFee}>Update Fee</Button>
                <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Fee</DialogTitle>
            <DialogDescription>Are you sure you want to delete this fee? This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="destructive" onClick={handleDeleteFee}>Delete</Button>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Platform Popup Modal */}
      <Dialog open={popup.open} onOpenChange={open => setPopup({ ...popup, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className={popup.type === 'error' ? 'text-red-600' : 'text-green-600'}>{popup.title}</DialogTitle>
            <DialogDescription>{popup.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setPopup({ ...popup, open: false })}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
                    </div>
                  </div>

                  <div className="flex space-x-2 mb-2">
                    {fee.category && (
                      <Badge variant="secondary">
                        {fee.category}
                      </Badge>
                    )}
                    {fee.isRequired && (
                      <Badge variant="default">
                        Required
                      </Badge>
                    )}
                  </div>

                  {fee.description && (
                    <p className="text-muted-foreground text-sm mb-4">
                      {fee.description}
                    </p>
                  )}

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Amount:</span>
                      <span className="font-semibold">
                        {fee.type === 'percentage' ? `${fee.amount}%` : `$${fee.amount.toFixed(2)}`}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Type:</span>
                      <Badge variant="outline">
                        {fee.type === 'fixed' ? 'Fixed' : 'Percentage'}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge variant={fee.isActive ? "default" : "secondary"}>
                        {fee.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredFees.length === 0 && !isLoading && (
            <Card>
              <CardContent className="p-12 text-center">
                <DollarSign className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Fees Found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm ? 'No fees match your search.' : 'Get started by creating your first fee.'}
                </p>
                {!searchTerm && (
                  <Button onClick={() => setIsCreating(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Fee
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}