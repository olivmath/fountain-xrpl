"""Data models for Fountain SDK"""

from dataclasses import dataclass
from typing import Optional, List, Literal


@dataclass
class LoginResponse:
    """Response from login endpoint"""
    jwt: str
    expires: str
    email: str
    company_id: str
    company_name: str
    is_admin: bool


@dataclass
class DepositHistory:
    """Deposit history entry"""
    amount: float
    tx_hash: str
    timestamp: str


@dataclass
class OperationDetails:
    """Details about a stablecoin operation"""
    id: str
    stablecoin_id: str
    type: Literal['MINT', 'BURN']
    status: str
    amount_rlusd: Optional[float] = None
    amount_brl: Optional[float] = None
    temp_wallet_address: Optional[str] = None
    amount_deposited: Optional[float] = None
    deposit_count: Optional[int] = None
    deposit_history: Optional[List[DepositHistory]] = None
    created_at: Optional[str] = None


@dataclass
class TempWalletStatus:
    """Status of a temporary wallet"""
    operation_id: str
    temp_wallet_address: str
    current_balance_xrp: str
    deposit_progress_percent: str
    amount_required_rlusd: float
    amount_deposited_rlusd: float
    deposit_count: int
    deposit_history: List[DepositHistory]
    status: str
    error: Optional[str] = None


@dataclass
class AdminStatistics:
    """Admin statistics response"""
    total_companies: int
    total_stablecoins: int
    total_operations: int
    completed_operations: int
    pending_operations: int


@dataclass
class Company:
    """Company details"""
    id: str
    name: str
    wallet_address: str
    created_at: str


@dataclass
class Stablecoin:
    """Stablecoin details"""
    id: str
    company_id: str
    currency_code: str
    issuer_address: str
    total_supply: float
    created_at: str


@dataclass
class TempWallet:
    """Temporary wallet details"""
    operation_id: str
    address: str
    balance: str
    status: str
    created_at: str
