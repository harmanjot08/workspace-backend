export const ROLES = {
    ADMIN: 'admin',
    MANAGER: 'manager',
    USER: 'user',
};

export const USER_STATUS = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
};

export const PLANS = {
    FREE: 'free',
    PRO: 'pro',
    ENTERPRISE: 'enterprise',
};

export const PLAN_PRICES = {
    free: 0,
    pro: 99,
    enterprise: 299,
};

export const SUBSCRIPTION_STATUS = {
    ACTIVE: 'active',
    EXPIRED: 'expired',
    PENDING: 'pending',
    CANCELLED: 'cancelled',
};

export const CHAT_TYPES = {
    DM: 'dm',
    GROUP: 'group',
};

export const EVENT_TYPES = {
    EVENT: 'event',
    MEETING: 'meeting',
    TASK: 'task',
};

export const TASK_PRIORITIES = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
};

export const TASK_STATUS = {
    PENDING: 'pending',
    IN_PROGRESS: 'in-progress',
    DONE: 'done',
};

export const RSVP_STATUS = {
    PENDING: 'pending',
    ACCEPTED: 'accepted',
    DECLINED: 'declined',
};

export const ACTIVITY_ACTIONS = {
    USER_CREATED: 'user_created',
    USER_UPDATED: 'user_updated',
    USER_DELETED: 'user_deleted',
    PLAN_UPDATED: 'plan_updated',
    COMPANY_DELETED: 'company_deleted',
    CHAT_CREATED: 'chat_created',
    MESSAGE_SENT: 'message_sent',
};

export const TOKENS = {
    ACCESS_TOKEN_EXPIRE: '7d',
    REFRESH_TOKEN_EXPIRE: '30d',
    PASSWORD_RESET_EXPIRE: '1h',
    INVITE_TOKEN_EXPIRE: '7d',
};