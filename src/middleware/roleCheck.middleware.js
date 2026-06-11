import { ForbiddenError } from '../utils/errorHandler.js';
export const roleCheck = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Forbidden - Insufficient permissions' });
        }
        next();
    };
};
export const companyCheck = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    const companyId = req.params.companyId || req.body.companyId;
    if (companyId && req.user.companyId !== companyId && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden - Company mismatch' });
    }
    next();
};