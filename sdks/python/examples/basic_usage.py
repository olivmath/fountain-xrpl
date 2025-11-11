#!/usr/bin/env python3
"""Basic usage example for Fountain SDK"""

from fountain_sdk import FountainSDK, AuthenticationError, APIError


def main():
    # Initialize SDK
    fountain = FountainSDK("http://localhost:3000")

    try:
        # Login with email
        print("📝 Logging in...")
        login = fountain.login("admin@sonica.com")
        print(f"✅ Login successful!")
        print(f"   Company: {login.company_name}")
        print(f"   Email: {login.email}")
        print(f"   Is Admin: {login.is_admin}")
        print(f"   Token expires: {login.expires}\n")

        # Check authentication
        print("🔐 Authentication status:")
        print(f"   Authenticated: {fountain.is_authenticated()}")
        print(f"   Token set: {fountain.get_token() is not None}\n")

        # Get operations for current company
        print("📊 Fetching operations...")
        operations = fountain.get_operations(limit=5)
        print(f"✅ Found {len(operations)} operations:")
        for op in operations:
            print(f"   - {op.id}: {op.type} ({op.status})")
        print()

        # Create a new stablecoin operation
        print("🏗️  Creating stablecoin operation...")
        operation = fountain.create_stablecoin(
            currency_code="APBRL",
            amount_brl=1000.00,
            deposit_type="XRP",
            webhook_url="https://example.com/webhook"
        )
        print(f"✅ Operation created!")
        print(f"   ID: {operation.id}")
        print(f"   Status: {operation.status}")
        print(f"   Amount BRL: {operation.amount_brl}\n")

        # Get operation details
        if operation.id:
            print(f"📋 Getting operation details for {operation.id}...")
            details = fountain.get_operation(operation.id)
            print(f"✅ Operation details retrieved:")
            print(f"   Type: {details.type}")
            print(f"   Status: {details.status}")
            print(f"   Created: {details.created_at}")

        print("\n✨ All operations completed successfully!")

    except AuthenticationError as e:
        print(f"❌ Authentication error: {str(e)}")
    except APIError as e:
        print(f"❌ API error: {str(e)}")
        if hasattr(e, 'status_code'):
            print(f"   Status code: {e.status_code}")
    except Exception as e:
        print(f"❌ Error: {str(e)}")


if __name__ == "__main__":
    main()
