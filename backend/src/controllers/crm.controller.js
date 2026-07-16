"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMysteryGuest = exports.getMysteryGuests = exports.getLeaderboard = exports.importCustomerData = exports.updateCustomerData = exports.createCustomerData = exports.getCustomerData = exports.createDailyReview = exports.getDailyReviews = exports.createActivity = exports.getActivities = exports.getCRMMetrics = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const getDateFilters = (req) => {
    const { month, year, startDate, endDate, branchId } = req.query;
    let start;
    let end;
    let prevStart;
    let prevEnd;
    if (startDate && endDate) {
        start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        prevStart = new Date(start.getTime() - diffTime - (24 * 60 * 60 * 1000));
        prevEnd = new Date(start.getTime() - (24 * 60 * 60 * 1000));
    }
    else if (year && !month) {
        // Only year provided
        const y = Number(year);
        start = new Date(y, 0, 1);
        end = new Date(y, 11, 31, 23, 59, 59);
        prevStart = new Date(y - 1, 0, 1);
        prevEnd = new Date(y - 1, 11, 31, 23, 59, 59);
    }
    else {
        // Month and year (or default to current month/year)
        const m = Number(month) || new Date().getMonth() + 1;
        const y = Number(year) || new Date().getFullYear();
        start = new Date(y, m - 1, 1);
        end = new Date(y, m, 0, 23, 59, 59);
        let prevM = m - 1;
        let prevY = y;
        if (prevM === 0) {
            prevM = 12;
            prevY = y - 1;
        }
        prevStart = new Date(prevY, prevM - 1, 1);
        prevEnd = new Date(prevY, prevM, 0, 23, 59, 59);
    }
    const branchFilter = branchId ? { branchId: branchId } : {};
    return { start, end, prevStart, prevEnd, branchFilter };
};
const getCRMMetrics = async (req, res) => {
    try {
        const { start, end, prevStart, prevEnd, branchFilter } = getDateFilters(req);
        const [dailyReviews, prevDailyReviews, guests, prevGuests, activities, prevActivities, customers, prevCustomers, allCustomerPhones, totalActiveCustomers, totalInactiveCustomers, activitiesWithResponse] = await Promise.all([
            prisma_1.default.cRMDailyReview.findMany({ where: { date: { gte: start, lte: end }, ...branchFilter } }),
            prisma_1.default.cRMDailyReview.findMany({ where: { date: { gte: prevStart, lte: prevEnd }, ...branchFilter } }),
            prisma_1.default.cRMMysteryGuest.findMany({ where: { date: { gte: start, lte: end }, ...branchFilter } }),
            prisma_1.default.cRMMysteryGuest.findMany({ where: { date: { gte: prevStart, lte: prevEnd }, ...branchFilter } }),
            prisma_1.default.cRMActivity.count({ where: { date: { gte: start, lte: end } } }), // Activities are not branch-bound in schema yet
            prisma_1.default.cRMActivity.count({ where: { date: { gte: prevStart, lte: prevEnd } } }),
            prisma_1.default.cRMCustomerData.findMany({ where: { purchaseDate: { gte: start, lte: end }, ...branchFilter } }),
            prisma_1.default.cRMCustomerData.findMany({ where: { purchaseDate: { gte: prevStart, lte: prevEnd }, ...branchFilter } }),
            prisma_1.default.cRMCustomerData.groupBy({ by: ['phone'], _count: { _all: true } }), // to check repeat overall
            prisma_1.default.cRMCustomerData.groupBy({ by: ['phone'], where: { isActive: true, ...branchFilter } }),
            prisma_1.default.cRMCustomerData.groupBy({ by: ['phone'], where: { isActive: false, ...branchFilter } }),
            prisma_1.default.cRMActivity.findMany({ where: { date: { gte: start, lte: end }, responseTime: { not: null } } })
        ]);
        const calculateAvgRating = (reviews) => {
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
        // Mystery Guest Score
        const avgMysteryGuest = guests.length > 0 ? guests.reduce((acc, g) => acc + g.score, 0) / guests.length : 0;
        const prevAvgMysteryGuest = prevGuests.length > 0 ? prevGuests.reduce((acc, g) => acc + g.score, 0) / prevGuests.length : 0;
        const mysteryGuestTrend = prevAvgMysteryGuest === 0 ? (avgMysteryGuest > 0 ? 100 : 0) : ((avgMysteryGuest - prevAvgMysteryGuest) / prevAvgMysteryGuest) * 100;
        // Total Activities
        const activitiesTrend = prevActivities === 0 ? (activities > 0 ? 100 : 0) : ((activities - prevActivities) / prevActivities) * 100;
        // Calculate Response Time
        const avgResponseTime = activitiesWithResponse.length > 0
            ? activitiesWithResponse.reduce((sum, r) => sum + r.responseTime, 0) / activitiesWithResponse.length
            : 0;
        const totalCustomers = new Set(customers.map(c => c.phone)).size;
        const prevTotalCustomers = new Set(prevCustomers.map(c => c.phone)).size;
        const customersTrend = prevTotalCustomers === 0 ? (totalCustomers > 0 ? 100 : 0) : ((totalCustomers - prevTotalCustomers) / prevTotalCustomers) * 100;
        const activeCustomers = new Set(customers.filter(c => c.isActive).map(c => c.phone)).size;
        const inactiveCustomers = new Set(customers.filter(c => !c.isActive).map(c => c.phone)).size;
        const activePercentage = totalActiveCustomers.length > 0 ? (totalActiveCustomers.length / (totalActiveCustomers.length + totalInactiveCustomers.length)) * 100 : 0;
        const inactivePercentage = totalInactiveCustomers.length > 0 ? (totalInactiveCustomers.length / (totalActiveCustomers.length + totalInactiveCustomers.length)) * 100 : 0;
        // Repeat Order Logic
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
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch CRM metrics' });
    }
};
exports.getCRMMetrics = getCRMMetrics;
const getActivities = async (req, res) => {
    try {
        const { start, end } = getDateFilters(req);
        const activities = await prisma_1.default.cRMActivity.findMany({
            where: { date: { gte: start, lte: end } },
            orderBy: { date: 'desc' }
        });
        res.json({ success: true, data: activities });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch activities' });
    }
};
exports.getActivities = getActivities;
const createActivity = async (req, res) => {
    try {
        const activity = await prisma_1.default.cRMActivity.create({
            data: {
                type: req.body.type,
                description: req.body.description,
                date: new Date(req.body.date),
                responseTime: req.body.responseTime ? Number(req.body.responseTime) : null,
                picName: req.body.picName,
            }
        });
        res.status(201).json({ success: true, data: activity });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Failed to create activity' });
    }
};
exports.createActivity = createActivity;
// ─── DAILY REVIEWS ───
const getDailyReviews = async (req, res) => {
    try {
        const { start, end } = getDateFilters(req);
        const reviews = await prisma_1.default.cRMDailyReview.findMany({
            where: { date: { gte: start, lte: end } },
            include: { branch: { select: { name: true } } },
            orderBy: { date: 'desc' }
        });
        res.json({ success: true, data: reviews });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch daily reviews' });
    }
};
exports.getDailyReviews = getDailyReviews;
const createDailyReview = async (req, res) => {
    try {
        const review = await prisma_1.default.cRMDailyReview.create({
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
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Failed to create daily review' });
    }
};
exports.createDailyReview = createDailyReview;
// ─── CUSTOMER DATA ───
const getCustomerData = async (req, res) => {
    try {
        const { start, end, branchFilter } = getDateFilters(req);
        const dateFilter = { purchaseDate: { gte: start, lte: end } };
        const customers = await prisma_1.default.cRMCustomerData.findMany({
            where: { ...branchFilter, ...dateFilter },
            include: { branch: { select: { name: true } } },
            orderBy: { purchaseDate: 'desc' }
        });
        // Calculate loyalty logic for all customers
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        const yearlyData = await prisma_1.default.cRMCustomerData.groupBy({
            by: ['phone'],
            where: { purchaseDate: { gte: oneYearAgo } },
            _sum: { purchaseQty: true, purchaseAmount: true }
        });
        const loyaltyMap = new Map();
        yearlyData.forEach(d => loyaltyMap.set(d.phone, d._sum));
        const enrichedCustomers = customers.map(c => {
            const stats = loyaltyMap.get(c.phone) || { purchaseQty: 0, purchaseAmount: 0 };
            const totalQty = stats.purchaseQty || 0;
            const totalAmount = stats.purchaseAmount || 0;
            let badge = 'Reguler';
            if (totalAmount > 75000000)
                badge = 'Platinum';
            else if (totalAmount >= 35000000)
                badge = 'Gold';
            else if (totalAmount >= 15000000)
                badge = 'Silver';
            else if (totalAmount >= 1000000)
                badge = 'Bronze';
            else if (totalQty > 4)
                badge = 'Loyal';
            return {
                ...c,
                yearlyQty: totalQty,
                yearlyAmount: totalAmount,
                loyaltyBadge: badge
            };
        });
        res.json({ success: true, data: enrichedCustomers });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch customer data' });
    }
};
exports.getCustomerData = getCustomerData;
const createCustomerData = async (req, res) => {
    try {
        const customer = await prisma_1.default.cRMCustomerData.create({
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
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Failed to create customer data' });
    }
};
exports.createCustomerData = createCustomerData;
const updateCustomerData = async (req, res) => {
    try {
        const { id } = req.params;
        const customer = await prisma_1.default.cRMCustomerData.update({
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
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Failed to update customer data' });
    }
};
exports.updateCustomerData = updateCustomerData;
const importCustomerData = async (req, res) => {
    try {
        const { customers } = req.body;
        if (!customers || !Array.isArray(customers)) {
            return res.status(400).json({ success: false, error: 'Invalid data format' });
        }
        const created = await prisma_1.default.cRMCustomerData.createMany({
            data: customers.map((c) => ({
                customerName: c.customerName,
                phone: c.phone,
                branchId: c.branchId,
                purchaseDate: new Date(c.purchaseDate),
                purchaseDetails: c.purchaseDetails,
                purchaseQty: Number(c.purchaseQty) || 1,
                purchaseAmount: Number(c.purchaseAmount) || 0,
                isActive: c.isActive === true || c.isActive === 'true',
                lastFollowUp: c.lastFollowUp ? new Date(c.lastFollowUp) : null,
                followUpResult: c.followUpResult,
                picName: c.picName || 'CRM Staff',
            }))
        });
        res.status(201).json({ success: true, count: created.count });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Failed to import customer data' });
    }
};
exports.importCustomerData = importCustomerData;
// ─── LEADERBOARD ───
const getLeaderboard = async (req, res) => {
    try {
        const { start, end, branchFilter } = getDateFilters(req);
        // Find phones that bought during the requested period
        const customersInPeriod = await prisma_1.default.cRMCustomerData.findMany({
            where: { purchaseDate: { gte: start, lte: end }, ...branchFilter },
            select: { phone: true }
        });
        const phonesInPeriod = Array.from(new Set(customersInPeriod.map(c => c.phone)));
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        // Group by phone for the past year to calculate actual loyalty badge, but only for phones active in this period
        const yearlyData = await prisma_1.default.cRMCustomerData.groupBy({
            by: ['phone'],
            where: {
                purchaseDate: { gte: oneYearAgo },
                phone: { in: phonesInPeriod },
                ...branchFilter
            },
            _sum: { purchaseQty: true, purchaseAmount: true },
            _max: { customerName: true, lastFollowUp: true },
        });
        const enriched = yearlyData.map(d => {
            const totalQty = d._sum.purchaseQty || 0;
            const totalAmount = d._sum.purchaseAmount || 0;
            let badge = 'Reguler';
            if (totalAmount > 75000000)
                badge = 'Platinum';
            else if (totalAmount >= 35000000)
                badge = 'Gold';
            else if (totalAmount >= 15000000)
                badge = 'Silver';
            else if (totalAmount >= 1000000)
                badge = 'Bronze';
            else if (totalQty > 4)
                badge = 'Loyal';
            return {
                phone: d.phone,
                customerName: d._max.customerName,
                lastFollowUp: d._max.lastFollowUp,
                yearlyQty: totalQty,
                yearlyAmount: totalAmount,
                loyaltyBadge: badge
            };
        });
        // Filter out reguler for leaderboard? Actually, just return all and sort on frontend, or sort here.
        // Let's sort and return top arrays directly.
        const topSpenders = [...enriched].sort((a, b) => b.yearlyAmount - a.yearlyAmount);
        const topLoyal = [...enriched].sort((a, b) => b.yearlyQty - a.yearlyQty);
        const badgeOwnersCount = enriched.filter(e => e.loyaltyBadge !== 'Reguler' && e.loyaltyBadge !== 'Loyal').length;
        const loyalCount = enriched.filter(e => e.loyaltyBadge === 'Loyal').length;
        res.json({
            success: true,
            data: {
                topSpenders,
                topLoyal,
                badgeOwnersCount,
                loyalCount
            }
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch leaderboard' });
    }
};
exports.getLeaderboard = getLeaderboard;
// ─── MYSTERY GUEST ───
const getMysteryGuests = async (req, res) => {
    try {
        const { start, end } = getDateFilters(req);
        const guests = await prisma_1.default.cRMMysteryGuest.findMany({
            where: { date: { gte: start, lte: end } },
            include: { branch: { select: { name: true } } },
            orderBy: { date: 'desc' }
        });
        res.json({ success: true, data: guests });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch mystery guests' });
    }
};
exports.getMysteryGuests = getMysteryGuests;
const createMysteryGuest = async (req, res) => {
    try {
        const guest = await prisma_1.default.cRMMysteryGuest.create({
            data: {
                branchId: req.body.branchId,
                score: Number(req.body.score),
                notes: req.body.notes,
                date: new Date(req.body.date),
                picName: req.body.picName,
            }
        });
        res.status(201).json({ success: true, data: guest });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Failed to create mystery guest record' });
    }
};
exports.createMysteryGuest = createMysteryGuest;
//# sourceMappingURL=crm.controller.js.map