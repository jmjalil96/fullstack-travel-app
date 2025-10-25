import { Request, Response } from 'express'

import { UnauthorizedError } from '../../shared/errors/errors.js'
import { logger } from '../../shared/middleware/logger.js'

import type { IssuePolicyRequest } from './policies.schema.js'
import { issuePolicy } from './policies.service.js'

/**
 * POST /api/policies/issue
 * Issue insurance policy via Assistcard and save to database (atomic)
 */
export async function postIssuePolicy(req: Request, res: Response): Promise<void> {
  // Ensure user is authenticated (redundant check for type safety)
  if (!req.user) {
    throw new UnauthorizedError('User not authenticated')
  }

  logger.info(
    {
      userId: req.user.id,
      passengersCount: req.body.passengers?.length,
      paymentAmount: req.body.paymentDetails?.amount,
    },
    'User issuing policy'
  )

  const params = req.body as Omit<IssuePolicyRequest, 'countryCode' | 'agencyCode' | 'branchCode'>
  const result = await issuePolicy(params, req.user.id)

  res.json({
    success: true,
    data: result,
  })
}
