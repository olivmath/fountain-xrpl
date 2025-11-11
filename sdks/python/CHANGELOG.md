# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-11-10

### Added
- Initial release of Fountain Python SDK
- Complete Python SDK with full type support
- 18 API methods covering:
  - Authentication (login, token management, logout)
  - Stablecoin operations (create, mint more, burn, get details)
  - Operation monitoring (get operations, view temp wallet status)
  - Admin dashboard (statistics, companies, stablecoins, temp wallet monitoring)
- Comprehensive API documentation with examples
- Full type hints for IDE support
- Automatic JWT token management
- Error handling with custom exception classes
- Support for pagination and filtering

### Features
- Email-based authentication with JWT tokens
- Support for XRP deposits with temporary wallets
- Real-time wallet monitoring and deposit progress tracking
- Admin statistics and comprehensive monitoring endpoints
- Company-specific stablecoin and operation queries
- Webhook integration support
- Automatic token inclusion in request headers
- Comprehensive error handling with detailed exceptions
