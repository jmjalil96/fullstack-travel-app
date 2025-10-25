import { env } from '../../../config/env.js'

import { issueVouchers as issueVouchersMock } from './issue.mock.js'
import { issueVouchers as issueVouchersReal } from './issue.service.js'

/**
 * Issue Vouchers service - automatically switches between real and mock based on env
 *
 * NOTE: This is an internal service used by /policies/issue endpoint
 * It is NOT exposed as a direct HTTP endpoint
 */
export const issueVouchers = env.ASSISTCARD_USE_MOCK ? issueVouchersMock : issueVouchersReal

// Re-export types and schemas for internal use
export * from './issue.errors.js'
export * from './issue.schema.js'
export type { IssueVouchersRequest, IssueVouchersResponseData } from './issue.schema.js'
