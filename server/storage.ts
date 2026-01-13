import { 
  users, 
  properties, 
  rentalRequests,
  tenantHistory,
  reviews,
  subscriptionPlans,
  userSubscriptions,
  type User, 
  type InsertUser, 
  type Property,
  type InsertProperty,
  type RentalRequest,
  type InsertRentalRequest,
  type TenantHistory,
  type InsertTenantHistory,
  type Review,
  type InsertReview,
  type PropertyWithOwner,
  type RentalRequestWithDetails,
  type TenantHistoryWithDetails,
  type ReviewWithDetails,
  type SubscriptionPlan,
  type UserSubscription,
  type UserSubscriptionWithPlan
} from "@shared/schema";
import { db } from "./db";
import { eq, and, ne, desc, or, count } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByVisibleId(visibleId: string): Promise<User | undefined>;
  createUser(user: InsertUser & { visibleId: string; isAdmin?: boolean }): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  
  // Properties
  getProperty(id: string): Promise<Property | undefined>;
  getPropertyWithOwner(id: string): Promise<PropertyWithOwner | undefined>;
  getPropertiesByOwner(ownerId: string): Promise<PropertyWithOwner[]>;
  getPropertiesByTenant(tenantId: string): Promise<PropertyWithOwner[]>;
  getAllPropertiesExceptOwner(ownerId: string): Promise<PropertyWithOwner[]>;
  getAllProperties(): Promise<PropertyWithOwner[]>;
  createProperty(property: InsertProperty & { ownerId: string }): Promise<Property>;
  updateProperty(id: string, ownerId: string, data: Partial<InsertProperty>, isAdmin?: boolean): Promise<Property | undefined>;
  deleteProperty(id: string, ownerId: string, isAdmin?: boolean): Promise<boolean>;
  checkPropertyUniqueness(address: string, ownerFullName: string, cadastralNumber: string, excludeId?: string): Promise<boolean>;
  setCurrentTenant(propertyId: string, tenantId: string | null, ownerId: string): Promise<Property | undefined>;
  
  // Rental Requests
  getRentalRequest(id: string): Promise<RentalRequest | undefined>;
  getRentalRequestsByRequester(requesterId: string): Promise<RentalRequest[]>;
  getIncomingRequestsForOwner(ownerId: string): Promise<RentalRequestWithDetails[]>;
  getRentalsForRequester(requesterId: string): Promise<{ property: PropertyWithOwner; request: RentalRequest }[]>;
  createRentalRequest(request: InsertRentalRequest & { requesterId: string }): Promise<RentalRequest>;
  updateRentalRequestStatus(id: string, ownerId: string, status: string): Promise<RentalRequest | undefined>;
  cancelRentalRequest(id: string, requesterId: string): Promise<RentalRequest | undefined>;
  checkExistingRequest(propertyId: string, requesterId: string): Promise<boolean>;
  
  // Tenant History
  getTenantHistory(propertyId: string): Promise<TenantHistoryWithDetails[]>;
  getLandlordHistory(tenantId: string): Promise<TenantHistoryWithDetails[]>;
  addTenantHistory(history: InsertTenantHistory): Promise<TenantHistory>;
  endTenancy(propertyId: string, tenantId: string): Promise<TenantHistory | undefined>;
  
  // Reviews
  getReviewsForUser(userId: string, reviewType?: string): Promise<ReviewWithDetails[]>;
  getReviewsByUser(userId: string): Promise<ReviewWithDetails[]>;
  createReview(review: InsertReview & { reviewerId: string }): Promise<Review>;
  getUserAverageRating(userId: string, reviewType: string): Promise<number | null>;
  
  // Subscriptions
  getAllPlans(): Promise<SubscriptionPlan[]>;
  getUserSubscription(userId: string): Promise<UserSubscriptionWithPlan | undefined>;
  createOrUpdateSubscription(userId: string, planId: string): Promise<UserSubscription>;
  cancelSubscription(userId: string): Promise<UserSubscription | undefined>;
  getUserPropertyCount(userId: string): Promise<number>;
  getUserPropertyLimit(userId: string): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByVisibleId(visibleId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.visibleId, visibleId));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser & { visibleId: string; isAdmin?: boolean }): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | undefined> {
    const [user] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return user || undefined;
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users).orderBy(users.firstName);
  }

  // Properties
  async getProperty(id: string): Promise<Property | undefined> {
    const [property] = await db.select().from(properties).where(eq(properties.id, id));
    return property || undefined;
  }

  async getPropertyWithOwner(id: string): Promise<PropertyWithOwner | undefined> {
    const result = await db
      .select({
        property: properties,
        owner: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          phone: users.phone,
          visibleId: users.visibleId,
        },
      })
      .from(properties)
      .innerJoin(users, eq(properties.ownerId, users.id))
      .where(eq(properties.id, id));

    if (result.length === 0) return undefined;
    
    const { property, owner } = result[0];
    return { ...property, owner };
  }

  async getPropertiesByOwner(ownerId: string): Promise<PropertyWithOwner[]> {
    const result = await db
      .select({
        property: properties,
        owner: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          phone: users.phone,
          visibleId: users.visibleId,
        },
      })
      .from(properties)
      .innerJoin(users, eq(properties.ownerId, users.id))
      .where(eq(properties.ownerId, ownerId));

    return result.map(({ property, owner }) => ({
      ...property,
      owner,
    }));
  }

  async getPropertiesByTenant(tenantId: string): Promise<PropertyWithOwner[]> {
    const result = await db
      .select({
        property: properties,
        owner: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          phone: users.phone,
          visibleId: users.visibleId,
        },
      })
      .from(properties)
      .innerJoin(users, eq(properties.ownerId, users.id))
      .where(eq(properties.currentTenantId, tenantId));

    return result.map(({ property, owner }) => ({
      ...property,
      owner,
    }));
  }

  async getAllPropertiesExceptOwner(ownerId: string): Promise<PropertyWithOwner[]> {
    const result = await db
      .select({
        property: properties,
        owner: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          phone: users.phone,
          visibleId: users.visibleId,
        },
      })
      .from(properties)
      .innerJoin(users, eq(properties.ownerId, users.id))
      .where(ne(properties.ownerId, ownerId));

    return result.map(({ property, owner }) => ({
      ...property,
      owner,
    }));
  }

  async getAllProperties(): Promise<PropertyWithOwner[]> {
    const result = await db
      .select({
        property: properties,
        owner: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          phone: users.phone,
          visibleId: users.visibleId,
        },
      })
      .from(properties)
      .innerJoin(users, eq(properties.ownerId, users.id));

    return result.map(({ property, owner }) => ({
      ...property,
      owner,
    }));
  }

  async createProperty(property: InsertProperty & { ownerId: string }): Promise<Property> {
    const [created] = await db.insert(properties).values(property).returning();
    return created;
  }

  async updateProperty(id: string, ownerId: string, data: Partial<InsertProperty>, isAdmin: boolean = false): Promise<Property | undefined> {
    const conditions = isAdmin 
      ? eq(properties.id, id)
      : and(eq(properties.id, id), eq(properties.ownerId, ownerId));
      
    const [updated] = await db
      .update(properties)
      .set(data)
      .where(conditions)
      .returning();
    return updated || undefined;
  }

  async deleteProperty(id: string, ownerId: string, isAdmin: boolean = false): Promise<boolean> {
    const conditions = isAdmin 
      ? eq(properties.id, id)
      : and(eq(properties.id, id), eq(properties.ownerId, ownerId));
      
    const result = await db
      .delete(properties)
      .where(conditions)
      .returning();
    return result.length > 0;
  }

  async checkPropertyUniqueness(
    address: string,
    ownerFullName: string,
    cadastralNumber: string,
    excludeId?: string
  ): Promise<boolean> {
    const conditions = [
      eq(properties.address, address),
      eq(properties.ownerFullName, ownerFullName),
      eq(properties.cadastralNumber, cadastralNumber),
    ];

    if (excludeId) {
      conditions.push(ne(properties.id, excludeId));
    }

    const existing = await db
      .select()
      .from(properties)
      .where(and(...conditions));

    return existing.length === 0;
  }

  async setCurrentTenant(propertyId: string, tenantId: string | null, ownerId: string): Promise<Property | undefined> {
    const [updated] = await db
      .update(properties)
      .set({ currentTenantId: tenantId })
      .where(and(eq(properties.id, propertyId), eq(properties.ownerId, ownerId)))
      .returning();
    return updated || undefined;
  }

  // Rental Requests
  async getRentalRequest(id: string): Promise<RentalRequest | undefined> {
    const [request] = await db.select().from(rentalRequests).where(eq(rentalRequests.id, id));
    return request || undefined;
  }

  async getRentalRequestsByRequester(requesterId: string): Promise<RentalRequest[]> {
    return db.select().from(rentalRequests).where(eq(rentalRequests.requesterId, requesterId));
  }

  async getIncomingRequestsForOwner(ownerId: string): Promise<RentalRequestWithDetails[]> {
    const result = await db
      .select({
        request: rentalRequests,
        property: properties,
        requester: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          phone: users.phone,
          visibleId: users.visibleId,
        },
      })
      .from(rentalRequests)
      .innerJoin(properties, eq(rentalRequests.propertyId, properties.id))
      .innerJoin(users, eq(rentalRequests.requesterId, users.id))
      .where(eq(properties.ownerId, ownerId));

    return result.map(({ request, property, requester }) => ({
      ...request,
      property,
      requester,
    }));
  }

  async getRentalsForRequester(requesterId: string): Promise<{ property: PropertyWithOwner; request: RentalRequest }[]> {
    const result = await db
      .select({
        request: rentalRequests,
        property: properties,
        owner: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          phone: users.phone,
          visibleId: users.visibleId,
        },
      })
      .from(rentalRequests)
      .innerJoin(properties, eq(rentalRequests.propertyId, properties.id))
      .innerJoin(users, eq(properties.ownerId, users.id))
      .where(eq(rentalRequests.requesterId, requesterId));

    return result.map(({ request, property, owner }) => ({
      request,
      property: { ...property, owner },
    }));
  }

  async createRentalRequest(request: InsertRentalRequest & { requesterId: string }): Promise<RentalRequest> {
    const [created] = await db.insert(rentalRequests).values(request).returning();
    return created;
  }

  async updateRentalRequestStatus(id: string, ownerId: string, status: string): Promise<RentalRequest | undefined> {
    // First verify the request belongs to a property owned by this user
    const [request] = await db
      .select({ request: rentalRequests, property: properties })
      .from(rentalRequests)
      .innerJoin(properties, eq(rentalRequests.propertyId, properties.id))
      .where(and(eq(rentalRequests.id, id), eq(properties.ownerId, ownerId)));

    if (!request) {
      return undefined;
    }

    const [updated] = await db
      .update(rentalRequests)
      .set({ status })
      .where(eq(rentalRequests.id, id))
      .returning();

    return updated || undefined;
  }

  async cancelRentalRequest(id: string, requesterId: string): Promise<RentalRequest | undefined> {
    // Verify the request belongs to this requester and is pending
    const [request] = await db
      .select()
      .from(rentalRequests)
      .where(and(
        eq(rentalRequests.id, id), 
        eq(rentalRequests.requesterId, requesterId),
        eq(rentalRequests.status, "pending")
      ));

    if (!request) {
      return undefined;
    }

    const [updated] = await db
      .update(rentalRequests)
      .set({ status: "cancelled" })
      .where(eq(rentalRequests.id, id))
      .returning();

    return updated || undefined;
  }

  async checkExistingRequest(propertyId: string, requesterId: string): Promise<boolean> {
    const existing = await db
      .select()
      .from(rentalRequests)
      .where(and(
        eq(rentalRequests.propertyId, propertyId), 
        eq(rentalRequests.requesterId, requesterId),
        or(eq(rentalRequests.status, "pending"), eq(rentalRequests.status, "approved"))
      ));
    return existing.length > 0;
  }

  // Tenant History
  async getTenantHistory(propertyId: string): Promise<TenantHistoryWithDetails[]> {
    const result = await db
      .select({
        history: tenantHistory,
        tenant: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          phone: users.phone,
          visibleId: users.visibleId,
        },
        property: properties,
      })
      .from(tenantHistory)
      .innerJoin(users, eq(tenantHistory.tenantId, users.id))
      .innerJoin(properties, eq(tenantHistory.propertyId, properties.id))
      .where(eq(tenantHistory.propertyId, propertyId))
      .orderBy(desc(tenantHistory.startDate));

    return result.map(({ history, tenant, property }) => ({
      ...history,
      tenant,
      property,
    }));
  }

  async getLandlordHistory(tenantId: string): Promise<TenantHistoryWithDetails[]> {
    const result = await db
      .select({
        history: tenantHistory,
        tenant: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          phone: users.phone,
          visibleId: users.visibleId,
        },
        property: properties,
      })
      .from(tenantHistory)
      .innerJoin(users, eq(tenantHistory.tenantId, users.id))
      .innerJoin(properties, eq(tenantHistory.propertyId, properties.id))
      .where(eq(tenantHistory.tenantId, tenantId))
      .orderBy(desc(tenantHistory.startDate));

    return result.map(({ history, tenant, property }) => ({
      ...history,
      tenant,
      property,
    }));
  }

  async addTenantHistory(history: InsertTenantHistory): Promise<TenantHistory> {
    const [created] = await db.insert(tenantHistory).values(history).returning();
    return created;
  }

  async endTenancy(propertyId: string, tenantId: string): Promise<TenantHistory | undefined> {
    const [updated] = await db
      .update(tenantHistory)
      .set({ endDate: new Date() })
      .where(and(
        eq(tenantHistory.propertyId, propertyId),
        eq(tenantHistory.tenantId, tenantId),
        eq(tenantHistory.endDate, null as any)
      ))
      .returning();
    return updated || undefined;
  }

  // Reviews
  async getReviewsForUser(userId: string, reviewType?: string): Promise<ReviewWithDetails[]> {
    const conditions = reviewType 
      ? and(eq(reviews.revieweeId, userId), eq(reviews.reviewType, reviewType))
      : eq(reviews.revieweeId, userId);

    const result = await db
      .select({
        review: reviews,
        reviewer: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          visibleId: users.visibleId,
        },
      })
      .from(reviews)
      .innerJoin(users, eq(reviews.reviewerId, users.id))
      .where(conditions)
      .orderBy(desc(reviews.createdAt));

    // Get reviewee info separately
    const [reviewee] = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        visibleId: users.visibleId,
      })
      .from(users)
      .where(eq(users.id, userId));

    return result.map(({ review, reviewer }) => ({
      ...review,
      reviewer,
      reviewee: reviewee || { id: userId, firstName: "", lastName: "", visibleId: "" },
    }));
  }

  async getReviewsByUser(userId: string): Promise<ReviewWithDetails[]> {
    const result = await db
      .select({
        review: reviews,
        reviewee: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          visibleId: users.visibleId,
        },
      })
      .from(reviews)
      .innerJoin(users, eq(reviews.revieweeId, users.id))
      .where(eq(reviews.reviewerId, userId))
      .orderBy(desc(reviews.createdAt));

    // Get reviewer info separately
    const [reviewer] = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        visibleId: users.visibleId,
      })
      .from(users)
      .where(eq(users.id, userId));

    return result.map(({ review, reviewee }) => ({
      ...review,
      reviewer: reviewer || { id: userId, firstName: "", lastName: "", visibleId: "" },
      reviewee,
    }));
  }

  async createReview(review: InsertReview & { reviewerId: string }): Promise<Review> {
    const [created] = await db.insert(reviews).values(review).returning();
    return created;
  }

  async getUserAverageRating(userId: string, reviewType: string): Promise<number | null> {
    const userReviews = await db
      .select({ rating: reviews.rating })
      .from(reviews)
      .where(and(eq(reviews.revieweeId, userId), eq(reviews.reviewType, reviewType)));

    if (userReviews.length === 0) return null;
    
    const sum = userReviews.reduce((acc, r) => acc + r.rating, 0);
    return sum / userReviews.length;
  }

  // Subscriptions
  async getAllPlans(): Promise<SubscriptionPlan[]> {
    return db.select().from(subscriptionPlans).orderBy(subscriptionPlans.price);
  }

  async getUserSubscription(userId: string): Promise<UserSubscriptionWithPlan | undefined> {
    const result = await db
      .select({
        subscription: userSubscriptions,
        plan: subscriptionPlans,
      })
      .from(userSubscriptions)
      .innerJoin(subscriptionPlans, eq(userSubscriptions.planId, subscriptionPlans.id))
      .where(and(
        eq(userSubscriptions.userId, userId),
        eq(userSubscriptions.status, "active")
      ));

    if (result.length === 0) return undefined;
    
    const { subscription, plan } = result[0];
    return { ...subscription, plan };
  }

  async createOrUpdateSubscription(userId: string, planId: string): Promise<UserSubscription> {
    // Check if user already has a subscription
    const existing = await db
      .select()
      .from(userSubscriptions)
      .where(eq(userSubscriptions.userId, userId));

    if (existing.length > 0) {
      // Update existing subscription
      const [updated] = await db
        .update(userSubscriptions)
        .set({ 
          planId, 
          status: "active",
          startDate: new Date(),
          endDate: null 
        })
        .where(eq(userSubscriptions.userId, userId))
        .returning();
      return updated;
    } else {
      // Create new subscription
      const [created] = await db
        .insert(userSubscriptions)
        .values({ userId, planId, status: "active" })
        .returning();
      return created;
    }
  }

  async cancelSubscription(userId: string): Promise<UserSubscription | undefined> {
    // Downgrade to free plan instead of cancelling completely
    const [updated] = await db
      .update(userSubscriptions)
      .set({ planId: "free", status: "active" })
      .where(eq(userSubscriptions.userId, userId))
      .returning();
    return updated || undefined;
  }

  async getUserPropertyCount(userId: string): Promise<number> {
    const result = await db
      .select({ count: count() })
      .from(properties)
      .where(eq(properties.ownerId, userId));
    return result[0]?.count || 0;
  }

  async getUserPropertyLimit(userId: string): Promise<number> {
    const subscription = await this.getUserSubscription(userId);
    if (!subscription) {
      // No subscription = free tier (1 property)
      return 1;
    }
    return subscription.plan.propertyLimit === -1 ? Infinity : subscription.plan.propertyLimit;
  }
}

export const storage = new DatabaseStorage();
