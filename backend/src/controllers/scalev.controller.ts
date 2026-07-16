import { Request, Response } from 'express';
import axios from 'axios';

// The base URL for Scalev API v3
const SCALEV_BASE_URL = 'https://api.scalev.id/v3';

export const getScalevDashboardStats = async (req: Request, res: Response) => {
  try {
    const apiKey = process.env.SCALEV_API_KEY;
    
    // If no API key is provided, we return a gentle message or mock data for preview purposes.
    if (!apiKey) {
      return res.status(200).json({ 
        message: 'Scalev API Key not configured. Please add SCALEV_API_KEY to your backend .env file.',
        configured: false,
        data: {
          totalOrders: 0,
          totalRevenue: 0,
          orders: []
        }
      });
    }

    // Try fetching orders from Scalev API v3
    // Scalev usually uses Bearer token for API keys.
    const response = await axios.get(`${SCALEV_BASE_URL}/orders`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json'
      },
      params: {
        limit: 100 // fetch recent 100 orders
      }
    });

    let orders = response.data?.data || [];
    
    // Map orders to ensure frontend receives `total_price`
    orders = orders.map((order: any) => ({
      ...order,
      total_price: parseFloat(order.gross_revenue || order.net_payment_revenue || 0)
    }));

    // Calculate simple stats from orders
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum: number, order: any) => sum + (order.total_price || 0), 0);

    // DUMMY ADS DATA for Scalev Ads (Because user doesn't have access yet)
    const dummyAds = {
      spend: 1500000, // Rp 1.5M
      impressions: 45000,
      clicks: 1200,
      ctr: 2.66,
      cpc: 1250,
      roas: totalRevenue > 0 ? (totalRevenue / 1500000).toFixed(2) : '3.5',
      conversions: totalOrders > 0 ? totalOrders : 25
    };

    return res.status(200).json({
      configured: true,
      data: {
        totalOrders,
        totalRevenue,
        orders: orders,
        dummyAds: dummyAds
      }
    });

  } catch (error: any) {
    console.error('Scalev API Error:', error.response?.data || error.message);
    
    // Return a graceful error so the frontend doesn't break
    return res.status(500).json({ 
      error: 'Failed to fetch data from Scalev API',
      details: error.response?.data || error.message,
      configured: true,
      data: { totalOrders: 0, totalRevenue: 0, orders: [] }
    });
  }
};
