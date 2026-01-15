import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, integer, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  visibleId: varchar("visible_id", { length: 8 }).notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  phone: text("phone"),
  phoneVerified: boolean("phone_verified").default(false).notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  isBlocked: boolean("is_blocked").default(false).notNull(),
});

export const properties = pgTable("properties", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ownerId: varchar("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  city: text("city").notNull(),
  street: text("street").notNull(),
  building: text("building").notNull(),
  block: text("block"),
  apartment: text("apartment").notNull(),
  ownerFullName: text("owner_full_name").notNull(),
  cadastralNumber: text("cadastral_number").notNull(),
  description: text("description"),
  photos: text("photos").array(),
  rentPrice: integer("rent_price"),
  utilityPayments: text("utility_payments"),
  hoaFees: text("hoa_fees"),
  electricityCost: text("electricity_cost"),
  additionalInfo: text("additional_info"),
  contractFile: text("contract_file"),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  currentTenantId: varchar("current_tenant_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  isVisible: boolean("is_visible").default(true).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

export const rentalRequests = pgTable("rental_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: varchar("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  requesterId: varchar("requester_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const tenantHistory = pgTable("tenant_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: varchar("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  tenantId: varchar("tenant_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const subscriptionPlans = pgTable("subscription_plans", {
  id: varchar("id").primaryKey(),
  name: text("name").notNull(),
  price: integer("price").notNull(),
  propertyLimit: integer("property_limit").notNull(),
  description: text("description"),
});

export const userSubscriptions = pgTable("user_subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  planId: varchar("plan_id").notNull().references(() => subscriptionPlans.id),
  status: text("status").notNull().default("active"),
  startDate: timestamp("start_date").defaultNow().notNull(),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const reviews = pgTable("reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reviewerId: varchar("reviewer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  revieweeId: varchar("reviewee_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  propertyId: varchar("property_id").references(() => properties.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  reviewType: text("review_type").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ one, many }) => ({
  properties: many(properties),
  rentalRequests: many(rentalRequests),
  tenantHistory: many(tenantHistory),
  reviewsGiven: many(reviews, { relationName: "reviewer" }),
  reviewsReceived: many(reviews, { relationName: "reviewee" }),
  subscription: one(userSubscriptions),
}));

export const propertiesRelations = relations(properties, ({ one, many }) => ({
  owner: one(users, {
    fields: [properties.ownerId],
    references: [users.id],
  }),
  currentTenant: one(users, {
    fields: [properties.currentTenantId],
    references: [users.id],
  }),
  rentalRequests: many(rentalRequests),
  tenantHistory: many(tenantHistory),
  reviews: many(reviews),
}));

export const rentalRequestsRelations = relations(rentalRequests, ({ one }) => ({
  property: one(properties, {
    fields: [rentalRequests.propertyId],
    references: [properties.id],
  }),
  requester: one(users, {
    fields: [rentalRequests.requesterId],
    references: [users.id],
  }),
}));

export const tenantHistoryRelations = relations(tenantHistory, ({ one }) => ({
  property: one(properties, {
    fields: [tenantHistory.propertyId],
    references: [properties.id],
  }),
  tenant: one(users, {
    fields: [tenantHistory.tenantId],
    references: [users.id],
  }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  reviewer: one(users, {
    fields: [reviews.reviewerId],
    references: [users.id],
    relationName: "reviewer",
  }),
  reviewee: one(users, {
    fields: [reviews.revieweeId],
    references: [users.id],
    relationName: "reviewee",
  }),
  property: one(properties, {
    fields: [reviews.propertyId],
    references: [properties.id],
  }),
}));

export const subscriptionPlansRelations = relations(subscriptionPlans, ({ many }) => ({
  subscriptions: many(userSubscriptions),
}));

export const userSubscriptionsRelations = relations(userSubscriptions, ({ one }) => ({
  user: one(users, {
    fields: [userSubscriptions.userId],
    references: [users.id],
  }),
  plan: one(subscriptionPlans, {
    fields: [userSubscriptions.planId],
    references: [subscriptionPlans.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  visibleId: true,
  isAdmin: true,
});

export const registerUserSchema = insertUserSchema.extend({
  email: z.string().email("Введите корректный email"),
  password: z.string().min(6, "Пароль должен быть не менее 6 символов"),
  firstName: z.string().min(1, "Введите имя"),
  lastName: z.string().min(1, "Введите фамилию"),
  phone: z.string().min(1, "Введите номер телефона").regex(/^\+?[0-9\s\-\(\)]{7,20}$/, "Введите корректный номер телефона"),
});

export const loginUserSchema = z.object({
  email: z.string().email("Введите корректный email"),
  password: z.string().min(1, "Введите пароль"),
});

export const insertPropertySchema = createInsertSchema(properties).omit({
  id: true,
  ownerId: true,
  createdAt: true,
  currentTenantId: true,
}).extend({
  city: z.string().min(1, "Введите город"),
  street: z.string().min(1, "Введите улицу"),
  building: z.string().min(1, "Введите номер дома"),
  block: z.string().optional().nullable(),
  apartment: z.string().min(1, "Введите номер квартиры"),
  ownerFullName: z.string().min(1, "Введите ФИО собственника"),
  cadastralNumber: z.string().min(1, "Введите кадастровый номер"),
  description: z.string().optional().nullable(),
  photos: z.array(z.string()).optional().nullable(),
  rentPrice: z.number().min(0).optional().nullable(),
  utilityPayments: z.string().optional().nullable(),
  hoaFees: z.string().optional().nullable(),
  electricityCost: z.string().optional().nullable(),
  additionalInfo: z.string().max(4096, "Максимум 4096 символов").optional().nullable(),
  contractFile: z.string().optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
});

export const insertRentalRequestSchema = createInsertSchema(rentalRequests).omit({
  id: true,
  requesterId: true,
  status: true,
  createdAt: true,
});

export const updateUserSchema = z.object({
  firstName: z.string().min(1, "Введите имя").optional(),
  lastName: z.string().min(1, "Введите фамилию").optional(),
  phone: z.string().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Введите текущий пароль"),
  newPassword: z.string().min(6, "Новый пароль должен быть не менее 6 символов"),
});

export const insertTenantHistorySchema = createInsertSchema(tenantHistory).omit({
  id: true,
  createdAt: true,
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  reviewerId: true,
  createdAt: true,
}).extend({
  rating: z.number().min(1).max(5, "Оценка от 1 до 5"),
  comment: z.string().max(2000, "Максимум 2000 символов").optional(),
  reviewType: z.enum(["landlord", "tenant"]),
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type RegisterUser = z.infer<typeof registerUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;

export type Property = typeof properties.$inferSelect;
export type InsertProperty = z.infer<typeof insertPropertySchema>;

export type RentalRequest = typeof rentalRequests.$inferSelect;
export type InsertRentalRequest = z.infer<typeof insertRentalRequestSchema>;

export type TenantHistory = typeof tenantHistory.$inferSelect;
export type InsertTenantHistory = z.infer<typeof insertTenantHistorySchema>;

export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;

export type PropertyWithOwner = Property & {
  owner: Pick<User, "id" | "firstName" | "lastName" | "email" | "phone" | "visibleId">;
  currentTenant?: Pick<User, "id" | "firstName" | "lastName" | "email" | "phone" | "visibleId"> | null;
  fullAddress?: string;
};

export type RentalRequestWithDetails = RentalRequest & {
  property: Property;
  requester: Pick<User, "id" | "firstName" | "lastName" | "email" | "phone" | "visibleId">;
};

export type TenantHistoryWithDetails = TenantHistory & {
  tenant: Pick<User, "id" | "firstName" | "lastName" | "email" | "phone" | "visibleId">;
  property: Property;
};

export type ReviewWithDetails = Review & {
  reviewer: Pick<User, "id" | "firstName" | "lastName" | "visibleId">;
  reviewee: Pick<User, "id" | "firstName" | "lastName" | "visibleId">;
  property?: Property | null;
};

export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type UserSubscription = typeof userSubscriptions.$inferSelect;

export type UserSubscriptionWithPlan = UserSubscription & {
  plan: SubscriptionPlan;
};
