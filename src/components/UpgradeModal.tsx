import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import AvatarMascot from './AvatarMascot';
import { X, Check, Crown, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  const handlePremiumSelect = () => {
    // TODO: Integrate Stripe checkout for Premium
    console.log('Premium selected - integrate Stripe');
  };

  const handleProSelect = () => {
    // TODO: Integrate Stripe checkout for Pro
    console.log('Pro selected - integrate Stripe');
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-card rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[85vh] overflow-y-auto animate-slide-up">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <Crown className="w-6 h-6 text-banana" />
              <h2 className="text-xl font-bold">{t('subscription.upgradeToPremium', 'Upgrade to Premium')}</h2>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-muted rounded-full">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Mascot */}
          <div className="flex justify-center mb-6">
            <AvatarMascot mood="excited" size="lg" animate />
          </div>

          {/* Premium Plan */}
          <div className="border-2 border-banana rounded-2xl p-4 mb-4 relative bg-gradient-to-br from-banana/5 to-transparent">
            <div className="absolute -top-3 left-4 flex items-center gap-1 bg-banana text-banana-foreground text-xs px-3 py-1 rounded-full">
              <Sparkles className="w-3 h-3" />
              {t('subscription.mostPopular', 'Most Popular')}
            </div>
            <h3 className="font-bold text-lg mb-1 mt-2">{t('subscription.premium', 'Premium')}</h3>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-3xl font-black text-banana">£4.99</span>
              <span className="text-muted-foreground">{t('subscription.perMonth', '/month')}</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              or £39.99{t('subscription.perYear', '/year')} ({t('subscription.savePercent', 'save {{percent}}%').replace('{{percent}}', '33')})
            </p>
            <ul className="space-y-2 text-sm mb-4">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-success" />
                {t('subscription.unlimitedLives', 'Unlimited energy lives')}
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-success" />
                {t('subscription.noAds', 'No ads')}
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-success" />
                {t('subscription.offlineLessons', 'Offline lessons')}
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-success" />
                {t('subscription.monthlyStreakRepair', 'Monthly streak repair')}
              </li>
            </ul>
            <Button 
              onClick={handlePremiumSelect}
              className="w-full gradient-banana text-banana-foreground font-bold"
            >
              {t('subscription.startTrial', 'Start 14-Day Free Trial')}
            </Button>
          </div>

          {/* Pro Plan */}
          <div className="border border-border rounded-2xl p-4 mb-4">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-lg">{t('subscription.pro', 'Pro')}</h3>
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">Best Value</span>
            </div>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-2xl font-bold">£9.99</span>
              <span className="text-muted-foreground">{t('subscription.perMonth', '/month')}</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              or £89.99{t('subscription.perYear', '/year')} ({t('subscription.savePercent', 'save {{percent}}%').replace('{{percent}}', '25')})
            </p>
            <ul className="space-y-2 text-sm mb-4">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-success" />
                {t('subscription.everythingInPremium', 'Everything in Premium')}
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-success" />
                {t('subscription.aiExplain', 'AI Explain My Mistake')}
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-success" />
                {t('subscription.roleplayChat', 'Roleplay Chat')}
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-success" />
                {t('subscription.aiConversation', 'AI Conversation Practice')}
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-success" />
                {t('subscription.prioritySupport', 'Priority support')}
              </li>
            </ul>
            <Button 
              onClick={handleProSelect}
              variant="outline" 
              className="w-full font-bold"
            >
              {t('subscription.startTrial', 'Start 14-Day Free Trial')}
            </Button>
          </div>

          {/* Family Plan Note */}
          <p className="text-center text-sm text-muted-foreground">
            {t('subscription.familyPlan', 'Family Plan available for up to 6 members')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;
