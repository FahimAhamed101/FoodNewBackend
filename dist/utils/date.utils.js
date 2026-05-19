"use strict";
// Basic date range utility for dashboard filters
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDateRange = void 0;
const getDateRange = (filter, startDate, endDate) => {
    const now = new Date();
    let start = new Date();
    let end = new Date();
    switch (filter) {
        case 'today':
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
            break;
        case 'week':
            // Start of current week (Sunday)
            const day = now.getDay();
            start.setDate(now.getDate() - day);
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
            break;
        case 'month':
            start.setFullYear(now.getFullYear(), now.getMonth(), 1);
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
            break;
        case 'year':
            start.setFullYear(now.getFullYear(), 0, 1);
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
            break;
        case 'custom':
            if (startDate && endDate) {
                start = new Date(startDate);
                end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
            }
            break;
    }
    return { startDate: start, endDate: end };
};
exports.getDateRange = getDateRange;
