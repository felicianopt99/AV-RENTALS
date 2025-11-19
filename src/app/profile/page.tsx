"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { User } from '@/types';
import ProfileCard from '@/components/ProfileCard';
import { useTranslate } from '@/contexts/TranslationContext';
import '../../components/ProfileCard.css';

export default function ProfilePage() {
  // Translation hooks
  const { translated: profileText } = useTranslate('Profile');
  const { translated: editProfileText } = useTranslate('Edit Profile');
  const { translated: statusActiveText } = useTranslate('Active');
  const { translated: dialogTitleText } = useTranslate('Edit Profile');
  const { translated: dialogDescText } = useTranslate('Update your profile information below.');
  const { translated: profilePhotoLabel } = useTranslate('Profile Photo');
  const { translated: nameLabel } = useTranslate('Name');
  const { translated: usernameLabel } = useTranslate('Username');
  const { translated: nifLabel } = useTranslate('NIF');
  const { translated: ibanLabel } = useTranslate('IBAN');
  const { translated: contactPhoneLabel } = useTranslate('Contact Phone');
  const { translated: contactEmailLabel } = useTranslate('Contact Email');
  const { translated: emergencyPhoneLabel } = useTranslate('Emergency Phone');
  const { translated: phEnterNif } = useTranslate('Enter NIF');
  const { translated: phEnterIban } = useTranslate('Enter IBAN');
  const { translated: phEnterContactPhone } = useTranslate('Enter contact phone');
  const { translated: phEnterContactEmail } = useTranslate('Enter contact email');
  const { translated: phEnterEmergencyPhone } = useTranslate('Enter emergency phone');
  const { translated: toastSuccessTitle } = useTranslate('Success');
  const { translated: toastProfileUpdated } = useTranslate('Profile updated successfully');
  const { translated: toastErrorTitle } = useTranslate('Error');
  const { translated: toastFailedLoadProfile } = useTranslate('Failed to load profile');
  const { translated: toastInvalidResponse } = useTranslate('Invalid response from server');
  const { translated: toastFailedUpdateProfile } = useTranslate('Failed to update profile');
  const { translated: savingLabel } = useTranslate('Saving...');
  const { translated: saveProfileLabel } = useTranslate('Save Profile');

  const { currentUser, isDataLoaded } = useAppContext();
  const router = useRouter();
  const { toast } = useToast();
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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
        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Expected JSON response but received different content type');
        }
        
        const data = await response.json();
        setProfile(data);
        setPhotoPreview(data.photoUrl || null);
      } else {
        let errorData;
        try {
          errorData = await response.json();
        } catch (jsonError) {
          errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
        }
        toast({
          title: toastErrorTitle,
          description: errorData.error || toastFailedLoadProfile,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      let errorMessage = toastFailedLoadProfile;
      
      if (error instanceof SyntaxError && error.message.includes('JSON')) {
        errorMessage = toastInvalidResponse;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: toastErrorTitle,
        description: errorMessage,
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
          title: toastSuccessTitle,
          description: toastProfileUpdated,
        });
      } else {
        const error = await response.json();
        toast({
          title: toastErrorTitle,
          description: error.error || toastFailedUpdateProfile,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: toastErrorTitle,
        description: toastFailedUpdateProfile,
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
    <div className="container mx-auto py-8 flex flex-col items-center">
      <ProfileCard
        avatarUrl={photoPreview || ''}
        name={profile?.name || 'User'}
        title={profileText}
        handle={profile?.username || ''}
        status={statusActiveText}
        contactText={editProfileText}
        onContactClick={() => setIsDialogOpen(true)}
        enableTilt={true}
        mobileTiltSensitivity={3}
      />
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{dialogTitleText}</DialogTitle>
            <DialogDescription>{dialogDescText}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Photo Upload */}
            <div className="flex items-center space-x-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={photoPreview || undefined} />
                <AvatarFallback>{profile?.name?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
              <div>
                <Label htmlFor="photo">{profilePhotoLabel}</Label>
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
                <Label htmlFor="name">{nameLabel}</Label>
                <Input
                  id="name"
                  value={profile?.name || ''}
                  disabled
                />
              </div>
              <div>
                <Label htmlFor="username">{usernameLabel}</Label>
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
                <Label htmlFor="nif">{nifLabel}</Label>
                <Input
                  id="nif"
                  value={profile?.nif || ''}
                  onChange={(e) => handleInputChange('nif', e.target.value)}
                  placeholder={phEnterNif}
                />
              </div>
              <div>
                <Label htmlFor="iban">{ibanLabel}</Label>
                <Input
                  id="iban"
                  value={profile?.iban || ''}
                  onChange={(e) => handleInputChange('iban', e.target.value)}
                  placeholder={phEnterIban}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contactPhone">{contactPhoneLabel}</Label>
                <Input
                  id="contactPhone"
                  value={profile?.contactPhone || ''}
                  onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                  placeholder={phEnterContactPhone}
                />
              </div>
              <div>
                <Label htmlFor="contactEmail">{contactEmailLabel}</Label>
                <Input
                  id="contactEmail"
                  value={profile?.contactEmail || ''}
                  onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                  placeholder={phEnterContactEmail}
                  type="email"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="emergencyPhone">{emergencyPhoneLabel}</Label>
              <Input
                id="emergencyPhone"
                value={profile?.emergencyPhone || ''}
                onChange={(e) => handleInputChange('emergencyPhone', e.target.value)}
                placeholder={phEnterEmergencyPhone}
              />
            </div>

            <Button type="submit" disabled={saving} className="w-full">
              {saving ? savingLabel : saveProfileLabel}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
