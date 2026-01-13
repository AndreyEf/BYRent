import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table - both tenants and landlords use the same table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
visibleId: varchar("visible_id", { length: 8 }).notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  phone: text("phone"),
});

// Properties table - "My Property" section
export const properties = pgTable("properties", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ownerId: varchar("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  address: text("address").notNull(),
  ownerFullName: text("owner_full_name").notNull(),
  cadastralNumber: text("cadastral_number").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Rental requests - linking tenants to properties
export const rentalRequests = pgTable("rental_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: varchar("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  requesterId: varchar("requester_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  properties: many(properties),
  rentalRequests: many(rentalRequests),
}));

export const propertiesRelations = relations(properties, ({ one, many }) => ({
  owner: one(users, {
    fields: [properties.ownerId],
    references: [users.id],
  }),
  rentalRequests: many(rentalRequests),
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

// Validation schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  visibleId: true,
});

export const registerUserSchema = insertUserSchema.extend({
  email: z.string().email("Введите корректный email"),
  password: z.string().min(6, "Пароль должен быть не менее 6 символов"),
  firstName: z.string().min(1, "Введите имя"),
  lastName: z.string().min(1, "Введите фамилию"),
  phone: z.string().optional(),
});

export const loginUserSchema = z.object({
  email: z.string().email("Введите корректный email"),
  password: z.string().min(1, "Введите пароль"),
});

export const insertPropertySchema = createInsertSchema(properties).omit({
  id: true,
  ownerId: true,
  createdAt: true,
}).extend({
  address: z.string().min(1, "Введите адрес"),
  ownerFullName: z.string().min(1, "Введите ФИО собственника"),
  cadastralNumber: z.string().min(1, "Введите кадастровый номер"),
  description: z.string().optional(),
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

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type RegisterUser = z.infer<typeof registerUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;

export type Property = typeof properties.$inferSelect;
export type InsertProperty = z.infer<typeof insertPropertySchema>;

export type RentalRequest = typeof rentalRequests.$inferSelect;
export type InsertRentalRequest = z.infer<typeof insertRentalRequestSchema>;

// Extended types for frontend
export type PropertyWithOwner = Property & {
  owner: Pick<User, "id" | "firstName" | "lastName" | "email" | "phone" | "visibleId">;
};

export type RentalRequestWithDetails = RentalRequest & {
  property: Property;
  requester: Pick<User, "id" | "firstName" | "lastName" | "email" | "phone" | "visibleId">;
};
