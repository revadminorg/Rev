import {
  users,
  contributions,
  treasury,
  treasuryAdjustments,
  auditLogs,
  type User,
  type UpsertUser,
  type InsertContribution,
  type Contribution,
  type InsertTreasuryAdjustment,
  type TreasuryAdjustment,
  type Treasury,
  type InsertAuditLog,
  type AuditLog,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, sum } from "drizzle-orm";

export interface IStorage {
  // User operations - required for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Member operations
  getAllMembers(): Promise<User[]>;
  updateMemberBalance(userId: string, totalContributed: string, currentBalance: string): Promise<void>;
  
  // Contribution operations
  createContribution(contribution: InsertContribution): Promise<Contribution>;
  getContributionsByUser(userId: string): Promise<Contribution[]>;
  updateContributionStatus(id: number, status: string, transactionId?: string): Promise<void>;
  getAllContributions(): Promise<Contribution[]>;
  
  // Treasury operations
  getTreasury(): Promise<Treasury | undefined>;
  updateTreasury(data: Partial<Treasury>): Promise<void>;
  createTreasuryAdjustment(adjustment: InsertTreasuryAdjustment): Promise<TreasuryAdjustment>;
  getTreasuryAdjustments(): Promise<TreasuryAdjustment[]>;
  
  // Audit operations
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(): Promise<AuditLog[]>;
  
  // Statistics
  getContributionStats(): Promise<{
    totalThisMonth: string;
    totalConfirmed: number;
    activeMembers: number;
    paymentRate: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Member operations
  async getAllMembers(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(eq(users.role, "member"))
      .orderBy(desc(users.createdAt));
  }

  async updateMemberBalance(userId: string, totalContributed: string, currentBalance: string): Promise<void> {
    await db
      .update(users)
      .set({
        totalContributed,
        currentBalance,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  // Contribution operations
  async createContribution(contribution: InsertContribution): Promise<Contribution> {
    const [newContribution] = await db
      .insert(contributions)
      .values(contribution)
      .returning();
    return newContribution;
  }

  async getContributionsByUser(userId: string): Promise<Contribution[]> {
    return await db
      .select()
      .from(contributions)
      .where(eq(contributions.userId, userId))
      .orderBy(desc(contributions.createdAt));
  }

  async updateContributionStatus(id: number, status: string, transactionId?: string): Promise<void> {
    const updateData: any = {
      status,
      confirmedAt: status === "confirmed" ? new Date() : null,
    };
    
    if (transactionId) {
      updateData.transactionId = transactionId;
    }

    await db
      .update(contributions)
      .set(updateData)
      .where(eq(contributions.id, id));
  }

  async getAllContributions(): Promise<Contribution[]> {
    return await db
      .select()
      .from(contributions)
      .orderBy(desc(contributions.createdAt));
  }

  // Treasury operations
  async getTreasury(): Promise<Treasury | undefined> {
    const [treasuryData] = await db.select().from(treasury).limit(1);
    return treasuryData;
  }

  async updateTreasury(data: Partial<Treasury>): Promise<void> {
    const existingTreasury = await this.getTreasury();
    
    if (existingTreasury) {
      await db
        .update(treasury)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(treasury.id, existingTreasury.id));
    } else {
      await db
        .insert(treasury)
        .values({
          totalBalance: data.totalBalance || "0",
          totalContributions: data.totalContributions || "0",
          totalWithdrawals: data.totalWithdrawals || "0",
          interestEarned: data.interestEarned || "0",
        });
    }
  }

  async createTreasuryAdjustment(adjustment: InsertTreasuryAdjustment): Promise<TreasuryAdjustment> {
    const [newAdjustment] = await db
      .insert(treasuryAdjustments)
      .values(adjustment)
      .returning();
    return newAdjustment;
  }

  async getTreasuryAdjustments(): Promise<TreasuryAdjustment[]> {
    return await db
      .select()
      .from(treasuryAdjustments)
      .orderBy(desc(treasuryAdjustments.createdAt));
  }

  // Audit operations
  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const [newLog] = await db
      .insert(auditLogs)
      .values(log)
      .returning();
    return newLog;
  }

  async getAuditLogs(): Promise<AuditLog[]> {
    return await db
      .select()
      .from(auditLogs)
      .orderBy(desc(auditLogs.createdAt));
  }

  // Statistics
  async getContributionStats(): Promise<{
    totalThisMonth: string;
    totalConfirmed: number;
    activeMembers: number;
    paymentRate: number;
  }> {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Get this month's contributions
    const thisMonthResult = await db
      .select({
        total: sum(contributions.amount),
      })
      .from(contributions)
      .where(
        and(
          eq(contributions.status, "confirmed"),
          sql`${contributions.createdAt} >= ${firstDayOfMonth}`
        )
      );

    // Get total confirmed contributions
    const confirmedResult = await db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(contributions)
      .where(eq(contributions.status, "confirmed"));

    // Get active members count
    const activeMembersResult = await db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(users)
      .where(and(eq(users.role, "member"), eq(users.isActive, true)));

    // Get total contributions for payment rate calculation
    const totalContributionsResult = await db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(contributions);

    const totalThisMonth = thisMonthResult[0]?.total || "0";
    const totalConfirmed = confirmedResult[0]?.count || 0;
    const activeMembers = activeMembersResult[0]?.count || 0;
    const totalContributions = totalContributionsResult[0]?.count || 1;
    const paymentRate = totalContributions > 0 ? (totalConfirmed / totalContributions) * 100 : 0;

    return {
      totalThisMonth,
      totalConfirmed,
      activeMembers,
      paymentRate: Math.round(paymentRate * 10) / 10,
    };
  }
}

export const storage = new DatabaseStorage();
