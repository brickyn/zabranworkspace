import { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import prisma from '../prisma';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
});

const getMetaBaseUrl = () => {
  const version = process.env.META_API_VERSION || 'v25.0';
  return `https://graph.facebook.com/${version}`;
};

const getAccessToken = () => {
  return process.env.META_ACCESS_TOKEN || '';
};

// Internal Fetcher logic so AI controller can reuse it without HTTP loop
const fetchCampaignDataForAI = async (adAccountId: string) => {
  const token = getAccessToken();
  if (!token) throw new Error('META_ACCESS_TOKEN is missing');

  // Fetch Campaigns
  const campRes = await fetch(`${getMetaBaseUrl()}/${adAccountId}/campaigns?fields=id,name,status,effective_status,objective&access_token=${token}`);
  const campData = await campRes.json();
  if (campData.error) throw new Error(campData.error.message);

  const campaigns = campData.data || [];
  
  // Fetch Insights
  const fields = 'campaign_name,spend,impressions,reach,clicks,ctr,cpc,cpm,actions';
  const insightPromises = campaigns.map((camp: any) => 
    fetch(`${getMetaBaseUrl()}/${camp.id}/insights?date_preset=maximum&fields=${fields}&access_token=${token}`)
      .then(r => r.json())
      .catch(() => null)
  );

  const insightsResults = await Promise.all(insightPromises);

  const getAction = (actions: any[], actionType: string) => {
    if (!Array.isArray(actions)) return 0;
    const action = actions.find(a => a.action_type === actionType);
    return action ? parseFloat(action.value) : 0;
  };

  const summary = campaigns.map((camp: any, i: number) => {
    const insight = insightsResults[i]?.data?.[0];
    const spend = insight ? parseFloat(insight.spend || 0) : 0;
    const impressions = insight ? parseInt(insight.impressions || 0) : 0;
    const reach = insight ? parseInt(insight.reach || 0) : 0;
    const clicks = insight ? parseInt(insight.clicks || 0) : 0;
    const ctr = insight ? parseFloat(insight.ctr || 0) : 0;
    const cpc = insight ? parseFloat(insight.cpc || 0) : 0;
    const cpm = insight ? parseFloat(insight.cpm || 0) : 0;
    const actions = insight?.actions || [];
    const convStarted = getAction(actions, 'onsite_conversion.messaging_conversation_started_7d');
    
    return {
      campaign_name: camp.name,
      status: camp.effective_status,
      spend, impressions, reach, clicks, ctr, cpc, cpm,
      conversations: convStarted,
      cost_per_conversation: convStarted > 0 ? spend / convStarted : 0
    };
  });

  return summary;
};

// 1. POST /api/v1/meta/ai-analyze
export const analyzeCampaign = async (req: Request, res: Response): Promise<void> => {
  try {
    const { adAccountId } = req.body;
    if (!adAccountId) {
      res.status(400).json({ success: false, error: 'adAccountId is required' });
      return;
    }

    if (!process.env.GEMINI_API_KEY) {
      res.status(400).json({ success: false, error: 'GEMINI_API_KEY is not configured in backend' });
      return;
    }

    // 1. Fetch Meta Data
    const campaignsData = await fetchCampaignDataForAI(adAccountId);

    // 2. Fetch ERP Revenue (Total Completed Transactions)
    const txAggregate = await prisma.transaction.aggregate({
      _sum: { totalAmount: true },
      where: { status: 'Completed' }
    });
    const totalErpRevenue = txAggregate._sum.totalAmount || 0;
    const totalMetaSpend = campaignsData.reduce((acc: number, curr: any) => acc + curr.spend, 0);
    const internalRoas = totalMetaSpend > 0 ? totalErpRevenue / totalMetaSpend : 0;

    // 3. Construct Prompt
    const systemPrompt = `
You are an Expert Performance Marketing Consultant and Data Analyst.
You will be given JSON data representing Facebook Ads campaigns performance, along with Internal ERP Revenue.
Your job is to analyze the data and return a JSON object STRICTLY following this format, NO markdown formatting outside the JSON, just pure JSON:

{
  "executiveSummary": "Summary text including total spend, clicks, avg ctr, total conversations, and identifying the most efficient campaign with reasons.",
  "bestCampaigns": [
    { "name": "...", "reason": "..." }
  ],
  "worstCampaigns": [
    { "name": "...", "reason": "...", "issue": "CPC mahal / CTR rendah dll" }
  ],
  "budgetRecommendations": [
    { "name": "...", "action": "Scale Up | Maintain | Pause", "reason": "..." }
  ],
  "creativeRecommendations": "General recommendations based on CTR...",
  "audienceRecommendations": "General recommendations based on CPM...",
  "funnelAnalysis": "Analysis of Impression -> Reach -> Click -> Conversation bottlenecks.",
  "internalRoas": {
    "revenue": number,
    "spend": number,
    "roas": number,
    "analysis": "..."
  },
  "alerts": [
    "Warning: CTR < 1% on campaign X",
    "Warning: CPC is too high on campaign Y"
  ],
  "opportunities": [
    "Campaign X is performing well but budget is low, scale up 30%"
  ],
  "dailyInsight": "A quick actionable daily tip based on today's/overall data."
}

Use Indonesian language for the text fields. Be professional, analytical, and provide clear actionable recommendations.
    `;

    const userData = {
      internalErpRevenue: totalErpRevenue,
      totalMetaSpend: totalMetaSpend,
      internalRoas: internalRoas,
      campaigns: campaignsData
    };

    const fullPrompt = systemPrompt + "\n\nHere is the data:\n" + JSON.stringify(userData, null, 2);

    // 4. Call Gemini API
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: fullPrompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    const aiResponse = response.text || '{}';
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(aiResponse);
    } catch (e) {
      res.status(500).json({ success: false, error: 'Failed to parse AI response' });
      return;
    }

    res.status(200).json({ success: true, data: parsedResponse });
  } catch (error: any) {
    console.error('AI Analysis Error:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
};

// 2. POST /api/v1/meta/ai-chat
export const aiChat = async (req: Request, res: Response): Promise<void> => {
  try {
    const { adAccountId, message, history } = req.body;
    if (!message || !adAccountId) {
      res.status(400).json({ success: false, error: 'adAccountId and message are required' });
      return;
    }

    const campaignsData = await fetchCampaignDataForAI(adAccountId);
    const txAggregate = await prisma.transaction.aggregate({
      _sum: { totalAmount: true },
      where: { status: 'Completed' }
    });
    
    const contextStr = JSON.stringify({
      internalErpRevenue: txAggregate._sum.totalAmount || 0,
      campaigns: campaignsData
    });

    const systemInstruction = `You are an Expert Performance Marketing Consultant. Use Indonesian. You have the following live Meta Ads data context: ${contextStr}. Answer the user's questions clearly, refer to the campaign data, explain why, and give actionable recommendations.`;

    // Map history to Gemini format
    const contents = (history || []).map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));
    
    // Add the current user message
    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
      config: {
        systemInstruction
      }
    });

    res.status(200).json({ success: true, data: { reply: response.text } });
  } catch (error: any) {
    console.error('AI Chat Error:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
};
