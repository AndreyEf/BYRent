import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, requireAuth } from "./auth";
import { insertPropertySchema, insertRentalRequestSchema, updateUserSchema } from "@shared/schema";
import { z } from "zod";

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

  // Get my rentals (properties I'm renting)
  app.get("/api/rentals/my", requireAuth, async (req: Request, res: Response) => {
    try {
      const rentals = await storage.getRentalsForRequester(req.user!.id);
      res.json(rentals);
    } catch (error) {
      console.error("Get my rentals error:", error);
      res.status(500).json({ message: "Ошибка при получении аренды" });
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

  return httpServer;
}
