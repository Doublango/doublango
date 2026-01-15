import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAppSettings, AvatarType } from '@/contexts/AppSettingsContext';
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

// Avatar options with bright, interesting animals
const AVATAR_OPTIONS: { type: AvatarType; emoji: string; name: string; color: string }[] = [
  { type: 'parrot', emoji: '🦜', name: 'Rio', color: 'from-green-400 to-emerald-500' },
  { type: 'fox', emoji: '🦊', name: 'Foxy', color: 'from-orange-400 to-amber-500' },
  { type: 'panda', emoji: '🐼', name: 'Bao', color: 'from-slate-300 to-slate-400' },
  { type: 'unicorn', emoji: '🦄', name: 'Sparkle', color: 'from-pink-400 to-purple-500' },
  { type: 'penguin', emoji: '🐧', name: 'Waddle', color: 'from-sky-400 to-blue-500' },
  { type: 'lion', emoji: '🦁', name: 'Leo', color: 'from-yellow-400 to-orange-500' },
  { type: 'bunny', emoji: '🐰', name: 'Hoppy', color: 'from-pink-300 to-rose-400' },
  { type: 'koala', emoji: '🐨', name: 'Koko', color: 'from-gray-400 to-slate-500' },
  { type: 'tiger', emoji: '🐯', name: 'Stripes', color: 'from-orange-500 to-red-500' },
  { type: 'monkey', emoji: '🐵', name: 'Mango', color: 'from-amber-400 to-yellow-500' },
];

const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSave,
}) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { settings, setAvatar } = useAppSettings();
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarType>(settings.avatar);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setUsername(profile.username || '');
    }
    setSelectedAvatar(settings.avatar);
  }, [profile, settings.avatar]);

  if (!isOpen || !profile) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: displayName.trim() || null,
          username: username.trim() || null,
          avatar_url: selectedAvatar, // Store avatar type as string
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);

      if (error) throw error;

      // Update app settings with selected avatar
      setAvatar(selectedAvatar);

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
            <div className="grid grid-cols-5 gap-2">
              {AVATAR_OPTIONS.map((avatar) => (
                <button
                  key={avatar.type}
                  onClick={() => setSelectedAvatar(avatar.type)}
                  className={cn(
                    'relative p-2 rounded-xl border-2 transition-all text-center overflow-hidden group',
                    selectedAvatar === avatar.type
                      ? 'border-primary bg-primary/10 scale-105 ring-2 ring-primary/30'
                      : 'border-border hover:border-primary/50 hover:scale-102'
                  )}
                >
                  {/* Gradient glow */}
                  <div className={cn(
                    'absolute inset-0 bg-gradient-to-br opacity-20 group-hover:opacity-30 transition-opacity',
                    avatar.color
                  )} />
                  
                  {selectedAvatar === avatar.type && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center z-10">
                      <Check className="w-2.5 h-2.5 text-primary-foreground" />
                    </div>
                  )}
                  
                  <div className="relative z-10">
                    <span className={cn(
                      'text-2xl block mb-0.5 group-hover:scale-110 transition-transform',
                      selectedAvatar === avatar.type && 'animate-bounce'
                    )}>
                      {avatar.emoji}
                    </span>
                    <p className="text-[10px] font-medium truncate">{avatar.name}</p>
                  </div>
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
