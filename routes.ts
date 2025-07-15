import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertContributionSchema, insertTreasuryAdjustmentSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Test route for demo purposes - bypass authentication
  app.get('/api/auth/user', async (req: any, res) => {
    try {
      // For demo purposes, return a test user
      const testUser = await storage.getUser('admin-123'); // or 'member-456' for member view
      if (testUser) {
        res.json(testUser);
      } else {
        res.status(401).json({ message: "Unauthorized" });
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Member routes (bypassed for demo)
  app.get('/api/members', async (req: any, res) => {
    try {
      const members = await storage.getAllMembers();
      res.json(members);
    } catch (error) {
      console.error("Error fetching members:", error);
      res.status(500).json({ message: "Failed to fetch members" });
    }
  });

  // Contribution routes
  app.post('/api/contributions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertContributionSchema.parse({
        ...req.body,
        userId,
      });
      
      const contribution = await storage.createContribution(validatedData);
      
      // Log the action
      await storage.createAuditLog({
        action: "Payment Initiated",
        details: `User initiated payment of UGX ${validatedData.amount} via ${validatedData.paymentMethod}`,
        adminId: userId,
        ipAddress: req.ip,
      });
      
      res.json(contribution);
    } catch (error) {
      console.error("Error creating contribution:", error);
      res.status(500).json({ message: "Failed to create contribution" });
    }
  });

  app.get('/api/contributions/user/:userId', async (req: any, res) => {
    try {
      const targetUserId = req.params.userId;
      const contributions = await storage.getContributionsByUser(targetUserId);
      res.json(contributions);
    } catch (error) {
      console.error("Error fetching contributions:", error);
      res.status(500).json({ message: "Failed to fetch contributions" });
    }
  });

  app.get('/api/contributions', async (req: any, res) => {
    try {
      const contributions = await storage.getAllContributions();
      res.json(contributions);
    } catch (error) {
      console.error("Error fetching contributions:", error);
      res.status(500).json({ message: "Failed to fetch contributions" });
    }
  });

  app.patch('/api/contributions/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const { status, transactionId } = req.body;
      const contributionId = parseInt(req.params.id);
      
      await storage.updateContributionStatus(contributionId, status, transactionId);
      
      // Log the action
      await storage.createAuditLog({
        action: "Payment Status Updated",
        details: `Updated contribution ${contributionId} status to ${status}`,
        adminId: req.user.claims.sub,
        ipAddress: req.ip,
      });
      
      res.json({ message: "Status updated successfully" });
    } catch (error) {
      console.error("Error updating contribution status:", error);
      res.status(500).json({ message: "Failed to update contribution status" });
    }
  });

  // Treasury routes (bypassed for demo)
  app.get('/api/treasury', async (req: any, res) => {
    try {
      const treasury = await storage.getTreasury();
      res.json(treasury);
    } catch (error) {
      console.error("Error fetching treasury:", error);
      res.status(500).json({ message: "Failed to fetch treasury" });
    }
  });

  app.post('/api/treasury/adjust', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const validatedData = insertTreasuryAdjustmentSchema.parse({
        ...req.body,
        adminId: req.user.claims.sub,
      });
      
      const adjustment = await storage.createTreasuryAdjustment(validatedData);
      
      // Update treasury balance
      const currentTreasury = await storage.getTreasury();
      const currentBalance = parseFloat(currentTreasury?.totalBalance || "0");
      const adjustmentAmount = parseFloat(validatedData.amount);
      
      let newBalance = currentBalance;
      if (validatedData.type === 'deposit' || validatedData.type === 'interest') {
        newBalance += adjustmentAmount;
      } else {
        newBalance -= adjustmentAmount;
      }
      
      await storage.updateTreasury({
        totalBalance: newBalance.toString(),
      });
      
      // Log the action
      await storage.createAuditLog({
        action: "Treasury Adjusted",
        details: `${validatedData.type}: ${validatedData.amount} - ${validatedData.reason}`,
        adminId: req.user.claims.sub,
        ipAddress: req.ip,
      });
      
      res.json(adjustment);
    } catch (error) {
      console.error("Error creating treasury adjustment:", error);
      res.status(500).json({ message: "Failed to create treasury adjustment" });
    }
  });

  app.get('/api/treasury/adjustments', async (req: any, res) => {
    try {
      const adjustments = await storage.getTreasuryAdjustments();
      res.json(adjustments);
    } catch (error) {
      console.error("Error fetching treasury adjustments:", error);
      res.status(500).json({ message: "Failed to fetch treasury adjustments" });
    }
  });

  // Audit routes (bypassed for demo)
  app.get('/api/audit', async (req: any, res) => {
    try {
      const logs = await storage.getAuditLogs();
      res.json(logs);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });

  // Statistics routes (bypassed for demo)
  app.get('/api/stats', async (req: any, res) => {
    try {
      const stats = await storage.getContributionStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Payment simulation endpoint (for demo purposes)
  app.post('/api/payments/simulate', isAuthenticated, async (req: any, res) => {
    try {
      const { contributionId, success } = req.body;
      const status = success ? "confirmed" : "failed";
      const transactionId = success ? `TXN${Date.now()}` : undefined;
      
      await storage.updateContributionStatus(contributionId, status, transactionId);
      
      res.json({ 
        success,
        transactionId,
        message: success ? "Payment processed successfully" : "Payment failed"
      });
    } catch (error) {
      console.error("Error simulating payment:", error);
      res.status(500).json({ message: "Failed to simulate payment" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
