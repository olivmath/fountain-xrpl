export const OperationStatus = {
  PENDING: 'pending',
  REQUIRE_DEPOSIT: 'require_deposit',
  WAITING_PAYMENT: 'waiting_payment',
  PARTIAL_DEPOSIT: 'partial_deposit',
  DEPOSIT_CONFIRMED: 'deposit_confirmed',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
} as const;

export const StablecoinStatus = {
  PENDING_SETUP: 'pending_setup',
  REQUIRE_DEPOSIT: 'require_deposit',
  WAITING_PAYMENT: 'waiting_payment',
  ACTIVE: 'active',
  INACTIVE: 'inactive',
} as const;

export type OperationStatusValue = typeof OperationStatus[keyof typeof OperationStatus];
export type StablecoinStatusValue = typeof StablecoinStatus[keyof typeof StablecoinStatus];