import { Request, Response } from 'express';

const getMetaBaseUrl = () => {
  const version = process.env.META_API_VERSION || 'v25.0';
  return `https://graph.facebook.com/${version}`;
};

const getAccessToken = () => {
  return process.env.META_ACCESS_TOKEN || '';
};

// Helper untuk mengambil action_value dari array actions Meta
const getActionValue = (actions: any[], actionType: string): number => {
  if (!Array.isArray(actions)) return 0;
  const action = actions.find((a: any) => a.action_type === actionType);
  return action && action.value ? parseFloat(action.value) : 0;
};

// 1. GET /api/meta/ad-accounts
export const getAdAccounts = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = getAccessToken();
    if (!token) {
      res.status(400).json({ success: false, error: 'META_ACCESS_TOKEN is not configured.' });
      return;
    }

    const url = `${getMetaBaseUrl()}/me/adaccounts?fields=id,account_id,name,account_status&access_token=${token}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      res.status(400).json({ success: false, error: data.error.message });
      return;
    }

    res.status(200).json({ success: true, data: data.data || [] });
  } catch (error: any) {
    console.error('Meta API Error:', error);
    res.status(500).json({ success: false, error: 'Internal server error while fetching ad accounts.' });
  }
};

// 2. GET /api/meta/campaigns?adAccountId=act_xxxxx
export const getCampaigns = async (req: Request, res: Response): Promise<void> => {
  try {
    const { adAccountId } = req.query;
    const token = getAccessToken();
    
    if (!adAccountId) {
      res.status(400).json({ success: false, error: 'adAccountId query parameter is required.' });
      return;
    }

    const url = `${getMetaBaseUrl()}/${adAccountId}/campaigns?fields=id,name,status,effective_status,objective,created_time,start_time,stop_time&access_token=${token}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      res.status(400).json({ success: false, error: data.error.message });
      return;
    }

    res.status(200).json({ success: true, data: data.data || [] });
  } catch (error: any) {
    res.status(500).json({ success: false, error: 'Internal server error while fetching campaigns.' });
  }
};

// 3. GET /api/meta/campaign-insights?campaignId=xxxxx
export const getCampaignInsights = async (req: Request, res: Response): Promise<void> => {
  try {
    const { campaignId } = req.query;
    const token = getAccessToken();
    
    if (!campaignId) {
      res.status(400).json({ success: false, error: 'campaignId query parameter is required.' });
      return;
    }

    const fields = 'campaign_name,spend,impressions,reach,clicks,ctr,cpc,cpm,actions,action_values,purchase_roas';
    const url = `${getMetaBaseUrl()}/${campaignId}/insights?date_preset=maximum&fields=${fields}&access_token=${token}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      res.status(400).json({ success: false, error: data.error.message });
      return;
    }

    res.status(200).json({ success: true, data: data.data || [] });
  } catch (error: any) {
    res.status(500).json({ success: false, error: 'Internal server error while fetching insights.' });
  }
};

// 4. GET /api/meta/dashboard?adAccountId=act_xxxxx
export const getDashboard = async (req: Request, res: Response): Promise<void> => {
  try {
    const { adAccountId } = req.query;
    const token = getAccessToken();
    
    if (!token) {
      res.status(400).json({ success: false, error: 'META_ACCESS_TOKEN is not configured in backend.' });
      return;
    }

    if (!adAccountId) {
      res.status(400).json({ success: false, error: 'adAccountId is required.' });
      return;
    }

    // A. Fetch Campaigns
    const campUrl = `${getMetaBaseUrl()}/${adAccountId}/campaigns?fields=id,name,status,effective_status,objective&access_token=${token}`;
    const campRes = await fetch(campUrl);
    const campData = await campRes.json();
    
    if (campData.error) {
      res.status(400).json({ success: false, error: campData.error.message });
      return;
    }

    const campaigns = campData.data || [];
    const dashboardData = [];

    // B. Fetch Insights
    const fields = 'campaign_name,spend,impressions,reach,clicks,ctr,cpc,cpm,actions,action_values,purchase_roas';
    const insightPromises = campaigns.map((camp: any) => 
      fetch(`${getMetaBaseUrl()}/${camp.id}/insights?date_preset=maximum&fields=${fields}&access_token=${token}`)
        .then(r => r.json())
        .catch(e => ({ error: true, id: camp.id }))
    );

    const insightsResults = await Promise.all(insightPromises);

    // C. Combine Data
    for (let i = 0; i < campaigns.length; i++) {
      const camp = campaigns[i];
      const insightRes = insightsResults[i];
      
      const insight = insightRes && insightRes.data && insightRes.data.length > 0 ? insightRes.data[0] : null;

      // Parsing basic stats
      const spend = insight ? parseFloat(insight.spend || 0) : 0;
      const impressions = insight ? parseInt(insight.impressions || 0) : 0;
      const reach = insight ? parseInt(insight.reach || 0) : 0;
      const clicks = insight ? parseInt(insight.clicks || 0) : 0;
      const ctr = insight ? parseFloat(insight.ctr || 0) : 0;
      const cpc = insight ? parseFloat(insight.cpc || 0) : 0;
      const cpm = insight ? parseFloat(insight.cpm || 0) : 0;
      
      // Parsing actions
      const actions = insight && insight.actions ? insight.actions : [];
      const linkClick = getActionValue(actions, 'link_click');
      const convStarted = getActionValue(actions, 'onsite_conversion.messaging_conversation_started_7d');
      const firstReply = getActionValue(actions, 'onsite_conversion.messaging_first_reply');
      const totalConnection = getActionValue(actions, 'onsite_conversion.total_messaging_connection');

      // Calculating derived metrics
      const costPerConversation = convStarted > 0 ? spend / convStarted : 0;
      const costPerLinkClick = linkClick > 0 ? spend / linkClick : 0;

      // Parsing ROAS
      const purchaseRoasArray = insight && insight.purchase_roas ? insight.purchase_roas : [];
      const roas = getActionValue(purchaseRoasArray, 'omni_purchase');

      dashboardData.push({
        campaign_id: camp.id,
        campaign_name: camp.name,
        status: camp.status,
        effective_status: camp.effective_status,
        objective: camp.objective,
        spend,
        impressions,
        reach,
        clicks,
        ctr,
        cpc,
        cpm,
        messaging_conversation_started: convStarted,
        messaging_first_reply: firstReply,
        total_messaging_connection: totalConnection,
        link_click: linkClick,
        purchase_roas: roas,
        cost_per_conversation: costPerConversation,
        cost_per_link_click: costPerLinkClick
      });
    }

    res.status(200).json({ success: true, data: dashboardData });
  } catch (error: any) {
    console.error('Meta API Dashboard Error:', error);
    res.status(500).json({ success: false, error: 'Internal server error while fetching dashboard data.' });
  }
};

// 5. GET /api/meta/dashboard-stats?adAccountId=act_xxxxx
export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { adAccountId } = req.query;
    const token = getAccessToken();
    
    if (!token || !adAccountId) {
      res.status(400).json({ success: false, error: 'Token or adAccountId missing.' });
      return;
    }

    // Ambil insight harian untuk seluruh Ad Account (30 hari terakhir)
    const fields = 'spend,impressions,reach,clicks,ctr,cpc,cpm,actions';
    const url = `${getMetaBaseUrl()}/${adAccountId}/insights?time_increment=1&date_preset=last_30d&fields=${fields}&access_token=${token}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      res.status(400).json({ success: false, error: data.error.message });
      return;
    }

    const trends = (data.data || []).map((day: any) => {
      const spend = parseFloat(day.spend || 0);
      const ctr = parseFloat(day.ctr || 0);
      const cpc = parseFloat(day.cpc || 0);
      const actions = day.actions || [];
      const convStarted = getActionValue(actions, 'onsite_conversion.messaging_conversation_started_7d');
      return {
        date: day.date_start,
        spend,
        ctr,
        cpc,
        conversations: convStarted
      };
    });

    res.status(200).json({ success: true, data: trends });
  } catch (error: any) {
    res.status(500).json({ success: false, error: 'Internal server error while fetching stats.' });
  }
};
