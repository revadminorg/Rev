import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Wallet, TrendingUp, Calendar, Users, CreditCard, Smartphone, Download } from "lucide-react";
import PaymentModal from "@/components/payment-modal";
import type { User, Contribution, Treasury } from "@shared/schema";

export default function MemberDashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [paymentAmount, setPaymentAmount] = useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Fetch user contributions
  const { data: contributions = [] } = useQuery({
    queryKey: ['/api/contributions/user', user?.id],
    enabled: !!user?.id,
    retry: false,
  });

  // Fetch treasury data
  const { data: treasury } = useQuery({
    queryKey: ['/api/treasury'],
    enabled: !!user?.id,
    retry: false,
  });

  // Create contribution mutation
  const createContribution = useMutation({
    mutationFn: async (data: { amount: string; paymentMethod: string }) => {
      await apiRequest('POST', '/api/contributions', {
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        status: 'pending',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contributions/user'] });
      setShowPaymentModal(true);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to process payment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handlePayment = () => {
    if (!paymentAmount || !selectedPaymentMethod) {
      toast({
        title: "Error",
        description: "Please enter amount and select payment method",
        variant: "destructive",
      });
      return;
    }

    createContribution.mutate({
      amount: paymentAmount,
      paymentMethod: selectedPaymentMethod,
    });
  };

  const handleLogout = () => {
    window.location.href = '/api/logout';
  };

  const formatCurrency = (amount: string | number) => {
    return `UGX ${new Intl.NumberFormat().format(Number(amount))}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-secondary text-white">Confirmed</Badge>;
      case 'pending':
        return <Badge className="bg-accent text-white">Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'visa':
      case 'mastercard':
        return <CreditCard className="w-5 h-5" />;
      case 'mtn':
      case 'airtel':
        return <Smartphone className="w-5 h-5" />;
      default:
        return <CreditCard className="w-5 h-5" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Wallet className="text-primary text-2xl mr-3" />
              <h1 className="text-xl font-semibold">GroupTreasury</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium">
                    {user?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
                  </span>
                </div>
                <span className="text-sm font-medium">
                  {user?.firstName && user?.lastName 
                    ? `${user.firstName} ${user.lastName}`
                    : user?.email || 'User'
                  }
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Wallet className="text-primary text-xl" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-muted-foreground">Current Balance</p>
                  <p className="text-2xl font-semibold text-primary">
                    {formatCurrency(user?.currentBalance || 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-secondary/10 rounded-full">
                  <TrendingUp className="text-secondary text-xl" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-muted-foreground">Total Contributed</p>
                  <p className="text-2xl font-semibold text-secondary">
                    {formatCurrency(user?.totalContributed || 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-accent/10 rounded-full">
                  <Calendar className="text-accent text-xl" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-muted-foreground">This Month</p>
                  <p className="text-2xl font-semibold text-accent">
                    {formatCurrency(
                      contributions
                        .filter(c => c.status === 'confirmed' && 
                          new Date(c.createdAt!).getMonth() === new Date().getMonth())
                        .reduce((sum, c) => sum + Number(c.amount), 0)
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-full">
                  <Users className="text-blue-600 text-xl" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-muted-foreground">Group Treasury</p>
                  <p className="text-2xl font-semibold text-blue-600">
                    {formatCurrency(treasury?.totalBalance || 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment and History */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Payment Section */}
          <Card>
            <CardHeader>
              <CardTitle>Make a Payment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="amount">Amount (UGX)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="Enter amount"
                />
              </div>
              
              <div>
                <Label>Payment Method</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {[
                    { id: 'visa', label: 'Visa', icon: 'visa' },
                    { id: 'mastercard', label: 'Mastercard', icon: 'mastercard' },
                    { id: 'mtn', label: 'MTN Money', icon: 'mtn' },
                    { id: 'airtel', label: 'Airtel Money', icon: 'airtel' },
                  ].map((method) => (
                    <Button
                      key={method.id}
                      variant={selectedPaymentMethod === method.id ? "default" : "outline"}
                      className="flex items-center justify-center p-3"
                      onClick={() => setSelectedPaymentMethod(method.id)}
                    >
                      {getPaymentMethodIcon(method.icon)}
                      <span className="ml-2 text-sm">{method.label}</span>
                    </Button>
                  ))}
                </div>
              </div>
              
              <Button 
                onClick={handlePayment}
                disabled={createContribution.isPending}
                className="w-full"
              >
                <CreditCard className="mr-2 h-4 w-4" />
                {createContribution.isPending ? 'Processing...' : 'Pay Now'}
              </Button>
            </CardContent>
          </Card>

          {/* Recent Contributions */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Contributions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {contributions.slice(0, 5).map((contribution: Contribution) => (
                  <div key={contribution.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <div>
                      <p className="font-medium">
                        {new Date(contribution.createdAt!).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(contribution.amount)}
                      </p>
                    </div>
                    {getStatusBadge(contribution.status)}
                  </div>
                ))}
                {contributions.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No contributions yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transaction History */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Date</th>
                    <th className="text-left py-3 px-4">Amount</th>
                    <th className="text-left py-3 px-4">Method</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-left py-3 px-4">Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {contributions.map((contribution: Contribution) => (
                    <tr key={contribution.id} className="border-b">
                      <td className="py-3 px-4">
                        {new Date(contribution.createdAt!).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">{formatCurrency(contribution.amount)}</td>
                      <td className="py-3 px-4 capitalize">{contribution.paymentMethod}</td>
                      <td className="py-3 px-4">{getStatusBadge(contribution.status)}</td>
                      <td className="py-3 px-4">
                        {contribution.status === 'confirmed' && (
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {contributions.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No transactions found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        amount={paymentAmount}
        paymentMethod={selectedPaymentMethod}
      />
    </div>
  );
}
