import { pool } from "../config/database.js";
import { DBUser, UserRole } from "../types/auth.types.js";
import { Contact, CreateContactDTO, UpdateContactDTO, ContactStats } from "../types/contact.types.js";
import { QueryResult } from "pg";


export class DatabaseService {
  // Users
  async createOrUpdateUser(
    auth0Id: string,
    email: string,
    name: string | null,
    role: UserRole,
    metadata: Record<string, unknown> = {}
  ): Promise<DBUser> {
    const result: QueryResult<DBUser> = await pool.query(
      `INSERT INTO users (auth0_id, email, name, role, metadata)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (auth0_id) 
       DO UPDATE SET 
         email = EXCLUDED.email,
         name = EXCLUDED.name,
         role = EXCLUDED.role,
         metadata = EXCLUDED.metadata,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [auth0Id, email, name, role, JSON.stringify(metadata)]
    );

    return result.rows[0];
  }

  async getUserByAuth0Id(auth0Id: string): Promise<DBUser | null> {
    const result: QueryResult<DBUser> = await pool.query("SELECT * FROM users WHERE auth0_id = $1", [auth0Id]);

    return result.rows[0] || null;
  }

  // Contacts
  async createContact(data: CreateContactDTO, userId?: string): Promise<Contact> {
    const result: QueryResult<Contact> = await pool.query(
      `INSERT INTO contacts (user_id, name, email, phone, message, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId || null, data.name, data.email, data.phone || null, data.message, "new"]
    );

    return result.rows[0];
  }

  async getContactsByUserId(userId: string): Promise<Contact[]> {
    const result: QueryResult<Contact> = await pool.query(
      `SELECT * FROM contacts 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [userId]
    );

    return result.rows;
  }

  async getAllContacts(page = 1, limit = 20) {
  const offset = (page - 1) * limit;

  const { rows } = await pool.query(
    `
    SELECT id, name, email, phone, message, status, created_at
    FROM contacts
    ORDER BY created_at DESC
    LIMIT $1 OFFSET $2
    `,
    [limit, offset]
  );

  return rows;
}


 // Users (Admin)
async getAllUsers(
  page: number = 1,
  limit: number = 20,
  role?: UserRole,
  search?: string
): Promise<{ users: DBUser[]; total: number }> {
  const offset = (page - 1) * limit;
  const params: (string | number)[] = [];

  let query = `
    SELECT id, auth0_id, email, name, role, metadata, created_at
    FROM users
    WHERE 1=1
  `;
  // Filtre par rôle
  if (role) {
    params.push(role);
    query += ` AND role = $${params.length}`;
  }

  // Recherche email / name
  if (search) {
    params.push(`%${search}%`);
    query += `
      AND (
        email ILIKE $${params.length}
        OR name ILIKE $${params.length}
      )
    `;
  }

  // Pagination
  query += `
    ORDER BY created_at DESC
    LIMIT $${params.length + 1}
    OFFSET $${params.length + 2}
  `;
  params.push(limit, offset);

  const result = await pool.query<DBUser>(query, params);
console.log('SQL query executed:', query);
console.log('Params:', params);
console.log('Users fetched:', result.rows);
  /* ---------- COUNT ---------- */
  const countParams: (string | number)[] = [];
  let countQuery = `SELECT COUNT(*) FROM users WHERE 1=1`;

  if (role) {
    countParams.push(role);
    countQuery += ` AND role = $${countParams.length}`;
  }

  if (search) {
    countParams.push(`%${search}%`);
    countQuery += `
      AND (
        email ILIKE $${countParams.length}
        OR name ILIKE $${countParams.length}
      )
    `;
  }

  const countResult = await pool.query(countQuery, countParams);
console.log('Count query:', countQuery);
console.log('Count params:', countParams);
console.log('Total users:', countResult.rows[0].count);


  return {
    users: result.rows,
    total: Number(countResult.rows[0].count),
  };
}

async getUserRequests(userId: string): Promise<Contact[]> {
  const result = await pool.query(
    `SELECT * FROM contacts WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId] // UUID interne
  );
  return result.rows;
}

// Créer une nouvelle demande (devis ou IA)
async createRequest(data: CreateContactDTO & { user_id: string }): Promise<Contact> {
  const result: QueryResult<Contact> = await pool.query(
    `INSERT INTO contacts (user_id, name, email, phone, message, status)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [data.user_id, data.name, data.email, data.phone || null, data.message,"new"]
  );

  return result.rows[0];
}

  async getContactById(id: string): Promise<Contact | null> {
    const result: QueryResult<Contact> = await pool.query("SELECT * FROM contacts WHERE id = $1", [id]);

    return result.rows[0] || null;
  }

  async updateContact(id: string, data: UpdateContactDTO): Promise<Contact | null> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let index = 1;

    if (data.name !== undefined) {
      fields.push(`name = $${index++}`);
      values.push(data.name);
    }
    if (data.email !== undefined) {
      fields.push(`email = $${index++}`);
      values.push(data.email);
    }
    if (data.phone !== undefined) {
      fields.push(`phone = $${index++}`);
      values.push(data.phone);
    }
    if (data.message !== undefined) {
      fields.push(`message = $${index++}`);
      values.push(data.message);
    }
    if (data.status !== undefined) {
      fields.push(`status = $${index++}`);
      values.push(data.status);
    }

    if (fields.length === 0) {
      return this.getContactById(id);
    }

    values.push(id);
    const query = `
      UPDATE contacts 
      SET ${fields.join(", ")}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${index}
      RETURNING *
    `;

    const result: QueryResult<Contact> = await pool.query(query, values);
    return result.rows[0] || null;
  }

  async deleteContact(id: string): Promise<boolean> {
    const result = await pool.query("DELETE FROM contacts WHERE id = $1 RETURNING id", [id]);
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getContactStats(): Promise<ContactStats> {
    const result = await pool.query<ContactStats>(`
      SELECT 
        COUNT(*)::int as total,
        COUNT(*) FILTER (WHERE status = 'new')::int as new,
        COUNT(*) FILTER (WHERE status = 'in_progress')::int as in_progress,
        COUNT(*) FILTER (WHERE status = 'resolved')::int as resolved,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days')::int as this_week
      FROM contacts
    `);

    return result.rows[0];
  }
}

export const dbService = new DatabaseService();
