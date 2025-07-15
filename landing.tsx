import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Coins, Shield, Users, TrendingUp } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = '/api/login';
  };

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Coins className="text-primary text-2xl mr-3" />
              <h1 className="text-xl font-semibold text-primary-custom">GroupTreasury</h1>
            </div>
            <Button onClick={handleLogin} className="bg-primary hover:bg-primary/90">
              Login
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-primary-custom mb-4">
            Secure Group Financial Management
          </h2>
          <p className="text-lg text-secondary-custom max-w-2xl mx-auto">
            Track contributions, manage treasury, and oversee your group's financial activities 
            with our secure and responsive platform.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto p-3 bg-primary/10 rounded-full w-fit mb-4">
                <Users className="text-primary text-2xl" />
              </div>
              <CardTitle className="text-lg">Member Portal</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Personal dashboards for tracking contributions, balances, and payment history
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto p-3 bg-secondary/10 rounded-full w-fit mb-4">
                <Shield className="text-secondary text-2xl" />
              </div>
              <CardTitle className="text-lg">Admin Control</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Comprehensive admin portal for managing members, treasury, and generating reports
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto p-3 bg-accent/10 rounded-full w-fit mb-4">
                <TrendingUp className="text-accent text-2xl" />
              </div>
              <CardTitle className="text-lg">Payment Integration</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Multiple payment options including Visa, Mastercard, MTN Mobile Money, and Airtel Money
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto p-3 bg-blue-100 rounded-full w-fit mb-4">
                <Coins className="text-blue-600 text-2xl" />
              </div>
              <CardTitle className="text-lg">Treasury Management</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Real-time treasury tracking with audit logs and comprehensive reporting
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-white rounded-lg shadow-sm p-8">
          <h3 className="text-2xl font-semibold text-primary-custom mb-4">
            Ready to Get Started?
          </h3>
          <p className="text-secondary-custom mb-6">
            Join your group and start managing your contributions today.
          </p>
          <Button onClick={handleLogin} size="lg" className="bg-primary hover:bg-primary/90">
            Access Your Account
          </Button>
        </div>
      </main>
    </div>
  );
}
