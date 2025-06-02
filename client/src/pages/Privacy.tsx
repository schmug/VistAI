import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Privacy Policy page with data handling information.
 */
export default function Privacy() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gradient-primary mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
      </div>

      <div className="space-y-6">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>1. Information We Collect</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <h4 className="font-semibold mb-2">Account Information</h4>
            <p className="mb-4">
              When you create an account, we collect your username and securely store your password 
              using industry-standard encryption.
            </p>
            
            <h4 className="font-semibold mb-2">Usage Data</h4>
            <p className="mb-4">
              We collect information about how you use VistAI, including:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Search queries and interactions with results</li>
              <li>Model preferences and click patterns</li>
              <li>Session duration and feature usage</li>
              <li>Technical information (browser, device type, IP address)</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>2. How We Use Your Information</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Service Provision:</strong> To provide and improve our AI search platform</li>
              <li><strong>Personalization:</strong> To understand model preferences and optimize results</li>
              <li><strong>Analytics:</strong> To analyze usage patterns and improve the service</li>
              <li><strong>Communication:</strong> To send important service updates and notifications</li>
              <li><strong>Security:</strong> To protect against fraud and maintain service security</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>3. Data Sharing and Third Parties</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <h4 className="font-semibold mb-2">AI Model Providers</h4>
            <p className="mb-4">
              Your search queries are sent to AI model providers (via OpenRouter) to generate responses. 
              These providers may have their own privacy policies governing the use of this data.
            </p>
            
            <h4 className="font-semibold mb-2">Service Providers</h4>
            <p className="mb-4">
              We may share data with trusted service providers who help us operate the platform, 
              including cloud hosting, analytics, and payment processing services.
            </p>
            
            <h4 className="font-semibold mb-2">Legal Requirements</h4>
            <p>
              We may disclose information when required by law, to protect our rights, or to 
              ensure the safety of our users and the public.
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>4. Data Storage and Security</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <ul className="list-disc pl-6 space-y-2">
              <li>Data is stored securely using encryption both in transit and at rest</li>
              <li>We implement industry-standard security measures to protect your information</li>
              <li>Access to user data is restricted to authorized personnel only</li>
              <li>We regularly review and update our security practices</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>5. Your Rights and Choices</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <h4 className="font-semibold mb-2">Account Management</h4>
            <ul className="list-disc pl-6 space-y-1 mb-4">
              <li>You can update your account information at any time</li>
              <li>You can delete your account and associated data</li>
              <li>You can export your search history and preferences</li>
            </ul>
            
            <h4 className="font-semibold mb-2">Data Control</h4>
            <ul className="list-disc pl-6 space-y-1">
              <li>You can request access to your personal data</li>
              <li>You can request correction of inaccurate information</li>
              <li>You can request deletion of your data (subject to legal requirements)</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>6. Cookies and Tracking</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <p>
              We use cookies and similar technologies to provide essential functionality, 
              improve user experience, and analyze service usage. You can control cookie 
              preferences through your browser settings, though this may affect some features.
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>7. Children's Privacy</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <p>
              VistAI is not intended for children under 13. We do not knowingly collect 
              personal information from children under 13. If we become aware that we have 
              collected such information, we will take steps to delete it promptly.
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>8. Changes to This Policy</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <p>
              We may update this Privacy Policy from time to time. We will notify users of 
              significant changes via email or through the service. Your continued use of 
              VistAI after changes constitutes acceptance of the updated policy.
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>9. Contact Us</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <p>
              If you have questions about this Privacy Policy or how we handle your data, 
              please contact us through our contact page or email us directly. We're committed 
              to addressing your privacy concerns promptly.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}