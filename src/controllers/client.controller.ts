// controllers/client.controller.ts
import { Request, Response } from 'express';
import { dbService } from '../services/database.service.js';
import { AuthRequest, } from '../types/auth.types.js';
import { CreateContactDTO } from '../types/contact.types.js';
import { CreateDevisBody } from '../types/contact.types.js';


export const getMyRequests = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log('req.user:', req.user); 

    // Utilise l'ID interne de la DB (UUID)
    const userId = req.user.id; 

    const requests = await dbService.getUserRequests(userId);
    console.log('DB requests:', requests); // tu devrais voir le log maintenant

    return res.json({ data: { contacts: requests } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch requests' });
  }
};

export const getStats = async (_req: AuthRequest, res: Response) => {
  try {
    const stats = await dbService.getContactStats();
    return res.json({ success: true, data: { stats } });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return res.status(500).json({ error: 'Failed to fetch stats' });
  }
}



export const createDevisRequest = async (req: AuthRequest<CreateDevisBody>, res: Response) => {
  if (!req.user?.id) return res.status(401).json({ error: 'Utilisateur non authentifié' });
  try {
    // Vérifie que userId existe
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Utilisateur non authentifié' });
    }
    const userId: string = req.user.id;

    const payload: CreateContactDTO & { user_id: string } = {
  user_id: userId,
  name: req.body.company_name,
  email: req.body.email,
  phone: req.body.telephone,
  message: req.body.message,
  status: 'new',
};


    console.log('Payload sent to DB:', payload);
    console.log('Phone length:', payload.phone?.length);

    const request = await dbService.createRequest(payload);

    return res.json({ success: true, data: request });
  } catch (error) {
    console.error('Error creating devis request:', error);
    return res.status(500).json({ error: 'Failed to create request' });
  }
};


export const createAIRequest = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const request = await dbService.createRequest({
      user_id: userId,
      type: 'ai_optimization',
      ...req.body,
    });

    res.json({ success: true, data: request });
  } catch (error) {
    console.error('Error creating AI request:', error);
    res.status(500).json({ error: 'Failed to create AI request' });
  }
};
