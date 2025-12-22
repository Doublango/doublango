import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BottomNavigation from '@/components/BottomNavigation';

const PrivacyPolicy: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border z-40 px-4 py-3">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-bold text-lg">Privacy Policy</h1>
        </div>
      </header>

      <main className="px-4 py-6 max-w-lg mx-auto prose prose-sm dark:prose-invert">
        <h2>DoubLango Privacy Policy</h2>
        <p className="text-muted-foreground">Last updated: December 2024</p>

        <h3>1. Information We Collect</h3>
        <p>We collect information you provide directly to us, such as:</p>
        <ul>
          <li>Account information (email, username, display name)</li>
          <li>Learning progress and achievements</li>
          <li>Language preferences and settings</li>
          <li>Voice recordings for speech practice (processed locally, not stored)</li>
        </ul>

        <h3>2. How We Use Your Information</h3>
        <p>We use the information we collect to:</p>
        <ul>
          <li>Provide, maintain, and improve our language learning services</li>
          <li>Track your learning progress and personalize your experience</li>
          <li>Send you updates about your streak and achievements</li>
          <li>Respond to your comments, questions, and requests</li>
        </ul>

        <h3>3. Data Storage and Security</h3>
        <p>Your data is stored securely using industry-standard encryption. We use Supabase for data storage, which provides enterprise-grade security measures.</p>

        <h3>4. Speech Recognition</h3>
        <p>When you use our speech practice features, audio is processed by your device's built-in speech recognition or our cloud TTS service. We do not store audio recordings.</p>

        <h3>5. Third-Party Services</h3>
        <p>We may use third-party services for:</p>
        <ul>
          <li>Authentication (email providers)</li>
          <li>Text-to-speech (Google Cloud TTS)</li>
          <li>AI-powered lesson generation</li>
        </ul>

        <h3>6. Your Rights</h3>
        <p>You have the right to:</p>
        <ul>
          <li>Access your personal data</li>
          <li>Correct inaccurate data</li>
          <li>Delete your account and associated data</li>
          <li>Export your learning data</li>
        </ul>

        <h3>7. Children's Privacy</h3>
        <p>Our Kids Mode is designed to be safe for children. We minimize data collection and do not display advertisements in Kids Mode.</p>

        <h3>8. Contact Us</h3>
        <p>If you have questions about this Privacy Policy, please contact us at privacy@doublango.com</p>

        <h3>9. Changes to This Policy</h3>
        <p>We may update this policy from time to time. We will notify you of any changes by posting the new policy on this page.</p>
      </main>

      <BottomNavigation />
    </div>
  );
};

export default PrivacyPolicy;
