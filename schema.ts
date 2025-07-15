import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  decimal,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table - required for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table - required for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").notNull().default("member"), // member or admin
  totalContributed: decimal("total_contributed", { precision: 12, scale: 2 }).default("0"),
  currentBalance: decimal("current_balance", { precision: 12, scale: 2 }).default("0"),
  lastPaymentDate: timestamp("last_payment_date"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const contributions = pgTable("contributions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  paymentMethod: varchar("payment_method").notNull(), // visa, mastercard, mtn, airtel
  status: varchar("status").notNull().default("pending"), // pending, confirmed, failed
  transactionId: varchar("transaction_id"),
  receiptUrl: varchar("receipt_url"),
  createdAt: timestamp("created_at").defaultNow(),
  confirmedAt: timestamp("confirmed_at"),
});

export const treasury = pgTable("treasury", {
  id: serial("id").primaryKey(),
  totalBalance: decimal("total_balance", { precision: 12, scale: 2 }).notNull(),
  totalContributions: decimal("total_contributions", { precision: 12, scale: 2 }).default("0"),
  totalWithdrawals: decimal("total_withdrawals", { precision: 12, scale: 2 }).default("0"),
  interestEarned: decimal("interest_earned", { precision: 12, scale: 2 }).default("0"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const treasuryAdjustments = pgTable("treasury_adjustments", {
  id: serial("id").primaryKey(),
  type: varchar("type").notNull(), // deposit, withdrawal, interest, fee
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  reason: text("reason").notNull(),
  adminId: varchar("admin_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  action: varchar("action").notNull(),
  details: text("details").notNull(),
  adminId: varchar("admin_id").notNull().references(() => users.id),
  ipAddress: varchar("ip_address"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  contributions: many(contributions),
  treasuryAdjustments: many(treasuryAdjustments),
  auditLogs: many(auditLogs),
}));

export const contributionsRelations = relations(contributions, ({ one }) => ({
  user: one(users, {
    fields: [contributions.userId],
    references: [users.id],
  }),
}));

export const treasuryAdjustmentsRelations = relations(treasuryAdjustments, ({ one }) => ({
  admin: one(users, {
    fields: [treasuryAdjustments.adminId],
    references: [users.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  admin: one(users, {
    fields: [auditLogs.adminId],
    references: [users.id],
  }),
}));

// Zod schemas
export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertContributionSchema = createInsertSchema(contributions).omit({
  id: true,
  createdAt: true,
  confirmedAt: true,
});

export const insertTreasuryAdjustmentSchema = createInsertSchema(treasuryAdjustments).omit({
  id: true,
  createdAt: true,
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertContribution = z.infer<typeof insertContributionSchema>;
export type Contribution = typeof contributions.$inferSelect;
export type InsertTreasuryAdjustment = z.infer<typeof insertTreasuryAdjustmentSchema>;
export type TreasuryAdjustment = typeof treasuryAdjustments.$inferSelect;
export type Treasury = typeof treasury.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;
