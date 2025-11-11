"""Main Fountain SDK client"""

import requests
from typing import Optional, Dict, Any, List
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
from .exceptions import AuthenticationError, APIError, ValidationError


class FountainSDK:
    """Official Python SDK for Fountain stablecoin API"""

    def __init__(self, base_url: str):
        """
        Initialize Fountain SDK client

        Args:
            base_url: Base URL of Fountain API (e.g., 'http://localhost:3000')
        """
        self.base_url = base_url.rstrip('/')
        self.token: Optional[str] = None
        self.session = requests.Session()
        self._setup_session()

    def _setup_session(self) -> None:
        """Setup requests session with default headers"""
        self.session.headers.update({
            'Content-Type': 'application/json',
            'User-Agent': 'fountain-sdk/1.0.0',
        })

    def _get_headers(self) -> Dict[str, str]:
        """Get request headers with auth token if available"""
        headers = {}
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'
        return headers

    def _request(
        self,
        method: str,
        endpoint: str,
        data: Optional[Dict[str, Any]] = None,
        params: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Make HTTP request to API

        Args:
            method: HTTP method (GET, POST, PUT, DELETE)
            endpoint: API endpoint path
            data: Request body data
            params: Query parameters

        Returns:
            Response JSON data

        Raises:
            APIError: If request fails
            ValidationError: If response validation fails
        """
        url = f"{self.base_url}/api/v1{endpoint}"
        headers = self._get_headers()

        try:
            response = self.session.request(
                method=method,
                url=url,
                json=data,
                params=params,
                headers=headers,
                timeout=30,
            )

            if response.status_code >= 400:
                try:
                    error_data = response.json()
                    error_message = error_data.get('message', 'API request failed')
                except:
                    error_message = f"API request failed with status {response.status_code}"

                raise APIError(
                    message=error_message,
                    status_code=response.status_code,
                    response_data=error_data if 'error_data' in locals() else None,
                )

            return response.json()

        except requests.exceptions.RequestException as e:
            raise APIError(f"Network error: {str(e)}")

    # ==================== Authentication Methods ====================

    def login(self, email: str) -> LoginResponse:
        """
        Login with email

        Args:
            email: User email address

        Returns:
            LoginResponse with JWT token

        Raises:
            ValidationError: If email is invalid
            AuthenticationError: If login fails
        """
        if not email or '@' not in email:
            raise ValidationError("Invalid email address")

        try:
            response = self._request('POST', '/auth/login', {'email': email})
            return LoginResponse(
                jwt=response['jwt'],
                expires=response['expires'],
                email=response['email'],
                company_id=response['company_id'],
                company_name=response['company_name'],
                is_admin=response.get('is_admin', False),
            )
        except APIError as e:
            raise AuthenticationError(str(e))

    def set_token(self, token: str) -> None:
        """
        Set JWT token for authentication

        Args:
            token: JWT token string
        """
        if not token:
            raise ValidationError("Token cannot be empty")
        self.token = token

    def get_token(self) -> Optional[str]:
        """
        Get current JWT token

        Returns:
            Current token or None
        """
        return self.token

    def logout(self) -> None:
        """Logout and clear token"""
        self.token = None

    def is_authenticated(self) -> bool:
        """
        Check if client is authenticated

        Returns:
            True if token is set, False otherwise
        """
        return self.token is not None

    # ==================== Stablecoin Operations ====================

    def create_stablecoin(
        self,
        currency_code: str,
        amount_brl: float,
        deposit_type: str = 'XRP',
        company_wallet: Optional[str] = None,
        webhook_url: Optional[str] = None,
    ) -> OperationDetails:
        """
        Create and mint a new stablecoin

        Args:
            currency_code: Unique code for stablecoin (e.g., 'APBRL')
            amount_brl: Amount in BRL to mint
            deposit_type: Deposit method ('XRP', 'RLUSD', 'PIX')
            company_wallet: Company wallet address to receive tokens
            webhook_url: URL for operation notifications

        Returns:
            OperationDetails

        Raises:
            ValidationError: If input validation fails
            APIError: If operation fails
        """
        if not currency_code or len(currency_code) > 20:
            raise ValidationError("Invalid currency code")
        if amount_brl <= 0:
            raise ValidationError("Amount must be positive")

        data = {
            'currency_code': currency_code,
            'amount_brl': amount_brl,
            'deposit_type': deposit_type,
        }
        if company_wallet:
            data['company_wallet'] = company_wallet
        if webhook_url:
            data['webhook_url'] = webhook_url

        response = self._request('POST', '/stablecoin', data)
        return self._parse_operation_details(response)

    def mint_more(
        self,
        stablecoin_id: str,
        amount_brl: float,
        deposit_type: str = 'XRP',
        webhook_url: Optional[str] = None,
    ) -> OperationDetails:
        """
        Mint additional tokens for existing stablecoin

        Args:
            stablecoin_id: ID of existing stablecoin
            amount_brl: Amount in BRL to mint
            deposit_type: Deposit method ('XRP', 'RLUSD', 'PIX')
            webhook_url: URL for operation notifications

        Returns:
            OperationDetails
        """
        if not stablecoin_id:
            raise ValidationError("Stablecoin ID is required")
        if amount_brl <= 0:
            raise ValidationError("Amount must be positive")

        data = {
            'amount_brl': amount_brl,
            'deposit_type': deposit_type,
        }
        if webhook_url:
            data['webhook_url'] = webhook_url

        response = self._request('POST', f'/stablecoin/{stablecoin_id}/mint', data)
        return self._parse_operation_details(response)

    def burn_stablecoin(
        self,
        stablecoin_id: str,
        amount_tokens: float,
        return_asset: str = 'XRP',
    ) -> OperationDetails:
        """
        Burn (redeem) stablecoin tokens

        Args:
            stablecoin_id: ID of stablecoin to burn
            amount_tokens: Number of tokens to burn
            return_asset: Asset to return ('XRP', 'RLUSD', 'PIX')

        Returns:
            OperationDetails
        """
        if not stablecoin_id:
            raise ValidationError("Stablecoin ID is required")
        if amount_tokens <= 0:
            raise ValidationError("Amount must be positive")

        data = {
            'amount_tokens': amount_tokens,
            'return_asset': return_asset,
        }

        response = self._request('POST', f'/stablecoin/{stablecoin_id}/burn', data)
        return self._parse_operation_details(response)

    def get_stablecoin(self, stablecoin_id: str) -> Dict[str, Any]:
        """
        Get stablecoin details

        Args:
            stablecoin_id: ID of stablecoin

        Returns:
            Stablecoin details
        """
        if not stablecoin_id:
            raise ValidationError("Stablecoin ID is required")

        return self._request('GET', f'/stablecoin/{stablecoin_id}')

    # ==================== Operation Monitoring ====================

    def get_operations(
        self,
        limit: int = 10,
        offset: int = 0,
    ) -> List[OperationDetails]:
        """
        Get operations for current company

        Args:
            limit: Number of operations to return
            offset: Pagination offset

        Returns:
            List of OperationDetails
        """
        if limit <= 0:
            raise ValidationError("Limit must be positive")
        if offset < 0:
            raise ValidationError("Offset must be non-negative")

        response = self._request(
            'GET',
            '/operations',
            params={'limit': limit, 'offset': offset},
        )

        operations = response.get('operations', [])
        return [self._parse_operation_details(op) for op in operations]

    def get_operation(self, operation_id: str) -> OperationDetails:
        """
        Get specific operation details

        Args:
            operation_id: ID of operation

        Returns:
            OperationDetails
        """
        if not operation_id:
            raise ValidationError("Operation ID is required")

        response = self._request('GET', f'/operations/{operation_id}')
        return self._parse_operation_details(response)

    def get_temp_wallet_status(self, operation_id: str) -> TempWalletStatus:
        """
        Get temporary wallet status for operation

        Args:
            operation_id: ID of operation with temp wallet

        Returns:
            TempWalletStatus
        """
        if not operation_id:
            raise ValidationError("Operation ID is required")

        response = self._request('GET', f'/operations/{operation_id}/temp-wallet')
        return self._parse_temp_wallet_status(response)

    # ==================== Admin Methods ====================

    def get_admin_statistics(self) -> AdminStatistics:
        """
        Get admin statistics (admin only)

        Returns:
            AdminStatistics

        Raises:
            AuthenticationError: If not admin
        """
        if not self.is_authenticated():
            raise AuthenticationError("Authentication required")

        response = self._request('GET', '/admin/statistics')
        return AdminStatistics(
            total_companies=response['total_companies'],
            total_stablecoins=response['total_stablecoins'],
            total_operations=response['total_operations'],
            completed_operations=response['completed_operations'],
            pending_operations=response['pending_operations'],
        )

    def get_admin_companies(self, limit: int = 10, offset: int = 0) -> List[Company]:
        """
        Get all companies (admin only)

        Args:
            limit: Number of companies to return
            offset: Pagination offset

        Returns:
            List of Company
        """
        if limit <= 0:
            raise ValidationError("Limit must be positive")

        response = self._request(
            'GET',
            '/admin/companies',
            params={'limit': limit, 'offset': offset},
        )

        companies = response.get('companies', [])
        return [
            Company(
                id=c['id'],
                name=c['name'],
                wallet_address=c['wallet_address'],
                created_at=c['created_at'],
            )
            for c in companies
        ]

    def get_admin_stablecoins(self, limit: int = 10, offset: int = 0) -> List[Stablecoin]:
        """
        Get all stablecoins (admin only)

        Args:
            limit: Number of stablecoins to return
            offset: Pagination offset

        Returns:
            List of Stablecoin
        """
        if limit <= 0:
            raise ValidationError("Limit must be positive")

        response = self._request(
            'GET',
            '/admin/stablecoins',
            params={'limit': limit, 'offset': offset},
        )

        stablecoins = response.get('stablecoins', [])
        return [
            Stablecoin(
                id=s['id'],
                company_id=s['company_id'],
                currency_code=s['currency_code'],
                issuer_address=s['issuer_address'],
                total_supply=s['total_supply'],
                created_at=s['created_at'],
            )
            for s in stablecoins
        ]

    def get_admin_stablecoin_by_code(self, currency_code: str) -> Stablecoin:
        """
        Get stablecoin by currency code (admin only)

        Args:
            currency_code: Currency code to lookup

        Returns:
            Stablecoin details
        """
        if not currency_code:
            raise ValidationError("Currency code is required")

        response = self._request('GET', f'/admin/stablecoin/{currency_code}')
        return Stablecoin(
            id=response['id'],
            company_id=response['company_id'],
            currency_code=response['currency_code'],
            issuer_address=response['issuer_address'],
            total_supply=response['total_supply'],
            created_at=response['created_at'],
        )

    def get_admin_temp_wallets(self, limit: int = 10, offset: int = 0) -> List[TempWallet]:
        """
        Get all temporary wallets (admin only)

        Args:
            limit: Number of wallets to return
            offset: Pagination offset

        Returns:
            List of TempWallet
        """
        if limit <= 0:
            raise ValidationError("Limit must be positive")

        response = self._request(
            'GET',
            '/admin/temp-wallets',
            params={'limit': limit, 'offset': offset},
        )

        wallets = response.get('temp_wallets', [])
        return [
            TempWallet(
                operation_id=w['operation_id'],
                address=w['address'],
                balance=w['balance'],
                status=w['status'],
                created_at=w['created_at'],
            )
            for w in wallets
        ]

    def get_admin_operations(self, limit: int = 10, offset: int = 0) -> List[OperationDetails]:
        """
        Get all operations (admin only)

        Args:
            limit: Number of operations to return
            offset: Pagination offset

        Returns:
            List of OperationDetails
        """
        if limit <= 0:
            raise ValidationError("Limit must be positive")

        response = self._request(
            'GET',
            '/admin/operations',
            params={'limit': limit, 'offset': offset},
        )

        operations = response.get('operations', [])
        return [self._parse_operation_details(op) for op in operations]

    def get_admin_company_stablecoins(
        self,
        company_id: str,
        limit: int = 10,
        offset: int = 0,
    ) -> List[Stablecoin]:
        """
        Get stablecoins for specific company (admin only)

        Args:
            company_id: Company ID to query
            limit: Number of stablecoins to return
            offset: Pagination offset

        Returns:
            List of Stablecoin
        """
        if not company_id:
            raise ValidationError("Company ID is required")

        response = self._request(
            'GET',
            f'/admin/company/{company_id}/stablecoins',
            params={'limit': limit, 'offset': offset},
        )

        stablecoins = response.get('stablecoins', [])
        return [
            Stablecoin(
                id=s['id'],
                company_id=s['company_id'],
                currency_code=s['currency_code'],
                issuer_address=s['issuer_address'],
                total_supply=s['total_supply'],
                created_at=s['created_at'],
            )
            for s in stablecoins
        ]

    def get_admin_company_operations(
        self,
        company_id: str,
        limit: int = 10,
        offset: int = 0,
    ) -> List[OperationDetails]:
        """
        Get operations for specific company (admin only)

        Args:
            company_id: Company ID to query
            limit: Number of operations to return
            offset: Pagination offset

        Returns:
            List of OperationDetails
        """
        if not company_id:
            raise ValidationError("Company ID is required")

        response = self._request(
            'GET',
            f'/admin/company/{company_id}/operations',
            params={'limit': limit, 'offset': offset},
        )

        operations = response.get('operations', [])
        return [self._parse_operation_details(op) for op in operations]

    # ==================== Helper Methods ====================

    def _parse_operation_details(self, data: Dict[str, Any]) -> OperationDetails:
        """Parse operation details from API response"""
        deposits = []
        if data.get('deposit_history'):
            deposits = [
                DepositHistory(
                    amount=d['amount'],
                    tx_hash=d['tx_hash'],
                    timestamp=d['timestamp'],
                )
                for d in data['deposit_history']
            ]

        return OperationDetails(
            id=data['id'],
            stablecoin_id=data['stablecoin_id'],
            type=data['type'],
            status=data['status'],
            amount_rlusd=data.get('amount_rlusd'),
            amount_brl=data.get('amount_brl'),
            temp_wallet_address=data.get('temp_wallet_address'),
            amount_deposited=data.get('amount_deposited'),
            deposit_count=data.get('deposit_count'),
            deposit_history=deposits if deposits else None,
            created_at=data.get('created_at'),
        )

    def _parse_temp_wallet_status(self, data: Dict[str, Any]) -> TempWalletStatus:
        """Parse temporary wallet status from API response"""
        deposits = []
        if data.get('deposit_history'):
            deposits = [
                DepositHistory(
                    amount=d['amount'],
                    tx_hash=d['tx_hash'],
                    timestamp=d['timestamp'],
                )
                for d in data['deposit_history']
            ]

        return TempWalletStatus(
            operation_id=data['operation_id'],
            temp_wallet_address=data['temp_wallet_address'],
            current_balance_xrp=data['current_balance_xrp'],
            deposit_progress_percent=data['deposit_progress_percent'],
            amount_required_rlusd=data['amount_required_rlusd'],
            amount_deposited_rlusd=data['amount_deposited_rlusd'],
            deposit_count=data['deposit_count'],
            deposit_history=deposits,
            status=data['status'],
            error=data.get('error'),
        )
