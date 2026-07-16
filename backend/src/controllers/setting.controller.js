"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSettings = exports.getSettings = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const getSettings = async (req, res) => {
    try {
        const settings = await prisma_1.default.systemSetting.findMany();
        // Convert array of {key, value} to a dictionary
        const settingsDict = settings.reduce((acc, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {});
        res.json({ success: true, data: settingsDict });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Failed to fetch settings' });
    }
};
exports.getSettings = getSettings;
const updateSettings = async (req, res) => {
    try {
        const settingsObj = req.body; // Expecting { "STORE_NAME": "Zabran", "RECEIPT_FOOTER": "Thanks!" }
        const upsertPromises = Object.keys(settingsObj).map(key => {
            return prisma_1.default.systemSetting.upsert({
                where: { key },
                update: { value: String(settingsObj[key]) },
                create: { key, value: String(settingsObj[key]) }
            });
        });
        await Promise.all(upsertPromises);
        res.json({ success: true, message: 'Settings updated successfully' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Failed to update settings' });
    }
};
exports.updateSettings = updateSettings;
//# sourceMappingURL=setting.controller.js.map