import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Terms of Service page with legal information.
 */
export default function Terms() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gradient-primary mb-2">Terms of Service</h1>
        <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
      </div>

      <div className="space-y-6">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>1. Acceptance of Terms</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <p>
              By accessing and using VistAI ("the Service"), you accept and agree to be bound by the 
              terms and provision of this agreement. If you do not agree to abide by the above, 
              please do not use this service.
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>2. Description of Service</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <p>
              VistAI is a platform that allows users to search and compare results from multiple 
              AI language models. The service aggregates responses from various AI providers to 
              help users find the best answers to their queries.
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>3. User Responsibilities</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <ul className="list-disc pl-6 space-y-2">
              <li>You must provide accurate registration information</li>
              <li>You are responsible for maintaining the security of your account</li>
              <li>You must not use the service for illegal or harmful purposes</li>
              <li>You must not attempt to circumvent usage limits or restrictions</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>4. Privacy and Data</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <p>
              Your privacy is important to us. Please review our Privacy Policy, which also 
              governs your use of the Service, to understand our practices regarding the 
              collection and use of your information.
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>5. Service Availability</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <p>
              We strive to provide reliable service but cannot guarantee 100% uptime. The service 
              may be temporarily unavailable due to maintenance, updates, or technical issues. 
              We are not liable for any damages resulting from service interruptions.
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>6. Limitation of Liability</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <p>
              VistAI is provided "as is" without warranties of any kind. We shall not be liable 
              for any direct, indirect, incidental, special, or consequential damages resulting 
              from the use or inability to use the service.
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>7. Changes to Terms</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <p>
              We reserve the right to modify these terms at any time. Users will be notified 
              of significant changes via email or through the service. Continued use of the 
              service after changes constitutes acceptance of the new terms.
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>8. Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <p>
              If you have any questions about these Terms of Service, please contact us through 
              our contact page or email us directly.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}