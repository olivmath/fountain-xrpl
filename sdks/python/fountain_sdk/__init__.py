"""
Fountain SDK - Python client for Fountain stablecoin API

Official SDK for interacting with the Fountain stablecoin issuance and management service.
"""

__version__ = "1.0.0"

from .client import FountainSDK
from .models import (
    LoginResponse,
    OperationDetails,
    TempWalletStatus,
    AdminStatistics,
    Company,
    Stablecoin,
    TempWallet,
    DepositHistory,
)
from .exceptions import (
    FountainSDKError,
    AuthenticationError,
    APIError,
    ValidationError,
)

__all__ = [
    'FountainSDK',
    'LoginResponse',
    'OperationDetails',
    'TempWalletStatus',
    'AdminStatistics',
    'Company',
    'Stablecoin',
    'TempWallet',
    'DepositHistory',
    'FountainSDKError',
    'AuthenticationError',
    'APIError',
    'ValidationError',
]
