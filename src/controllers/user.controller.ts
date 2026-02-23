import { Request, Response } from 'express';
import { dbService } from '../services/database.service.js';

export const getAllUsers = async (req: Request, res: Response) => {
  const { page = '1', limit = '20', role, search } = req.query;

  const result = await dbService.getAllUsers(
    Number(page),
    Number(limit),
    role as any,
    search as string
  );

  res.json({
    success: true,
    data: result.users,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: result.total,
    },
  });
};
