"""Exception classes for Fountain SDK"""


class FountainSDKError(Exception):
    """Base exception for Fountain SDK"""
    pass


class AuthenticationError(FountainSDKError):
    """Raised when authentication fails"""
    pass


class APIError(FountainSDKError):
    """Raised when API request fails"""
    def __init__(self, message: str, status_code: int = None, response_data: dict = None):
        super().__init__(message)
        self.status_code = status_code
        self.response_data = response_data


class ValidationError(FountainSDKError):
    """Raised when request validation fails"""
    pass
