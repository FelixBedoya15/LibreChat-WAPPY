const CompanyInfo = require('~/models/CompanyInfo');

/**
 * Resolves the effective target user ID and company ID for SGSST operations.
 * If the authenticated user is a sub-user, returns the parent user ID and assigned company ID.
 * Otherwise returns the user's own ID and active company ID.
 * 
 * @param {Object} req Express request with authenticated req.user
 * @returns {Promise<{targetUserId: string, companyId: Object|null, isSubUser: boolean, workerDoc: string|null, permissions: string[]}>}
 */
async function getRequestContext(req) {
    const isSub = !!req.user?.isSubUser;
    const targetUserId = (isSub && req.user?.parentUser) ? req.user.parentUser : req.user?.id;
    
    let companyId = null;
    if (isSub && req.user?.assignedCompany) {
        companyId = req.user.assignedCompany;
    } else {
        const activeCompany = await CompanyInfo.findOne({ user: targetUserId, isActive: true }).lean()
            || await CompanyInfo.findOne({ user: targetUserId }).lean();
        companyId = activeCompany ? activeCompany._id : null;
    }

    return {
        targetUserId,
        companyId,
        isSubUser: isSub,
        workerDoc: req.user?.workerDocument || null,
        permissions: req.user?.subUserPermissions || []
    };
}

module.exports = {
    getRequestContext
};
