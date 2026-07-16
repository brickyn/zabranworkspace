import { Request, Response } from 'express';
import prisma from '../prisma';

export const getSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const settings = await prisma.systemSetting.findMany();
    // Convert array of {key, value} to a dictionary
    const settingsDict = settings.reduce((acc: any, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});
    
    res.json({ success: true, data: settingsDict });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Failed to fetch settings' });
  }
};

export const updateSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const settingsObj = req.body; // Expecting { "STORE_NAME": "Zabran", "RECEIPT_FOOTER": "Thanks!" }
    
    const upsertPromises = Object.keys(settingsObj).map(key => {
      return prisma.systemSetting.upsert({
        where: { key },
        update: { value: String(settingsObj[key]) },
        create: { key, value: String(settingsObj[key]) }
      });
    });

    await Promise.all(upsertPromises);
    
    res.json({ success: true, message: 'Settings updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Failed to update settings' });
  }
};
