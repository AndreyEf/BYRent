import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, requireAuth, hashPassword, comparePasswords } from "./auth";
import { 
  insertPropertySchema, 
  insertRentalRequestSchema, 
  updateUserSchema, 
  changePasswordSchema,
  insertReviewSchema,
  insertTenantHistorySchema
} from "@shared/schema";
import { z } from "zod";

// Admin middleware
const requireAdmin = async (req: Request, res: Response, next: Function) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ message: "Доступ запрещён" });
  }
  next();
};

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup authentication
  setupAuth(app);

  // Update user profile
  app.patch("/api/users/me", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const validatedData = updateUserSchema.parse(req.body);
      
      const updated = await storage.updateUser(userId, validatedData);
      if (!updated) {
        return res.status(404).json({ message: "Пользователь не найден" });
      }

      const { password: _, ...userWithoutPassword } = updated;
      res.json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Неверные данные", errors: error.errors });
      }
      console.error("Update user error:", error);
      res.status(500).json({ message: "Ошибка при обновлении профиля" });
    }
  });

  // Change password
  app.post("/api/users/change-password", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "Пользователь не найден" });
      }

      const isValid = await comparePasswords(currentPassword, user.password);
      if (!isValid) {
        return res.status(400).json({ message: "Неверный текущий пароль" });
      }

      const hashedPassword = await hashPassword(newPassword);
      await storage.updateUser(userId, { password: hashedPassword });

      res.json({ message: "Пароль успешно изменён" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Неверные данные", errors: error.errors });
      }
      console.error("Change password error:", error);
      res.status(500).json({ message: "Ошибка при изменении пароля" });
    }
  });

  // Get user by visible ID (for search)
  app.get("/api/users/search/:visibleId", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUserByVisibleId(req.params.visibleId.toUpperCase());
      if (!user) {
        return res.status(404).json({ message: "Пользователь не найден" });
      }
      
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Search user error:", error);
      res.status(500).json({ message: "Ошибка при поиске пользователя" });
    }
  });

  // Properties endpoints
  
  // Get my properties
  app.get("/api/properties/my", requireAuth, async (req: Request, res: Response) => {
    try {
      const properties = await storage.getPropertiesByOwner(req.user!.id);
      res.json(properties);
    } catch (error) {
      console.error("Get my properties error:", error);
      res.status(500).json({ message: "Ошибка при получении недвижимости" });
    }
  });

  // Get all properties (excluding own)
  app.get("/api/properties", requireAuth, async (req: Request, res: Response) => {
    try {
      const properties = await storage.getAllPropertiesExceptOwner(req.user!.id);
      res.json(properties);
    } catch (error) {
      console.error("Get properties error:", error);
      res.status(500).json({ message: "Ошибка при получении недвижимости" });
    }
  });

  // Get single property
  app.get("/api/properties/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const property = await storage.getPropertyWithOwner(req.params.id);
      if (!property) {
        return res.status(404).json({ message: "Недвижимость не найдена" });
      }
      res.json(property);
    } catch (error) {
      console.error("Get property error:", error);
      res.status(500).json({ message: "Ошибка при получении недвижимости" });
    }
  });

  // Create property
  app.post("/api/properties", requireAuth, async (req: Request, res: Response) => {
    try {
      const validatedData = insertPropertySchema.parse(req.body);
      
      // Check uniqueness
      const isUnique = await storage.checkPropertyUniqueness(
        validatedData.address,
        validatedData.ownerFullName,
        validatedData.cadastralNumber
      );
      
      if (!isUnique) {
        return res.status(400).json({ 
          message: "Объект с такой комбинацией адреса, ФИО собственника и кадастрового номера уже существует" 
        });
      }

      const property = await storage.createProperty({
        ...validatedData,
        ownerId: req.user!.id,
      });
      
      res.status(201).json(property);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Неверные данные", errors: error.errors });
      }
      console.error("Create property error:", error);
      res.status(500).json({ message: "Ошибка при добавлении недвижимости" });
    }
  });

  // Update property
  app.patch("/api/properties/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const validatedData = insertPropertySchema.parse(req.body);
      
      // Check uniqueness (excluding current property)
      const isUnique = await storage.checkPropertyUniqueness(
        validatedData.address,
        validatedData.ownerFullName,
        validatedData.cadastralNumber,
        req.params.id
      );
      
      if (!isUnique) {
        return res.status(400).json({ 
          message: "Объект с такой комбинацией адреса, ФИО собственника и кадастрового номера уже существует" 
        });
      }

      const updated = await storage.updateProperty(req.params.id, req.user!.id, validatedData);
      if (!updated) {
        return res.status(404).json({ message: "Недвижимость не найдена или нет доступа" });
      }
      
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Неверные данные", errors: error.errors });
      }
      console.error("Update property error:", error);
      res.status(500).json({ message: "Ошибка при обновлении недвижимости" });
    }
  });

  // Set current tenant for property
  app.post("/api/properties/:id/tenant", requireAuth, async (req: Request, res: Response) => {
    try {
      const { tenantId } = req.body;
      const propertyId = req.params.id;
      
      // Verify tenant exists if tenantId is provided
      if (tenantId) {
        const tenant = await storage.getUser(tenantId);
        if (!tenant) {
          return res.status(404).json({ message: "Арендатор не найден" });
        }
      }

      const property = await storage.setCurrentTenant(propertyId, tenantId || null, req.user!.id);
      if (!property) {
        return res.status(404).json({ message: "Недвижимость не найдена или нет доступа" });
      }

      // Add to tenant history if adding a new tenant
      if (tenantId) {
        await storage.addTenantHistory({
          propertyId,
          tenantId,
          startDate: new Date(),
          endDate: null,
        });
      }

      res.json(property);
    } catch (error) {
      console.error("Set tenant error:", error);
      res.status(500).json({ message: "Ошибка при установке арендатора" });
    }
  });

  // Remove current tenant
  app.delete("/api/properties/:id/tenant", requireAuth, async (req: Request, res: Response) => {
    try {
      const propertyId = req.params.id;
      
      // Get current property to find tenant
      const property = await storage.getProperty(propertyId);
      if (!property || property.ownerId !== req.user!.id) {
        return res.status(404).json({ message: "Недвижимость не найдена или нет доступа" });
      }

      // End tenancy in history if there was a tenant
      if (property.currentTenantId) {
        await storage.endTenancy(propertyId, property.currentTenantId);
      }

      const updated = await storage.setCurrentTenant(propertyId, null, req.user!.id);
      res.json(updated);
    } catch (error) {
      console.error("Remove tenant error:", error);
      res.status(500).json({ message: "Ошибка при удалении арендатора" });
    }
  });

  // Delete property
  app.delete("/api/properties/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const deleted = await storage.deleteProperty(req.params.id, req.user!.id);
      if (!deleted) {
        return res.status(404).json({ message: "Недвижимость не найдена или нет доступа" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Delete property error:", error);
      res.status(500).json({ message: "Ошибка при удалении недвижимости" });
    }
  });

  // Tenant History endpoints

  // Get tenant history for property
  app.get("/api/properties/:id/history", requireAuth, async (req: Request, res: Response) => {
    try {
      const history = await storage.getTenantHistory(req.params.id);
      res.json(history);
    } catch (error) {
      console.error("Get tenant history error:", error);
      res.status(500).json({ message: "Ошибка при получении истории арендаторов" });
    }
  });

  // Get landlord history (properties I've rented)
  app.get("/api/landlord-history", requireAuth, async (req: Request, res: Response) => {
    try {
      const history = await storage.getLandlordHistory(req.user!.id);
      res.json(history);
    } catch (error) {
      console.error("Get landlord history error:", error);
      res.status(500).json({ message: "Ошибка при получении истории арендодателей" });
    }
  });

  // Rental Requests endpoints

  // Get my requests (as requester)
  app.get("/api/requests/my", requireAuth, async (req: Request, res: Response) => {
    try {
      const requests = await storage.getRentalRequestsByRequester(req.user!.id);
      res.json(requests);
    } catch (error) {
      console.error("Get my requests error:", error);
      res.status(500).json({ message: "Ошибка при получении запросов" });
    }
  });

  // Get incoming requests (for property owners)
  app.get("/api/requests/incoming", requireAuth, async (req: Request, res: Response) => {
    try {
      const requests = await storage.getIncomingRequestsForOwner(req.user!.id);
      res.json(requests);
    } catch (error) {
      console.error("Get incoming requests error:", error);
      res.status(500).json({ message: "Ошибка при получении запросов" });
    }
  });

  // Get my rentals (properties I'm renting - rental requests)
  app.get("/api/rentals/my", requireAuth, async (req: Request, res: Response) => {
    try {
      const rentals = await storage.getRentalsForRequester(req.user!.id);
      res.json(rentals);
    } catch (error) {
      console.error("Get my rentals error:", error);
      res.status(500).json({ message: "Ошибка при получении аренды" });
    }
  });

  // Get current rentals (properties where user is currently tenant)
  app.get("/api/rentals/current", requireAuth, async (req: Request, res: Response) => {
    try {
      const properties = await storage.getPropertiesByTenant(req.user!.id);
      res.json(properties);
    } catch (error) {
      console.error("Get current rentals error:", error);
      res.status(500).json({ message: "Ошибка при получении текущей аренды" });
    }
  });

  // Create rental request
  app.post("/api/requests", requireAuth, async (req: Request, res: Response) => {
    try {
      const { propertyId } = req.body;
      
      if (!propertyId) {
        return res.status(400).json({ message: "ID недвижимости обязателен" });
      }

      // Check if property exists and doesn't belong to requester
      const property = await storage.getProperty(propertyId);
      if (!property) {
        return res.status(404).json({ message: "Недвижимость не найдена" });
      }
      
      if (property.ownerId === req.user!.id) {
        return res.status(400).json({ message: "Нельзя запросить аренду собственной недвижимости" });
      }

      // Check for existing request
      const exists = await storage.checkExistingRequest(propertyId, req.user!.id);
      if (exists) {
        return res.status(400).json({ message: "Вы уже отправили запрос на эту недвижимость" });
      }

      const request = await storage.createRentalRequest({
        propertyId,
        requesterId: req.user!.id,
      });
      
      res.status(201).json(request);
    } catch (error) {
      console.error("Create request error:", error);
      res.status(500).json({ message: "Ошибка при создании запроса" });
    }
  });

  // Update rental request status (approve/reject)
  app.patch("/api/requests/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const { status } = req.body;
      
      if (!status || !["approved", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Неверный статус" });
      }

      const updated = await storage.updateRentalRequestStatus(req.params.id, req.user!.id, status);
      if (!updated) {
        return res.status(404).json({ message: "Запрос не найден или нет доступа" });
      }
      
      res.json(updated);
    } catch (error) {
      console.error("Update request error:", error);
      res.status(500).json({ message: "Ошибка при обновлении запроса" });
    }
  });

  // Cancel rental request (by requester)
  app.post("/api/requests/:id/cancel", requireAuth, async (req: Request, res: Response) => {
    try {
      const cancelled = await storage.cancelRentalRequest(req.params.id, req.user!.id);
      if (!cancelled) {
        return res.status(404).json({ message: "Запрос не найден, уже обработан или нет доступа" });
      }
      res.json(cancelled);
    } catch (error) {
      console.error("Cancel request error:", error);
      res.status(500).json({ message: "Ошибка при отмене запроса" });
    }
  });

  // Reviews endpoints

  // Get reviews for a user
  app.get("/api/reviews/user/:userId", requireAuth, async (req: Request, res: Response) => {
    try {
      const { type } = req.query;
      const reviews = await storage.getReviewsForUser(
        req.params.userId, 
        type as string | undefined
      );
      res.json(reviews);
    } catch (error) {
      console.error("Get reviews error:", error);
      res.status(500).json({ message: "Ошибка при получении отзывов" });
    }
  });

  // Get my reviews (reviews I've written)
  app.get("/api/reviews/my", requireAuth, async (req: Request, res: Response) => {
    try {
      const reviews = await storage.getReviewsByUser(req.user!.id);
      res.json(reviews);
    } catch (error) {
      console.error("Get my reviews error:", error);
      res.status(500).json({ message: "Ошибка при получении отзывов" });
    }
  });

  // Get user average rating
  app.get("/api/reviews/rating/:userId", requireAuth, async (req: Request, res: Response) => {
    try {
      const { type } = req.query;
      if (!type || !["landlord", "tenant"].includes(type as string)) {
        return res.status(400).json({ message: "Укажите тип: landlord или tenant" });
      }
      
      const rating = await storage.getUserAverageRating(req.params.userId, type as string);
      res.json({ rating, type });
    } catch (error) {
      console.error("Get rating error:", error);
      res.status(500).json({ message: "Ошибка при получении рейтинга" });
    }
  });

  // Create review
  app.post("/api/reviews", requireAuth, async (req: Request, res: Response) => {
    try {
      const validatedData = insertReviewSchema.parse(req.body);
      
      // Can't review yourself
      if (validatedData.revieweeId === req.user!.id) {
        return res.status(400).json({ message: "Нельзя оставить отзыв самому себе" });
      }

      // Verify reviewee exists
      const reviewee = await storage.getUser(validatedData.revieweeId);
      if (!reviewee) {
        return res.status(404).json({ message: "Пользователь не найден" });
      }

      const review = await storage.createReview({
        ...validatedData,
        reviewerId: req.user!.id,
      });

      res.status(201).json(review);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Неверные данные", errors: error.errors });
      }
      console.error("Create review error:", error);
      res.status(500).json({ message: "Ошибка при создании отзыва" });
    }
  });

  // Admin endpoints

  // Get all users (admin only)
  app.get("/api/admin/users", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      const usersWithoutPasswords = users.map(({ password: _, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error) {
      console.error("Admin get users error:", error);
      res.status(500).json({ message: "Ошибка при получении пользователей" });
    }
  });

  // Reset user password (admin only)
  app.post("/api/admin/users/:id/reset-password", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { newPassword } = req.body;
      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ message: "Пароль должен быть не менее 6 символов" });
      }

      const hashedPassword = await hashPassword(newPassword);
      const updated = await storage.updateUser(req.params.id, { password: hashedPassword });
      
      if (!updated) {
        return res.status(404).json({ message: "Пользователь не найден" });
      }

      res.json({ message: "Пароль успешно сброшен" });
    } catch (error) {
      console.error("Admin reset password error:", error);
      res.status(500).json({ message: "Ошибка при сбросе пароля" });
    }
  });

  // Get all properties (admin only)
  app.get("/api/admin/properties", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const properties = await storage.getAllProperties();
      res.json(properties);
    } catch (error) {
      console.error("Admin get properties error:", error);
      res.status(500).json({ message: "Ошибка при получении недвижимости" });
    }
  });

  // Update any property (admin only)
  app.patch("/api/admin/properties/:id", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const validatedData = insertPropertySchema.parse(req.body);
      
      const updated = await storage.updateProperty(req.params.id, "", validatedData, true);
      if (!updated) {
        return res.status(404).json({ message: "Недвижимость не найдена" });
      }
      
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Неверные данные", errors: error.errors });
      }
      console.error("Admin update property error:", error);
      res.status(500).json({ message: "Ошибка при обновлении недвижимости" });
    }
  });

  // Delete any property (admin only)
  app.delete("/api/admin/properties/:id", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const deleted = await storage.deleteProperty(req.params.id, "", true);
      if (!deleted) {
        return res.status(404).json({ message: "Недвижимость не найдена" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Admin delete property error:", error);
      res.status(500).json({ message: "Ошибка при удалении недвижимости" });
    }
  });

  // Create property for any user (admin only)
  app.post("/api/admin/properties", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { ownerId, ...propertyData } = req.body;
      
      if (!ownerId) {
        return res.status(400).json({ message: "ID владельца обязателен" });
      }

      const owner = await storage.getUser(ownerId);
      if (!owner) {
        return res.status(404).json({ message: "Владелец не найден" });
      }

      const validatedData = insertPropertySchema.parse(propertyData);
      
      const isUnique = await storage.checkPropertyUniqueness(
        validatedData.address,
        validatedData.ownerFullName,
        validatedData.cadastralNumber
      );
      
      if (!isUnique) {
        return res.status(400).json({ 
          message: "Объект с такой комбинацией адреса, ФИО собственника и кадастрового номера уже существует" 
        });
      }

      const property = await storage.createProperty({
        ...validatedData,
        ownerId,
      });
      
      res.status(201).json(property);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Неверные данные", errors: error.errors });
      }
      console.error("Admin create property error:", error);
      res.status(500).json({ message: "Ошибка при создании недвижимости" });
    }
  });

  return httpServer;
}
