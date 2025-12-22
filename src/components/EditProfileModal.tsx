import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Loader2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: {
    id: string;
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  } | null;
  onSave: () => void;
}

const AVATAR_OPTIONS = [
  { url: '', emoji: '🐵', name: 'Monkey' },
  { url: 'cat', emoji: '🐱', name: 'Cat' },
  { url: 'owl', emoji: '🦉', name: 'Owl' },
  { url: 'dragon', emoji: '🐉', name: 'Dragon' },
  { url: 'robot', emoji: '🤖', name: 'Robot' },
  { url: 'alien', emoji: '👽', name: 'Alien' },
];

const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSave,
}) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setUsername(profile.username || '');
      setAvatarUrl(profile.avatar_url || '');
    }
  }, [profile]);

  if (!isOpen || !profile) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: displayName.trim() || null,
          username: username.trim() || null,
          avatar_url: avatarUrl || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);

      if (error) throw error;

      toast({
        title: t('profile.profileUpdated', 'Profile updated'),
        description: t('profile.changesSaved', 'Your changes have been saved.'),
      });
      onSave();
      onClose();
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: t('common.error', 'Error'),
        description: error.message || t('profile.updateFailed', 'Failed to update profile'),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-scale-in">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">{t('profile.editProfile', 'Edit Profile')}</h2>
            <button onClick={onClose} className="p-2 hover:bg-muted rounded-full">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Avatar Selector */}
          <div className="mb-6">
            <Label className="mb-2 block">{t('profile.avatar', 'Avatar')}</Label>
            <div className="grid grid-cols-3 gap-3">
              {AVATAR_OPTIONS.map((avatar) => (
                <button
                  key={avatar.url || 'default'}
                  onClick={() => setAvatarUrl(avatar.url)}
                  className={cn(
                    'relative p-3 rounded-xl border-2 transition-all text-center',
                    avatarUrl === avatar.url
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  {avatarUrl === avatar.url && (
                    <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </div>
                  )}
                  <span className="text-3xl block mb-1">{avatar.emoji}</span>
                  <p className="text-xs font-medium">{avatar.name}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Display Name */}
          <div className="mb-4">
            <Label htmlFor="displayName" className="mb-2 block">
              {t('profile.displayName', 'Display Name')}
            </Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={t('profile.enterDisplayName', 'Enter your display name')}
              maxLength={50}
            />
          </div>

          {/* Username */}
          <div className="mb-6">
            <Label htmlFor="username" className="mb-2 block">
              {t('profile.username', 'Username')}
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                placeholder={t('profile.enterUsername', 'username')}
                className="pl-8"
                maxLength={30}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('profile.usernameHint', 'Letters, numbers, and underscores only')}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button className="flex-1" onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('common.saving', 'Saving...')}
                </>
              ) : (
                t('common.save', 'Save')
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditProfileModal;
