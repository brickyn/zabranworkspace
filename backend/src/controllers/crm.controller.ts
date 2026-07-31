import { Request, Response } from 'express';
import prisma from '../prisma';

const getDateFilters = (req: Request) => {
  const { month, year, startDate, endDate, branchId, filterType } = req.query;
  
  let start: Date | undefined;
  let end: Date | undefined;
  let prevStart: Date | undefined;
  let prevEnd: Date | undefined;

  if (filterType === 'all') {
    start = undefined;
    end = undefined;
    prevStart = undefined;
    prevEnd = undefined;
  } else if (startDate && endDate) {
    start = new Date(startDate as string);
    start.setHours(0, 0, 0, 0);
    end = new Date(endDate as string);
    end.setHours(23, 59, 59, 999);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    prevStart = new Date(start.getTime() - diffTime - (24 * 60 * 60 * 1000));
    prevEnd = new Date(start.getTime() - (24 * 60 * 60 * 1000));
  } else if (year && !month) {
    // Only year provided
    const y = Number(year);
    start = new Date(y, 0, 1);
    end = new Date(y, 11, 31, 23, 59, 59);
    
    prevStart = new Date(y - 1, 0, 1);
    prevEnd = new Date(y - 1, 11, 31, 23, 59, 59);
  } else if (month && year) {
    const m = Number(month);
    const y = Number(year);
    start = new Date(y, m - 1, 1);
    end = new Date(y, m, 0, 23, 59, 59);
    
    let prevM = m - 1;
    let prevY = y;
    if (prevM === 0) { prevM = 12; prevY = y - 1; }
    prevStart = new Date(prevY, prevM - 1, 1);
    prevEnd = new Date(prevY, prevM, 0, 23, 59, 59);
  } else {
    // Default to all time if no specific date filters provided
    start = undefined;
    end = undefined;
    prevStart = undefined;
    prevEnd = undefined;
  }

  const branchFilter = branchId ? { branchId: branchId as string } : {};

  return { start, end, prevStart, prevEnd, branchFilter };
};

export const getCRMMetrics = async (req: Request, res: Response) => {
  try {
    const { start, end, prevStart, prevEnd, branchFilter } = getDateFilters(req);
    
    const dateQuery = (start && end) ? { purchaseDate: { gte: start, lte: end } } : {};
    const prevDateQuery = (prevStart && prevEnd) ? { purchaseDate: { gte: prevStart, lte: prevEnd } } : {};

    const [
      dailyReviews, prevDailyReviews, 
      guests, prevGuests, 
      activities, prevActivities,
      customers, prevCustomers,
      allCustomerPhones,
      totalActiveCustomers,
      totalInactiveCustomers,
      activitiesWithResponse
    ] = await Promise.all([
      prisma.cRMDailyReview.findMany({ where: { ...branchFilter } }),
      prisma.cRMDailyReview.findMany({ where: { ...branchFilter } }),
      prisma.cRMMysteryGuest.findMany({ where: { ...branchFilter } }),
      prisma.cRMMysteryGuest.findMany({ where: { ...branchFilter } }),
      prisma.cRMActivity.count(),
      prisma.cRMActivity.count(),
      prisma.cRMCustomerData.findMany({ where: { ...branchFilter, ...dateQuery } }),
      prisma.cRMCustomerData.findMany({ where: { ...branchFilter, ...prevDateQuery } }),
      prisma.cRMCustomerData.groupBy({ by: ['phone'], _count: { _all: true } }),
      prisma.cRMCustomerData.groupBy({ by: ['phone'], where: { isActive: true, ...branchFilter } }),
      prisma.cRMCustomerData.groupBy({ by: ['phone'], where: { isActive: false, ...branchFilter } }),
      prisma.cRMActivity.findMany({ where: { responseTime: { not: null } } })
    ]);

    const calculateAvgRating = (reviews: any[]) => {
      let totalStars = 0;
      let totalCount = 0;
      reviews.forEach(r => {
        totalStars += (r.star5 * 5) + (r.star4 * 4) + (r.star3 * 3) + (r.star2 * 2) + (r.star1 * 1);
        totalCount += r.star5 + r.star4 + r.star3 + r.star2 + r.star1;
      });
      return totalCount > 0 ? totalStars / totalCount : 0;
    };

    const avgRating = calculateAvgRating(dailyReviews);
    const prevAvgRating = calculateAvgRating(prevDailyReviews);
    const ratingTrend = prevAvgRating === 0 ? (avgRating > 0 ? 100 : 0) : ((avgRating - prevAvgRating) / prevAvgRating) * 100;

    const totalReviews = dailyReviews.reduce((sum, r) => sum + r.star5 + r.star4 + r.star3 + r.star2 + r.star1, 0);

    const avgMysteryGuest = guests.length > 0 ? guests.reduce((acc, g) => acc + g.score, 0) / guests.length : 0;
    const prevAvgMysteryGuest = prevGuests.length > 0 ? prevGuests.reduce((acc, g) => acc + g.score, 0) / prevGuests.length : 0;
    const mysteryGuestTrend = prevAvgMysteryGuest === 0 ? (avgMysteryGuest > 0 ? 100 : 0) : ((avgMysteryGuest - prevAvgMysteryGuest) / prevAvgMysteryGuest) * 100;

    const activitiesTrend = prevActivities === 0 ? (activities > 0 ? 100 : 0) : ((activities - prevActivities) / prevActivities) * 100;

    const avgResponseTime = activitiesWithResponse.length > 0 
      ? activitiesWithResponse.reduce((sum, r) => sum + r.responseTime!, 0) / activitiesWithResponse.length 
      : 0;

    const totalCustomers = new Set(customers.map(c => c.phone)).size;
    const prevTotalCustomers = new Set(prevCustomers.map(c => c.phone)).size;
    const customersTrend = prevTotalCustomers === 0 ? (totalCustomers > 0 ? 100 : 0) : ((totalCustomers - prevTotalCustomers) / prevTotalCustomers) * 100;

    const activeCustomers = new Set(customers.filter(c => c.isActive).map(c => c.phone)).size;
    const inactiveCustomers = new Set(customers.filter(c => !c.isActive).map(c => c.phone)).size;
    
    const activePercentage = totalActiveCustomers.length > 0 ? (totalActiveCustomers.length / (totalActiveCustomers.length + totalInactiveCustomers.length)) * 100 : 0;
    const inactivePercentage = totalInactiveCustomers.length > 0 ? (totalInactiveCustomers.length / (totalActiveCustomers.length + totalInactiveCustomers.length)) * 100 : 0;

    const phoneCountMap = new Map();
    allCustomerPhones.forEach(p => phoneCountMap.set(p.phone, p._count._all));
    
    const uniqueRepeatCustomersThisMonth = new Set(customers.filter(c => phoneCountMap.get(c.phone) > 1).map(c => c.phone)).size;
    const uniqueRepeatCustomersPrevMonth = new Set(prevCustomers.filter(c => phoneCountMap.get(c.phone) > 1).map(c => c.phone)).size;
    const repeatOrderTrend = uniqueRepeatCustomersPrevMonth === 0 ? (uniqueRepeatCustomersThisMonth > 0 ? 100 : 0) : ((uniqueRepeatCustomersThisMonth - uniqueRepeatCustomersPrevMonth) / uniqueRepeatCustomersPrevMonth) * 100;

    res.json({
      success: true,
      data: {
        totalFeedback: totalReviews,
        avgRating,
        ratingTrend,
        avgMysteryGuest,
        mysteryGuestTrend,
        avgResponseTime,
        totalActivities: activities,
        activitiesTrend,
        totalCustomers,
        customersTrend,
        activeCustomers,
        inactiveCustomers,
        totalActiveCustomers: totalActiveCustomers.length,
        totalInactiveCustomers: totalInactiveCustomers.length,
        activePercentage,
        inactivePercentage,
        repeatOrders: uniqueRepeatCustomersThisMonth,
        repeatOrderTrend
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch CRM metrics' });
  }
};

export const getActivities = async (req: Request, res: Response) => {
  try {
    const { start, end } = getDateFilters(req);
    const dateQuery = (start && end) ? { date: { gte: start, lte: end } } : {};
    const activities = await prisma.cRMActivity.findMany({
      where: dateQuery,
      orderBy: { date: 'desc' }
    });
    res.json({ success: true, data: activities });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch activities' });
  }
};

export const createActivity = async (req: Request, res: Response) => {
  try {
    const activity = await prisma.cRMActivity.create({
      data: {
        type: req.body.type,
        description: req.body.description,
        date: new Date(req.body.date),
        responseTime: req.body.responseTime ? Number(req.body.responseTime) : null,
        picName: req.body.picName,
      }
    });
    res.status(201).json({ success: true, data: activity });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create activity' });
  }
};

// ─── DAILY REVIEWS ───

export const getDailyReviews = async (req: Request, res: Response) => {
  try {
    const { start, end } = getDateFilters(req);
    const dateQuery = (start && end) ? { date: { gte: start, lte: end } } : {};
    const reviews = await prisma.cRMDailyReview.findMany({
      where: dateQuery,
      include: { branch: { select: { name: true } } },
      orderBy: { date: 'desc' }
    });
    res.json({ success: true, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch daily reviews' });
  }
};

export const createDailyReview = async (req: Request, res: Response) => {
  try {
    const review = await prisma.cRMDailyReview.create({
      data: {
        branchId: req.body.branchId,
        date: new Date(req.body.date),
        star5: Number(req.body.star5) || 0,
        star4: Number(req.body.star4) || 0,
        star3: Number(req.body.star3) || 0,
        star2: Number(req.body.star2) || 0,
        star1: Number(req.body.star1) || 0,
        problemNotes: req.body.problemNotes,
        picName: req.body.picName,
      }
    });
    res.status(201).json({ success: true, data: review });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create daily review' });
  }
};

// ─── CUSTOMER DATA ───

export const getCustomerData = async (req: Request, res: Response) => {
  try {
    const { start, end, branchFilter } = getDateFilters(req);
    const dateFilter = (start && end) ? { purchaseDate: { gte: start, lte: end } } : {};

    const customers = await prisma.cRMCustomerData.findMany({
      where: { ...branchFilter, ...dateFilter },
      include: { branch: { select: { name: true } } },
      orderBy: { purchaseDate: 'desc' }
    });

    const yearlyData = await prisma.cRMCustomerData.groupBy({
      by: ['phone'],
      _sum: { purchaseQty: true, purchaseAmount: true }
    });

    const loyaltyMap = new Map();
    yearlyData.forEach(d => loyaltyMap.set(d.phone, d._sum));

    const enrichedCustomers = customers.map(c => {
      const stats = loyaltyMap.get(c.phone) || { purchaseQty: 0, purchaseAmount: 0 };
      const totalQty = stats.purchaseQty || 0;
      const totalAmount = stats.purchaseAmount || 0;

      let badge = 'Reguler';
      if (totalAmount > 75000000) badge = 'Platinum';
      else if (totalAmount >= 35000000) badge = 'Gold';
      else if (totalAmount >= 15000000) badge = 'Silver';
      else if (totalAmount >= 1000000) badge = 'Bronze';
      else if (totalQty > 1) badge = 'Loyal';

      return {
        ...c,
        yearlyQty: totalQty,
        yearlyAmount: totalAmount,
        loyaltyBadge: badge
      };
    });

    res.json({ success: true, data: enrichedCustomers });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch customer data' });
  }
};

export const createCustomerData = async (req: Request, res: Response) => {
  try {
    const customer = await prisma.cRMCustomerData.create({
      data: {
        customerName: req.body.customerName,
        phone: req.body.phone,
        branchId: req.body.branchId,
        purchaseDate: new Date(req.body.purchaseDate),
        purchaseDetails: req.body.purchaseDetails,
        purchaseQty: Number(req.body.purchaseQty) || 1,
        purchaseAmount: Number(req.body.purchaseAmount) || 0,
        isActive: req.body.isActive === true || req.body.isActive === 'true',
        lastFollowUp: req.body.lastFollowUp ? new Date(req.body.lastFollowUp) : null,
        followUpResult: req.body.followUpResult,
        picName: req.body.picName,
      }
    });
    res.status(201).json({ success: true, data: customer });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create customer data' });
  }
};

export const updateCustomerData = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const customer = await prisma.cRMCustomerData.update({
      where: { id: String(id) },
      data: {
        customerName: req.body.customerName,
        phone: req.body.phone,
        branchId: req.body.branchId,
        purchaseDate: req.body.purchaseDate ? new Date(req.body.purchaseDate) : undefined,
        purchaseDetails: req.body.purchaseDetails,
        purchaseQty: req.body.purchaseQty ? Number(req.body.purchaseQty) : undefined,
        purchaseAmount: req.body.purchaseAmount ? Number(req.body.purchaseAmount) : undefined,
        isActive: req.body.isActive === true || req.body.isActive === 'true',
        lastFollowUp: req.body.lastFollowUp ? new Date(req.body.lastFollowUp) : null,
        followUpResult: req.body.followUpResult,
      }
    });
    res.json({ success: true, data: customer });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update customer data' });
  }
};

export const importCustomerData = async (req: Request, res: Response) => {
  try {
    const { customers } = req.body;
    if (!customers || !Array.isArray(customers) || customers.length === 0) {
      return res.status(400).json({ success: false, error: 'Format data tidak valid atau data kosong' });
    }

    const branches = await prisma.branch.findMany({ select: { id: true, name: true } });
    const defaultBranchId = branches.length > 0 ? branches[0].id : null;

    if (!defaultBranchId) {
      return res.status(400).json({ success: false, error: 'Belum ada data cabang di database. Silakan buat cabang dahulu.' });
    }

    const dataToInsert = customers.map((c: any) => {
      let targetBranchId = defaultBranchId;
      if (c.branchId) {
        const found = branches.find(b => b.id === c.branchId || b.name.toLowerCase().includes(String(c.branchId).toLowerCase()));
        if (found) targetBranchId = found.id;
      }

      let pDate = new Date();
      if (c.purchaseDate) {
        const parsed = new Date(c.purchaseDate);
        if (!isNaN(parsed.getTime())) {
          pDate = parsed;
        }
      }

      let fDate = null;
      if (c.lastFollowUp) {
        const parsedF = new Date(c.lastFollowUp);
        if (!isNaN(parsedF.getTime())) {
          fDate = parsedF;
        }
      }

      return {
        customerName: String(c.customerName || c.name || 'Tanpa Nama').trim(),
        phone: String(c.phone || '-').trim(),
        branchId: targetBranchId,
        purchaseDate: pDate,
        purchaseDetails: String(c.purchaseDetails || 'Import Data').trim(),
        purchaseQty: Math.max(1, Number(c.purchaseQty) || 1),
        purchaseAmount: Math.max(0, Number(c.purchaseAmount) || 0),
        isActive: c.isActive === true || c.isActive === 'true' || String(c.isActive).toLowerCase().includes('aktif'),
        lastFollowUp: fDate,
        followUpResult: c.followUpResult ? String(c.followUpResult) : null,
        picName: c.picName ? String(c.picName) : 'CRM Staff',
      };
    });

    const created = await prisma.cRMCustomerData.createMany({
      data: dataToInsert
    });

    res.status(201).json({ success: true, count: created.count });
  } catch (error: any) {
    console.error('[CRM IMPORT ERROR]', error);
    res.status(500).json({ success: false, error: error.message || 'Gagal mengimport data pelanggan' });
  }
};

// ─── LEADERBOARD ───
export const getLeaderboard = async (req: Request, res: Response) => {
  try {
    const { start, end, branchFilter } = getDateFilters(req);
    const dateQuery = (start && end) ? { purchaseDate: { gte: start, lte: end } } : {};

    // Find phones that bought during the requested period (or all if start/end undefined)
    const customersInPeriod = await prisma.cRMCustomerData.findMany({
      where: { ...dateQuery, ...branchFilter },
      select: { phone: true }
    });
    const phonesInPeriod = Array.from(new Set(customersInPeriod.map(c => c.phone)));

    const yearlyData = await prisma.cRMCustomerData.groupBy({
      by: ['phone'],
      where: { 
        ...(phonesInPeriod.length > 0 ? { phone: { in: phonesInPeriod } } : {}),
        ...branchFilter 
      },
      _sum: { purchaseQty: true, purchaseAmount: true },
      _max: { customerName: true, lastFollowUp: true },
    });

    const enriched = yearlyData.map(d => {
      const totalQty = d._sum.purchaseQty || 0;
      const totalAmount = d._sum.purchaseAmount || 0;

      let badge = 'Reguler';
      if (totalAmount > 75000000) badge = 'Platinum';
      else if (totalAmount >= 35000000) badge = 'Gold';
      else if (totalAmount >= 15000000) badge = 'Silver';
      else if (totalAmount >= 1000000) badge = 'Bronze';
      else if (totalQty > 1) badge = 'Loyal';

      return {
        phone: d.phone,
        customerName: d._max.customerName || 'Tanpa Nama',
        lastFollowUp: d._max.lastFollowUp,
        yearlyQty: totalQty,
        yearlyAmount: totalAmount,
        loyaltyBadge: badge
      };
    });

    const topSpenders = [...enriched].sort((a, b) => b.yearlyAmount - a.yearlyAmount);
    const topLoyal = [...enriched].sort((a, b) => b.yearlyQty - a.yearlyQty);
    
    const badgeOwnersCount = enriched.filter(e => e.loyaltyBadge !== 'Reguler').length;
    const loyalCount = enriched.filter(e => e.loyaltyBadge !== 'Reguler').length;

    res.json({
      success: true,
      data: {
        topSpenders,
        topLoyal,
        badgeOwnersCount,
        loyalCount
      }
    });
  } catch (error: any) {
    console.error('[LEADERBOARD ERROR]', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch leaderboard' });
  }
};

// ─── MYSTERY GUEST ───

export const getMysteryGuests = async (req: Request, res: Response) => {
  try {
    const { start, end } = getDateFilters(req);
    const guests = await prisma.cRMMysteryGuest.findMany({
      where: { date: { gte: start, lte: end } },
      include: { branch: { select: { name: true } } },
      orderBy: { date: 'desc' }
    });
    res.json({ success: true, data: guests });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch mystery guests' });
  }
};

export const createMysteryGuest = async (req: Request, res: Response) => {
  try {
    const guest = await prisma.cRMMysteryGuest.create({
      data: {
        branchId: req.body.branchId,
        score: Number(req.body.score),
        notes: req.body.notes,
        date: new Date(req.body.date),
        picName: req.body.picName,
      }
    });
    res.status(201).json({ success: true, data: guest });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create mystery guest record' });
  }
};
