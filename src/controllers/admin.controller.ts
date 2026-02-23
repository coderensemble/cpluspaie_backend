import { Request, Response } from 'express';
import { dbService } from '../services/database.service.js';

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;

    const data = await dbService.getAllUsers(page, limit);

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

export const getContacts = async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;

    const contacts = await dbService.getAllContacts(page, limit);

    res.json({
      success: true,
      data: { contacts },
    });
  } catch (error) {
    console.error("Error fetching contacts:", error);
    res.status(500).json({ error: "Failed to fetch contacts" });
  }
};


export const updateContact = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const contact = await dbService.updateContact(id, updates);

    if (!contact) {
      res.status(404).json({ error: 'Contact not found' });
      return;
    }

    res.json({
      success: true,
      data: { contact },
    });
  } catch (error) {
    console.error('Error updating contact:', error);
    res.status(500).json({ error: 'Failed to update contact' });
  }
};

export const deleteContact = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const deleted = await dbService.deleteContact(id);

    if (!deleted) {
      res.status(404).json({ error: 'Contact not found' });
      return;
    }

    res.json({
      success: true,
      message: 'Contact deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting contact:', error);
    res.status(500).json({ error: 'Failed to delete contact' });
  }
};

export const getStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    const stats = await dbService.getContactStats();

    res.json({
      success: true,
      data: { stats },
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};