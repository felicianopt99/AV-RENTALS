 "use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { User } from '@/types';

export default function ProfilePage() {
  const { currentUser, isDataLoaded } = useAppContext();
  const router = useRouter();
  const { toast } = useToast();
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!isDataLoaded) return;
    if (!currentUser) {
      router.push('/login');
      return;
    }
    fetchProfile();
  }, [currentUser, isDataLoaded]);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/users/profile', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setPhotoPreview(data.photoUrl || null);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        toast({
          title: 'Error',
          description: errorData.error || 'Failed to load profile',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to load profile',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!profile) return;

    setSaving(true);
    try {
      const formData = new FormData();
      if (photoFile) {
        formData.append('photo', photoFile);
      }
      formData.append('nif', profile.nif || '');
      formData.append('iban', profile.iban || '');
      formData.append('contactPhone', profile.contactPhone || '');
      formData.append('contactEmail', profile.contactEmail || '');
      formData.append('emergencyPhone', profile.emergencyPhone || '');

      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        body: formData,
      });

      if (response.ok) {
        const updatedProfile = await response.json();
        setProfile(updatedProfile);
        setPhotoFile(null);
        toast({
          title: 'Success',
          description: 'Profile updated successfully',
        });
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to update profile',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to update profile',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof User, value: string) => {
    if (profile) {
      setProfile({ ...profile, [field]: value });
    }
  };

  if (!isDataLoaded || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>My Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Photo Upload */}
            <div className="flex items-center space-x-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={photoPreview || undefined} />
                <AvatarFallback>{profile?.name?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
              <div>
                <Label htmlFor="photo">Profile Photo</Label>
                <Input
                  id="photo"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="mt-1"
                />
              </div>
            </div>

            {/* Basic Info (Read-only) */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={profile?.name || ''}
                  disabled
                />
              </div>
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={profile?.username || ''}
                  disabled
                />
              </div>
            </div>

            {/* Profile Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nif">NIF</Label>
                <Input
                  id="nif"
                  value={profile?.nif || ''}
                  onChange={(e) => handleInputChange('nif', e.target.value)}
                  placeholder="Enter NIF"
                />
              </div>
              <div>
                <Label htmlFor="iban">IBAN</Label>
                <Input
                  id="iban"
                  value={profile?.iban || ''}
                  onChange={(e) => handleInputChange('iban', e.target.value)}
                  placeholder="Enter IBAN"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contactPhone">Contact Phone</Label>
                <Input
                  id="contactPhone"
                  value={profile?.contactPhone || ''}
                  onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                  placeholder="Enter contact phone"
                />
              </div>
              <div>
                <Label htmlFor="contactEmail">Contact Email</Label>
                <Input
                  id="contactEmail"
                  value={profile?.contactEmail || ''}
                  onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                  placeholder="Enter contact email"
                  type="email"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="emergencyPhone">Emergency Phone</Label>
              <Input
                id="emergencyPhone"
                value={profile?.emergencyPhone || ''}
                onChange={(e) => handleInputChange('emergencyPhone', e.target.value)}
                placeholder="Enter emergency phone"
              />
            </div>

            <Button type="submit" disabled={saving} className="w-full">
              {saving ? 'Saving...' : 'Save Profile'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
