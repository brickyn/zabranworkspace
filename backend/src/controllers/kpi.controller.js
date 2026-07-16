"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setKPI = exports.getKPI = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const getKPI = async (req, res) => {
    try {
        const { division, month, year } = req.query;
        if (!division || !month || !year) {
            return res.status(400).json({ error: 'Missing parameters: division, month, year' });
        }
        const kpi = await prisma_1.default.divisionKPI.findUnique({
            where: {
                division_month_year: {
                    division: String(division),
                    month: Number(month),
                    year: Number(year)
                }
            }
        });
        res.json({ data: kpi || null });
    }
    catch (error) {
        console.error('Error fetching KPI:', error);
        res.status(500).json({ error: 'Failed to fetch KPI' });
    }
};
exports.getKPI = getKPI;
const setKPI = async (req, res) => {
    try {
        const { division, month, year, targetValue, targetType, notes } = req.body;
        if (!division || !month || !year || targetValue === undefined || !targetType) {
            return res.status(400).json({ error: 'Missing required fields: division, month, year, targetValue, targetType' });
        }
        const kpi = await prisma_1.default.divisionKPI.upsert({
            where: {
                division_month_year: {
                    division: String(division),
                    month: Number(month),
                    year: Number(year)
                }
            },
            update: {
                targetValue: Number(targetValue),
                targetType: String(targetType),
                notes: notes ? String(notes) : null
            },
            create: {
                division: String(division),
                month: Number(month),
                year: Number(year),
                targetValue: Number(targetValue),
                targetType: String(targetType),
                notes: notes ? String(notes) : null
            }
        });
        res.json({ message: 'KPI updated successfully', data: kpi });
    }
    catch (error) {
        console.error('Error setting KPI:', error);
        res.status(500).json({ error: 'Failed to set KPI' });
    }
};
exports.setKPI = setKPI;
//# sourceMappingURL=kpi.controller.js.map