import jwt from 'jsonwebtoken';
export const generateAccessToken = (user) => {
    return jwt.sign(
        {
            id: user.id,
            email: user.email,
            role: user.role,
            companyId: user.companyId,
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
};
export const generateRefreshToken = (user) => {
    return jwt.sign(
        {
            id: user.id,
            email: user.email,
            role: user.role,
            companyId: user.companyId,
        },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d' }
    );
};
export const verifyAccessToken = (token) => {
    return jwt.verify(token, process.env.JWT_SECRET);
};
export const verifyRefreshToken = (token) => {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
};