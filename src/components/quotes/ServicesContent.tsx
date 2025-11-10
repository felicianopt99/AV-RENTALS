"use client";

import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Service } from '@/types';

export function ServicesContent() {
  const [services, setServices] = useState<Service[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  // New service form state
  const [newService, setNewService] = useState({
    name: '',
    description: '',
    unitPrice: 0,
    unit: 'hour',
    category: '',
  });

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/services');
      if (response.ok) {
        const data = await response.json();
        setServices(data);
      } else {
        throw new Error('Failed to fetch services');
      }
    } catch (error) {
      console.error('Error fetching services:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch services',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateService = async () => {
    if (!newService.name || !newService.unitPrice) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch('/api/services', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newService,
          unitPrice: Number(newService.unitPrice),
          isActive: true,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Service created successfully',
        });
        setNewService({
          name: '',
          description: '',
          unitPrice: 0,
          unit: 'hour',
          category: '',
        });
        setIsCreating(false);
        fetchServices();
      } else {
        throw new Error('Failed to create service');
      }
    } catch (error) {
      console.error('Error creating service:', error);
      toast({
        title: 'Error',
        description: 'Failed to create service',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!confirm('Are you sure you want to delete this service?')) {
      return;
    }

    try {
      const response = await fetch(`/api/services/${serviceId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Service deleted successfully',
        });
        fetchServices();
      } else {
        throw new Error('Failed to delete service');
      }
    } catch (error) {
      console.error('Error deleting service:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete service',
        variant: 'destructive',
      });
    }
  };

  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="flex-1 overflow-y-auto p-2 md:p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Services</h1>
                <p className="text-muted-foreground mt-2">
                  Manage services that can be added to quotes
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
              <h1 className="text-3xl font-bold tracking-tight">Services</h1>
              <p className="text-muted-foreground mt-2">
                Manage services that can be added to quotes
              </p>
            </div>
            <Button onClick={() => setIsCreating(!isCreating)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Service
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Create Service Form */}
          {isCreating && (
            <Card>
              <CardHeader>
                <CardTitle>Create New Service</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Name *</label>
                    <Input
                      value={newService.name}
                      onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                      placeholder="Service name"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Category</label>
                    <Input
                      value={newService.category}
                      onChange={(e) => setNewService({ ...newService, category: e.target.value })}
                      placeholder="e.g., Setup, Technical Support"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Unit Price *</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={newService.unitPrice}
                      onChange={(e) => setNewService({ ...newService, unitPrice: Number(e.target.value) })}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Unit</label>
                    <select
                      value={newService.unit}
                      onChange={(e) => setNewService({ ...newService, unit: e.target.value })}
                      className="w-full p-2 border border-input rounded-md bg-background"
                    >
                      <option value="hour">per Hour</option>
                      <option value="day">per Day</option>
                      <option value="service">per Service</option>
                      <option value="event">per Event</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <textarea
                    value={newService.description}
                    onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                    placeholder="Service description"
                    className="w-full p-2 border border-input rounded-md bg-background min-h-[100px]"
                  />
                </div>
                <div className="flex space-x-2">
                  <Button onClick={handleCreateService}>Create Service</Button>
                  <Button variant="outline" onClick={() => setIsCreating(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Services Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service) => (
              <Card key={service.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <Package className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold text-lg">{service.name}</h3>
                    </div>
                    <div className="flex space-x-1">
                      <Button size="sm" variant="ghost">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => handleDeleteService(service.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {service.category && (
                    <Badge variant="secondary" className="mb-2">
                      {service.category}
                    </Badge>
                  )}

                  {service.description && (
                    <p className="text-muted-foreground text-sm mb-4">
                      {service.description}
                    </p>
                  )}

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Price:</span>
                      <span className="font-semibold">
                        ${service.unitPrice.toFixed(2)} {service.unit}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge variant={service.isActive ? "default" : "secondary"}>
                        {service.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredServices.length === 0 && !isLoading && (
            <Card>
              <CardContent className="p-12 text-center">
                <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Services Found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm ? 'No services match your search.' : 'Get started by creating your first service.'}
                </p>
                {!searchTerm && (
                  <Button onClick={() => setIsCreating(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Service
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