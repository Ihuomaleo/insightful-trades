import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link to="/">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>

          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-profit flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold">Privacy Policy</h1>
          </div>

          <div className="prose prose-invert max-w-none space-y-8">
            <p className="text-muted-foreground text-lg">
              Last updated: January 13, 2026
            </p>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">Introduction</h2>
              <p className="text-muted-foreground leading-relaxed">
                Trade Journal ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our trading journal application.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">Information We Collect</h2>
              <p className="text-muted-foreground leading-relaxed">
                We collect information that you provide directly to us, including:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Email address (for account authentication)</li>
                <li>Profile name (for personalization)</li>
                <li>Trading data you choose to log (trades, notes, screenshots)</li>
                <li>Application preferences and settings</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed">
                <strong className="text-foreground">We only collect email addresses and profile names for user authentication purposes.</strong> This minimal data collection approach ensures your privacy while providing you with a personalized experience.
              </p>
            </section>

            <section className="space-y-4 bg-card/50 p-6 rounded-xl border border-border">
              <h2 className="text-2xl font-semibold text-foreground">Google API Disclosure</h2>
              <p className="text-muted-foreground leading-relaxed">
                Trade Journal uses Google APIs to provide secure and convenient authentication services. When you choose to sign in with Google, we access your basic profile information (email and name) to create and manage your account.
              </p>
              <p className="text-foreground leading-relaxed font-medium">
                Trade Journal's use and transfer of information received from Google APIs to any other app will adhere to the{' '}
                <a 
                  href="https://developers.google.com/terms/api-services-user-data-policy" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Google API Services User Data Policy
                </a>
                , including the Limited Use requirements.
              </p>
              <div className="mt-4 space-y-3">
                <p className="text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">Our commitments regarding Google user data:</strong>
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li>We only collect basic profile information (email and name) for authentication purposes.</li>
                  <li>We do not use Google user data for advertising or marketing purposes.</li>
                  <li>We do not sell user data to third parties.</li>
                  <li>We do not allow humans to read user data unless we have explicit user consent for troubleshooting purposes.</li>
                </ul>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">How We Use Your Information</h2>
              <p className="text-muted-foreground leading-relaxed">
                We use the information we collect to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Create and manage your user account</li>
                <li>Provide, maintain, and improve our services</li>
                <li>Store and display your trading journal entries</li>
                <li>Generate analytics and performance insights from your trading data</li>
                <li>Send you important updates about our service</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">Data Sharing and Disclosure</h2>
              <p className="text-muted-foreground leading-relaxed">
                <strong className="text-foreground">We do not sell, trade, or rent your personal information to third parties.</strong> Your trading data and personal information remain confidential and are used solely for providing you with our services.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                We may share information only in the following limited circumstances:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>With your explicit consent</li>
                <li>To comply with legal obligations</li>
                <li>To protect and defend our rights and property</li>
                <li>With service providers who assist in operating our application (under strict confidentiality agreements)</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">Data Security</h2>
              <p className="text-muted-foreground leading-relaxed">
                We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. Your data is encrypted in transit and at rest.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">Data Retention</h2>
              <p className="text-muted-foreground leading-relaxed">
                We retain your personal information for as long as your account is active or as needed to provide you services. You may request deletion of your account and associated data at any time through the Settings page.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">Your Rights</h2>
              <p className="text-muted-foreground leading-relaxed">
                You have the right to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Access and export your personal data</li>
                <li>Request correction of inaccurate data</li>
                <li>Request deletion of your account and data</li>
                <li>Opt out of non-essential communications</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">Changes to This Policy</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have any questions about this Privacy Policy, please contact us through the application's support channels.
              </p>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-border text-center text-muted-foreground">
            <p>© 2026 Trade Journal. All rights reserved.</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
