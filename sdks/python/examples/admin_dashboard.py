#!/usr/bin/env python3
"""Admin dashboard example for Fountain SDK"""

from fountain_sdk import FountainSDK, AuthenticationError, APIError


def main():
    # Initialize SDK
    fountain = FountainSDK("http://localhost:3000")

    try:
        # Login as admin
        print("📝 Logging in as admin...")
        login = fountain.login("admin@fountain.com")

        if not login.is_admin:
            print("❌ User is not an admin")
            return

        print(f"✅ Admin login successful!\n")

        # Get system statistics
        print("📊 System Statistics")
        stats = fountain.get_admin_statistics()
        print(f"   Total companies: {stats.total_companies}")
        print(f"   Total stablecoins: {stats.total_stablecoins}")
        print(f"   Total operations: {stats.total_operations}")
        print(f"   Completed operations: {stats.completed_operations}")
        print(f"   Pending operations: {stats.pending_operations}\n")

        # List all companies
        print("🏢 Companies")
        companies = fountain.get_admin_companies(limit=5)
        for company in companies:
            print(f"   - {company.name} ({company.id})")
            print(f"     Wallet: {company.wallet_address}")
        print()

        # List all stablecoins
        print("💰 Stablecoins")
        stablecoins = fountain.get_admin_stablecoins(limit=5)
        for sc in stablecoins:
            print(f"   - {sc.currency_code} (Total supply: {sc.total_supply})")
            print(f"     Issuer: {sc.issuer_address}")
        print()

        # Get all temporary wallets
        print("🔑 Temporary Wallets")
        temp_wallets = fountain.get_admin_temp_wallets(limit=5)
        for wallet in temp_wallets:
            print(f"   - {wallet.address}")
            print(f"     Status: {wallet.status}")
            print(f"     Balance: {wallet.balance} XRP")
        print()

        # Get all operations
        print("📋 Recent Operations")
        operations = fountain.get_admin_operations(limit=5)
        for op in operations:
            print(f"   - {op.id}: {op.type} ({op.status})")
            if op.amount_brl:
                print(f"     Amount: {op.amount_brl} BRL")
        print()

        print("✨ Dashboard loaded successfully!")

    except AuthenticationError as e:
        print(f"❌ Authentication error: {str(e)}")
    except APIError as e:
        print(f"❌ API error: {str(e)}")
    except Exception as e:
        print(f"❌ Error: {str(e)}")


if __name__ == "__main__":
    main()
