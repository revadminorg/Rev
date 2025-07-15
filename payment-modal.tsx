import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: string;
  paymentMethod: string;
}

export default function PaymentModal({ isOpen, onClose, amount, paymentMethod }: PaymentModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Simulate payment processing
  const processPayment = useMutation({
    mutationFn: async () => {
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Simulate random success/failure (80% success rate)
      const success = Math.random() > 0.2;
      
      return {
        success,
        message: success ? "Payment processed successfully!" : "Payment failed. Please try again."
      };
    },
    onSuccess: (data) => {
      setResult(data);
      setIsProcessing(false);
      
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ['/api/contributions/user'] });
        toast({
          title: "Success",
          description: data.message,
        });
      } else {
        toast({
          title: "Error",
          description: data.message,
          variant: "destructive",
        });
      }
    },
    onError: () => {
      setIsProcessing(false);
      setResult({
        success: false,
        message: "Payment processing failed. Please try again."
      });
      toast({
        title: "Error",
        description: "Payment processing failed. Please try again.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (isOpen) {
      setIsProcessing(true);
      setResult(null);
      processPayment.mutate();
    }
  }, [isOpen]);

  const handleClose = () => {
    if (!isProcessing) {
      onClose();
    }
  };

  const formatCurrency = (amount: string | number) => {
    return `UGX ${new Intl.NumberFormat().format(Number(amount))}`;
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'visa':
        return 'Visa';
      case 'mastercard':
        return 'Mastercard';
      case 'mtn':
        return 'MTN Mobile Money';
      case 'airtel':
        return 'Airtel Money';
      default:
        return method;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Payment Processing</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">Amount</p>
            <p className="text-2xl font-semibold">{formatCurrency(amount)}</p>
            <p className="text-sm text-muted-foreground">via {getPaymentMethodLabel(paymentMethod)}</p>
          </div>

          {isProcessing && (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Processing your payment...</p>
              <p className="text-sm text-muted-foreground mt-2">Please wait while we confirm your transaction</p>
            </div>
          )}

          {result && !isProcessing && (
            <div className="text-center py-8">
              {result.success ? (
                <>
                  <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-4" />
                  <p className="text-green-600 font-medium">{result.message}</p>
                </>
              ) : (
                <>
                  <XCircle className="h-8 w-8 text-red-600 mx-auto mb-4" />
                  <p className="text-red-600 font-medium">{result.message}</p>
                </>
              )}
            </div>
          )}

          <div className="flex justify-center space-x-3">
            {isProcessing && (
              <Button variant="outline" disabled>
                Cancel
              </Button>
            )}
            
            {result && !isProcessing && (
              <Button onClick={handleClose}>
                Close
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
