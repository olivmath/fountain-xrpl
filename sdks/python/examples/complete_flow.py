#!/usr/bin/env python3
"""Complete workflow example for Fountain SDK"""

import time
from fountain_sdk import FountainSDK, APIError, ValidationError


def main():
    # Initialize SDK
    fountain = FountainSDK("http://localhost:3000")

    try:
        # Step 1: Login
        print("=" * 50)
        print("STEP 1: Authentication")
        print("=" * 50)
        login = fountain.login("user@company.com")
        print(f"✅ Logged in as: {login.company_name}")
        print(f"   Company ID: {login.company_id}\n")

        # Step 2: Create stablecoin operation
        print("=" * 50)
        print("STEP 2: Create Stablecoin Operation")
        print("=" * 50)
        operation = fountain.create_stablecoin(
            currency_code="CBRL",
            amount_brl=5000.00,
            deposit_type="XRP",
            company_wallet="rN7n7otQDd6FczFgLdhnKsWCZp3tWgLGds",
            webhook_url="https://api.company.com/webhook"
        )
        print(f"✅ Operation created!")
        print(f"   Operation ID: {operation.id}")
        print(f"   Status: {operation.status}")
        print(f"   Amount BRL: {operation.amount_brl}\n")

        # Step 3: Monitor temporary wallet
        print("=" * 50)
        print("STEP 3: Monitor Temporary Wallet")
        print("=" * 50)
        if operation.id:
            for i in range(3):
                status = fountain.get_temp_wallet_status(operation.id)
                print(f"Check {i+1}:")
                print(f"   Wallet: {status.temp_wallet_address}")
                print(f"   Balance: {status.current_balance_xrp} XRP")
                print(f"   Progress: {status.deposit_progress_percent}%")
                print(f"   Status: {status.status}\n")

                if i < 2:
                    print("   Waiting 5 seconds before next check...\n")
                    time.sleep(5)

        # Step 4: Get operation details
        print("=" * 50)
        print("STEP 4: Get Operation Details")
        print("=" * 50)
        details = fountain.get_operation(operation.id)
        print(f"Operation Details:")
        print(f"   Type: {details.type}")
        print(f"   Status: {details.status}")
        print(f"   Created: {details.created_at}")
        if details.deposit_count:
            print(f"   Deposits received: {details.deposit_count}")
            if details.deposit_history:
                print("   Deposit history:")
                for deposit in details.deposit_history:
                    print(f"      - {deposit.amount} {deposit.tx_hash}")
        print()

        # Step 5: Mint more tokens
        print("=" * 50)
        print("STEP 5: Mint More Tokens")
        print("=" * 50)
        mint_op = fountain.mint_more(
            stablecoin_id=operation.stablecoin_id,
            amount_brl=2000.00,
            deposit_type="XRP",
            webhook_url="https://api.company.com/webhook"
        )
        print(f"✅ Mint operation created!")
        print(f"   Operation ID: {mint_op.id}")
        print(f"   Amount BRL: {mint_op.amount_brl}\n")

        # Step 6: Get stablecoin info
        print("=" * 50)
        print("STEP 6: Get Stablecoin Details")
        print("=" * 50)
        stablecoin = fountain.get_stablecoin(operation.stablecoin_id)
        print(f"Stablecoin Info:")
        for key, value in stablecoin.items():
            print(f"   {key}: {value}")
        print()

        # Step 7: List all operations
        print("=" * 50)
        print("STEP 7: List Company Operations")
        print("=" * 50)
        operations = fountain.get_operations(limit=10)
        print(f"Found {len(operations)} operations:")
        for op in operations[:5]:  # Show first 5
            print(f"   - {op.id}: {op.type} ({op.status})")
        print()

        # Step 8: Burn tokens
        print("=" * 50)
        print("STEP 8: Burn (Redeem) Tokens")
        print("=" * 50)
        burn_op = fountain.burn_stablecoin(
            stablecoin_id=operation.stablecoin_id,
            amount_tokens=500.00,
            return_asset="XRP"
        )
        print(f"✅ Burn operation created!")
        print(f"   Operation ID: {burn_op.id}")
        print(f"   Type: {burn_op.type}")
        print(f"   Status: {burn_op.status}\n")

        print("=" * 50)
        print("✨ Complete workflow executed successfully!")
        print("=" * 50)

    except ValidationError as e:
        print(f"❌ Validation error: {str(e)}")
    except APIError as e:
        print(f"❌ API error: {str(e)}")
        if hasattr(e, 'status_code'):
            print(f"   Status code: {e.status_code}")
    except Exception as e:
        print(f"❌ Unexpected error: {str(e)}")


if __name__ == "__main__":
    main()
