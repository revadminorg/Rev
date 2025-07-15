import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminSidebar from "@/components/admin-sidebar";
import { Shield, TrendingUp, Users, CheckCircle, Edit, Eye, Trash2, Download, Filter } from "lucide-react";
import type { User, Contribution, Treasury, TreasuryAdjustment, AuditLog } from "@shared/schema";

export default function AdminDashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [adjustmentType, setAdjustmentType] = useState('');
  const [adjustmentAmount, setAdjustmentAmount] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');

  // Redirect to login if not authenticated or not admin
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'admin')) {
      toast({
        title: "Unauthorized",
        description: "Admin access required. Redirecting to login...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, user?.role, toast]);

  // Fetch data
  const { data: members = [] } = useQuery({
    queryKey: ['/api/members'],
    enabled: !!user && user.role === 'admin',
    retry: false,
  });

  const { data: contributions = [] } = useQuery({
    queryKey: ['/api/contributions'],
    enabled: !!user && user.role === 'admin',
    retry: false,
  });

  const { data: treasury } = useQuery({
    queryKey: ['/api/treasury'],
    enabled: !!user && user.role === 'admin',
    retry: false,
  });

  const { data: adjustments = [] } = useQuery({
    queryKey: ['/api/treasury/adjustments'],
    enabled: !!user && user.role === 'admin',
    retry: false,
  });

  const { data: auditLogs = [] } = useQuery({
    queryKey: ['/api/audit'],
    enabled: !!user && user.role === 'admin',
    retry: false,
  });

  const { data: stats } = useQuery({
    queryKey: ['/api/stats'],
    enabled: !!user && user.role === 'admin',
    retry: false,
  });

  // Treasury adjustment mutation
  const createAdjustment = useMutation({
    mutationFn: async (data: { type: string; amount: string; reason: string }) => {
      await apiRequest('POST', '/api/treasury/adjust', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/treasury'] });
      queryClient.invalidateQueries({ queryKey: ['/api/treasury/adjustments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/audit'] });
      setAdjustmentType('');
      setAdjustmentAmount('');
      setAdjustmentReason('');
      toast({
        title: "Success",
        description: "Treasury adjustment applied successfully",
      });
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
        description: "Failed to apply treasury adjustment",
        variant: "destructive",
      });
    },
  });

  // Contribution status update mutation
  const updateContributionStatus = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      await apiRequest('PATCH', `/api/contributions/${id}/status`, { 
        status, 
        transactionId: status === 'confirmed' ? `TXN${Date.now()}` : undefined 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contributions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/audit'] });
      toast({
        title: "Success",
        description: "Contribution status updated successfully",
      });
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
        description: "Failed to update contribution status",
        variant: "destructive",
      });
    },
  });

  const handleAdjustment = () => {
    if (!adjustmentType || !adjustmentAmount || !adjustmentReason) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    createAdjustment.mutate({
      type: adjustmentType,
      amount: adjustmentAmount,
      reason: adjustmentReason,
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
        return <Badge className="bg-green-600 text-white">Confirmed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-600 text-white">Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getAdjustmentBadge = (type: string) => {
    switch (type) {
      case 'deposit':
      case 'interest':
        return <Badge className="bg-green-600 text-white">Deposit</Badge>;
      case 'withdrawal':
      case 'fee':
        return <Badge className="bg-red-600 text-white">Withdrawal</Badge>;
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  const getActionBadge = (action: string) => {
    const colors = {
      'Payment Confirmed': 'bg-green-600',
      'Payment Initiated': 'bg-blue-600',
      'Treasury Adjusted': 'bg-yellow-600',
      'Member Added': 'bg-purple-600',
      'Login': 'bg-gray-600',
    };
    
    const color = colors[action as keyof typeof colors] || 'bg-gray-600';
    return <Badge className={`${color} text-white`}>{action}</Badge>;
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
              <Shield className="text-primary text-2xl mr-3" />
              <h1 className="text-xl font-semibold">Admin Portal</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Shield className="text-gray-400 text-xl" />
                <span className="text-sm font-medium">
                  {user?.firstName && user?.lastName 
                    ? `${user.firstName} ${user.lastName}`
                    : 'Finance Officer'
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

      <div className="flex">
        {/* Sidebar */}
        <AdminSidebar 
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />

        {/* Main Content */}
        <main className="flex-1 p-8">
          {/* Dashboard Section */}
          {activeSection === 'dashboard' && (
            <div>
              <h2 className="text-2xl font-semibold mb-6">Dashboard Overview</h2>
              
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="p-3 bg-primary/10 rounded-full">
                        <TrendingUp className="text-primary text-xl" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm text-muted-foreground">Total Treasury</p>
                        <p className="text-2xl font-semibold text-primary">
                          {formatCurrency(treasury?.totalBalance || 0)}
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
                        <p className="text-sm text-muted-foreground">Monthly Contributions</p>
                        <p className="text-2xl font-semibold text-secondary">
                          {formatCurrency(stats?.totalThisMonth || 0)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="p-3 bg-accent/10 rounded-full">
                        <Users className="text-accent text-xl" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm text-muted-foreground">Active Members</p>
                        <p className="text-2xl font-semibold text-accent">
                          {stats?.activeMembers || 0}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="p-3 bg-green-100 rounded-full">
                        <CheckCircle className="text-green-600 text-xl" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm text-muted-foreground">Confirmed Payments</p>
                        <p className="text-2xl font-semibold text-green-600">
                          {stats?.totalConfirmed || 0}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {auditLogs.slice(0, 5).map((log: AuditLog) => (
                      <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                        <div className="flex items-center">
                          <CheckCircle className="text-secondary mr-3" />
                          <div>
                            <p className="font-medium">{log.action}</p>
                            <p className="text-sm text-muted-foreground">{log.details}</p>
                          </div>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {new Date(log.createdAt!).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Members Section */}
          {activeSection === 'members' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold">Manage Members</h2>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Members</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left py-3 px-4 font-medium">Name</th>
                          <th className="text-left py-3 px-4 font-medium">Email</th>
                          <th className="text-left py-3 px-4 font-medium">Total Contributed</th>
                          <th className="text-left py-3 px-4 font-medium">Current Balance</th>
                          <th className="text-left py-3 px-4 font-medium">Last Payment</th>
                          <th className="text-left py-3 px-4 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {members.map((member: User) => (
                          <tr key={member.id} className="border-b">
                            <td className="py-3 px-4">
                              {member.firstName && member.lastName 
                                ? `${member.firstName} ${member.lastName}`
                                : member.email
                              }
                            </td>
                            <td className="py-3 px-4">{member.email}</td>
                            <td className="py-3 px-4">{formatCurrency(member.totalContributed || 0)}</td>
                            <td className="py-3 px-4">{formatCurrency(member.currentBalance || 0)}</td>
                            <td className="py-3 px-4">
                              {member.lastPaymentDate 
                                ? new Date(member.lastPaymentDate).toLocaleDateString()
                                : 'Never'
                              }
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex space-x-2">
                                <Button variant="ghost" size="sm">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Treasury Section */}
          {activeSection === 'treasury' && (
            <div>
              <h2 className="text-2xl font-semibold mb-6">Treasury Management</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Treasury Overview */}
                <Card>
                  <CardHeader>
                    <CardTitle>Treasury Balance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-primary mb-4">
                      {formatCurrency(treasury?.totalBalance || 0)}
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Contributions:</span>
                        <span className="font-medium">
                          {formatCurrency(treasury?.totalContributions || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Withdrawals:</span>
                        <span className="font-medium">
                          {formatCurrency(treasury?.totalWithdrawals || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Interest Earned:</span>
                        <span className="font-medium text-secondary">
                          {formatCurrency(treasury?.interestEarned || 0)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Manual Adjustment */}
                <Card>
                  <CardHeader>
                    <CardTitle>Manual Adjustment</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="adjustment-type">Adjustment Type</Label>
                      <Select value={adjustmentType} onValueChange={setAdjustmentType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="deposit">External Deposit</SelectItem>
                          <SelectItem value="withdrawal">External Withdrawal</SelectItem>
                          <SelectItem value="interest">Interest Payment</SelectItem>
                          <SelectItem value="fee">Fee Deduction</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="adjustment-amount">Amount (UGX)</Label>
                      <Input
                        id="adjustment-amount"
                        type="number"
                        value={adjustmentAmount}
                        onChange={(e) => setAdjustmentAmount(e.target.value)}
                        placeholder="Enter amount"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="adjustment-reason">Reason</Label>
                      <Textarea
                        id="adjustment-reason"
                        value={adjustmentReason}
                        onChange={(e) => setAdjustmentReason(e.target.value)}
                        placeholder="Enter reason for adjustment"
                        rows={3}
                      />
                    </div>
                    
                    <Button 
                      onClick={handleAdjustment}
                      disabled={createAdjustment.isPending}
                      className="w-full"
                    >
                      {createAdjustment.isPending ? 'Processing...' : 'Apply Adjustment'}
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Adjustments */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Adjustments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left py-3 px-4 font-medium">Date</th>
                          <th className="text-left py-3 px-4 font-medium">Type</th>
                          <th className="text-left py-3 px-4 font-medium">Amount</th>
                          <th className="text-left py-3 px-4 font-medium">Reason</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adjustments.map((adjustment: TreasuryAdjustment) => (
                          <tr key={adjustment.id} className="border-b">
                            <td className="py-3 px-4">
                              {new Date(adjustment.createdAt!).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4">
                              {getAdjustmentBadge(adjustment.type)}
                            </td>
                            <td className="py-3 px-4">
                              <span className={
                                adjustment.type === 'deposit' || adjustment.type === 'interest'
                                  ? 'text-green-600' : 'text-red-600'
                              }>
                                {adjustment.type === 'deposit' || adjustment.type === 'interest' ? '+' : '-'}
                                {formatCurrency(adjustment.amount)}
                              </span>
                            </td>
                            <td className="py-3 px-4">{adjustment.reason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Contributions Section */}
          {activeSection === 'contributions' && (
            <div>
              <h2 className="text-2xl font-semibold mb-6">Manage Contributions</h2>
              
              <Card>
                <CardHeader>
                  <CardTitle>All Contributions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left py-3 px-4 font-medium">Date</th>
                          <th className="text-left py-3 px-4 font-medium">User</th>
                          <th className="text-left py-3 px-4 font-medium">Amount</th>
                          <th className="text-left py-3 px-4 font-medium">Method</th>
                          <th className="text-left py-3 px-4 font-medium">Status</th>
                          <th className="text-left py-3 px-4 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {contributions.map((contribution: Contribution) => (
                          <tr key={contribution.id} className="border-b">
                            <td className="py-3 px-4">
                              {new Date(contribution.createdAt!).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4">{contribution.userId}</td>
                            <td className="py-3 px-4">{formatCurrency(contribution.amount)}</td>
                            <td className="py-3 px-4 capitalize">{contribution.paymentMethod}</td>
                            <td className="py-3 px-4">{getStatusBadge(contribution.status)}</td>
                            <td className="py-3 px-4">
                              {contribution.status === 'pending' && (
                                <div className="flex space-x-2">
                                  <Button 
                                    size="sm"
                                    onClick={() => updateContributionStatus.mutate({
                                      id: contribution.id,
                                      status: 'confirmed'
                                    })}
                                    disabled={updateContributionStatus.isPending}
                                  >
                                    Confirm
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="destructive"
                                    onClick={() => updateContributionStatus.mutate({
                                      id: contribution.id,
                                      status: 'failed'
                                    })}
                                    disabled={updateContributionStatus.isPending}
                                  >
                                    Reject
                                  </Button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Audit Log Section */}
          {activeSection === 'audit' && (
            <div>
              <h2 className="text-2xl font-semibold mb-6">Audit Log</h2>
              
              <Card>
                <CardHeader>
                  <CardTitle>System Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left py-3 px-4 font-medium">Timestamp</th>
                          <th className="text-left py-3 px-4 font-medium">Action</th>
                          <th className="text-left py-3 px-4 font-medium">Details</th>
                          <th className="text-left py-3 px-4 font-medium">IP Address</th>
                        </tr>
                      </thead>
                      <tbody>
                        {auditLogs.map((log: AuditLog) => (
                          <tr key={log.id} className="border-b">
                            <td className="py-3 px-4">
                              {new Date(log.createdAt!).toLocaleString()}
                            </td>
                            <td className="py-3 px-4">
                              {getActionBadge(log.action)}
                            </td>
                            <td className="py-3 px-4">{log.details}</td>
                            <td className="py-3 px-4">{log.ipAddress || 'Unknown'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
