import { 
  users, 
  properties, 
  rentalRequests,
  type User, 
  type InsertUser, 
  type Property,
  type InsertProperty,
  type RentalRequest,
  type InsertRentalRequest,
  type PropertyWithOwner,
  type RentalRequestWithDetails
} from "@shared/schema";
import { db } from "./db";
import { eq, and, ne } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByVisibleId(visibleId: string): Promise<User | undefined>;
  createUser(user: InsertUser & { visibleId: string }): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<User | undefined>;
  
  // Properties
  getProperty(id: string): Promise<Property | undefined>;
  getPropertiesByOwner(ownerId: string): Promise<PropertyWithOwner[]>;
  getAllPropertiesExceptOwner(ownerId: string): Promise<PropertyWithOwner[]>;
  createProperty(property: InsertProperty & { ownerId: string }): Promise<Property>;
  updateProperty(id: string, ownerId: string, data: InsertProperty): Promise<Property | undefined>;
  deleteProperty(id: string, ownerId: string): Promise<boolean>;
  checkPropertyUniqueness(address: string, ownerFullName: string, cadastralNumber: string, excludeId?: string): Promise<boolean>;
  
  // Rental Requests
  getRentalRequest(id: string): Promise<RentalRequest | undefined>;
  getRentalRequestsByRequester(requesterId: string): Promise<RentalRequest[]>;
  getIncomingRequestsForOwner(ownerId: string): Promise<RentalRequestWithDetails[]>;
  getRentalsForRequester(requesterId: string): Promise<{ property: PropertyWithOwner; request: RentalRequest }[]>;
  createRentalRequest(request: InsertRentalRequest & { requesterId: string }): Promise<RentalRequest>;
  updateRentalRequestStatus(id: string, ownerId: string, status: string): Promise<RentalRequest | undefined>;
  checkExistingRequest(propertyId: string, requesterId: string): Promise<boolean>;
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

  async createUser(insertUser: InsertUser & { visibleId: string }): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | undefined> {
    const [user] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return user || undefined;
  }

  // Properties
  async getProperty(id: string): Promise<Property | undefined> {
    const [property] = await db.select().from(properties).where(eq(properties.id, id));
    return property || undefined;
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

  async createProperty(property: InsertProperty & { ownerId: string }): Promise<Property> {
    const [created] = await db.insert(properties).values(property).returning();
    return created;
  }

  async updateProperty(id: string, ownerId: string, data: InsertProperty): Promise<Property | undefined> {
    const [updated] = await db
      .update(properties)
      .set(data)
      .where(and(eq(properties.id, id), eq(properties.ownerId, ownerId)))
      .returning();
    return updated || undefined;
  }

  async deleteProperty(id: string, ownerId: string): Promise<boolean> {
    const result = await db
      .delete(properties)
      .where(and(eq(properties.id, id), eq(properties.ownerId, ownerId)))
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

  async checkExistingRequest(propertyId: string, requesterId: string): Promise<boolean> {
    const existing = await db
      .select()
      .from(rentalRequests)
      .where(and(eq(rentalRequests.propertyId, propertyId), eq(rentalRequests.requesterId, requesterId)));
    return existing.length > 0;
  }
}

export const storage = new DatabaseStorage();
