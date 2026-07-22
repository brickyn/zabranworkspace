import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../prisma';

const JWT_SECRET = process.env.JWT_SECRET as string;
// Note: Server will crash at startup (index.ts) if JWT_SECRET is missing — no fallback.

export interface AuthRequest extends Request {
  user?: {
    id: string;
    name: string;
    role: string;
    branchId: string | null;
    permissions?: string[];
  };
}

export const authenticateJWT = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        res.status(403).json({ success: false, error: 'Forbidden: Invalid Token' });
        return;
      }
      req.user = decoded as AuthRequest['user'];
      next();
    });
  } else {
    res.status(401).json({ success: false, error: 'Unauthorized: Missing Token' });
  }
};

export const authorizeRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized: User not found' });
      return;
    }
    
    // Super Admin can access everything
    if (req.user.role === 'Super Admin') {
      next();
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ success: false, error: 'Forbidden: Insufficient Permissions' });
      return;
    }
    
    next();
  };
};

const ROLE_DEFAULT_PERMISSIONS: Record<string, string[]> = {
  Warehouse: ['Inventory.View', 'Inventory.Create', 'Inventory.Edit', 'Inventory.Delete', 'Inventory.Receive', 'Inventory.Transfer'],
  'Warehouse Admin': ['Inventory.View', 'Inventory.Create', 'Inventory.Edit', 'Inventory.Delete', 'Inventory.Receive', 'Inventory.Transfer'],
  Admin: ['Inventory.View', 'Inventory.Create', 'Inventory.Edit', 'Inventory.Delete', 'Inventory.Receive', 'Inventory.Transfer', 'Dashboard.View'],
  Cashier: ['POS.View', 'POS.Create', 'Inventory.View', 'CRM.View'],
  Leader: ['POS.View', 'POS.Create', 'POS.Void', 'Inventory.View', 'Inventory.Create', 'Inventory.Edit', 'Inventory.Delete', 'Laporan.View', 'CRM.View'],
  Manager: ['Dashboard.View', 'Inventory.View', 'Inventory.Create', 'Inventory.Edit', 'Inventory.Delete', 'Laporan.View', 'B2B.View', 'BSB.View', 'CRM.View', 'Finance.View'],
  Management: ['Dashboard.View', 'Inventory.View', 'Inventory.Create', 'Inventory.Edit', 'Inventory.Delete', 'Laporan.View', 'B2B.View', 'BSB.View', 'CRM.View', 'Finance.View', 'Users.View'],
  Finance: ['Dashboard.View', 'Finance.View', 'Laporan.View', 'Inventory.View', 'Inventory.Create', 'Inventory.Edit']
};

export const requirePermission = (permission: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized: User not found' });
      return;
    }
    
    const userRole = (req.user.role || '').trim();
    const lowerRole = userRole.toLowerCase();

    // System Admins & Management override
    if (lowerRole.includes('super admin') || lowerRole.includes('owner') || lowerRole.includes('management') || lowerRole.includes('admin')) {
      next();
      return;
    }

    // Warehouse & Operational inventory roles override
    if (permission.startsWith('Inventory.') && (lowerRole.includes('warehouse') || lowerRole.includes('gudang') || lowerRole.includes('leader') || lowerRole.includes('manager') || lowerRole.includes('finance'))) {
      next();
      return;
    }

    const userPerms = req.user.permissions || [];
    let defaultPerms: string[] = [];
    for (const [rKey, pList] of Object.entries(ROLE_DEFAULT_PERMISSIONS)) {
      if (rKey.toLowerCase() === lowerRole || lowerRole.includes(rKey.toLowerCase())) {
        defaultPerms = [...defaultPerms, ...pList];
      }
    }

    const permPrefix = permission.split('.')[0];

    const hasPerm = userPerms.includes(permission) || 
                    userPerms.some(p => p.startsWith(permPrefix + '.')) ||
                    defaultPerms.includes(permission);

    if (!hasPerm) {
      res.status(403).json({ success: false, error: `Forbidden: Missing Permission (${permission})` });
      return;
    }
    
    next();
  };
};

/**
 * Validasi Real-Time (Stateful Authorization)
 * 
 * Middleware ini tidak hanya mengecek isi JWT, tetapi langsung melakukan query ke Database
 * untuk memastikan hak akses delegasi atau peran utama BENAR-BENAR masih aktif saat ini.
 * 
 * PERHATIAN PERFORMA:
 * Hanya gunakan middleware ini pada endpoint berisiko tinggi (misal: Void Transaksi, Approve PO, Hapus Data).
 * Untuk endpoint pembacaan ringan (misal: Get List Product), gunakan requirePermission() biasa (Stateless/JWT).
 */
export const requireRealtimePermission = (permission: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Unauthorized: User not found' });
        return;
      }
      
      // System Admins override
      if (req.user.role === 'Super Admin' || req.user.role === 'Owner') {
        next();
        return;
      }

      // Query database secara real-time
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: {
          userRole: {
            include: {
              permissions: { include: { permission: true } }
            }
          },
          roleDelegationsTo: {
            // HANYA ambil delegasi yang masih aktif dan belum kedaluwarsa
            where: { isActive: true, validUntil: { gte: new Date() } },
            include: {
              role: {
                include: { permissions: { include: { permission: true } } }
              }
            }
          }
        }
      });

      if (!user) {
        res.status(401).json({ success: false, error: 'Unauthorized: User record no longer exists' });
        return;
      }

      if (!user.isActive) {
        res.status(403).json({ success: false, error: 'Forbidden: Your account has been disabled' });
        return;
      }

      // Kumpulkan ulang semua permissions real-time
      const permissionSet = new Set<string>();
      if (user.userRole) {
        user.userRole.permissions.forEach(rp => permissionSet.add(rp.permission.action));
      }
      user.roleDelegationsTo.forEach(delegation => {
        delegation.role.permissions.forEach(rp => permissionSet.add(rp.permission.action));
      });

      // Validasi ketat
      if (!permissionSet.has(permission)) {
        res.status(403).json({ 
          success: false, 
          error: `Forbidden: Akses ditolak. Hak akses Anda untuk aksi [${permission}] telah dicabut atau masa delegasi telah habis.` 
        });
        return;
      }

      next();
    } catch (error) {
      console.error('[Realtime Auth Error]', error);
      res.status(500).json({ success: false, error: 'Internal Server Error during authorization validation' });
    }
  };
};
