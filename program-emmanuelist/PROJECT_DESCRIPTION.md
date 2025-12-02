# Project Description

**Deployed Frontend URL:** https://counter-dapp-taupe.vercel.app/

**Solana Program ID:** `Gs88iGv4WFEC8zfTBRnpDqP895o61BKzyFbdWNtHtFuy`

## Project Overview

### Description
A simple decentralized counter application built on Solana. Each user can create their own personal counter account, increment it, and reset it to zero. The counter uses Program Derived Addresses (PDAs) to ensure that each user has a unique counter account derived from their wallet address. This provides data isolation and ownership - only the wallet owner can modify their counter. The application tracks both the current count and total increments made over the lifetime of the counter, with the total increments persisting even when the counter is reset.

### Key Features

- **Create Counter**: Initialize a new personal counter account using your wallet
- **Increment Counter**: Add 1 to your counter value with a single click
- **Reset Counter**: Set your counter back to 0 while preserving total increment history
- **View Statistics**: See your current count and lifetime total increments
- **Wallet Integration**: Connect with Phantom, Solflare, and other Solana wallets
- **Ownership Protection**: Only you can modify your counter - enforced by PDA validation
  
### How to Use the dApp

1. **Connect Wallet**: Click the "Select Wallet" button and choose your Solana wallet (Phantom or Solflare recommended)
2. **Create Counter**: If this is your first time, click "Create Counter" to initialize your personal counter account (requires small SOL for transaction fee)
3. **Increment**: Click the green "+" button to increase your counter by 1
4. **Reset**: Click the red "Reset" button to set your counter back to 0 (total increments will still be tracked)
5. **View Stats**: Your current count is displayed in large numbers, with total lifetime increments shown below

## Program Architecture

The Counter dApp uses a straightforward architecture with three main instructions and one account type. The program leverages Anchor's account macros for automatic validation and security. Each user's counter is stored in a PDA derived from their wallet address, ensuring unique accounts and preventing unauthorized access. The program uses checked arithmetic to prevent overflow and includes custom error handling for better user experience.

### PDA Usage

The program uses a single PDA pattern for counter accounts. Seeds: `[b"counter", user.key().as_ref()]`. This ensures each user has exactly one counter account that is deterministically derived from their wallet address. Benefits: (1) No need to store/pass account addresses - they can always be re-derived, (2) Prevents account collision between users, (3) Built-in ownership validation since PDAs are derived from the user's public key.

**PDAs Used:**
- **Counter PDA**: Seeds `["counter", user_pubkey]` - Creates a unique counter account for each wallet address, ensuring data isolation and deterministic addressing

### Program Instructions

**Instructions Implemented:**
- **initialize**: Creates a new counter account for the user. Initializes count and total_increments to 0, sets the owner to the user's wallet, and records the creation timestamp. Uses `init` macro for automatic account creation and rent payment.
- **increment**: Increases the count by 1 and increments total_increments. Includes ownership validation to ensure only the counter owner can increment. Uses checked arithmetic to prevent overflow.
- **reset**: Sets the count back to 0 while preserving owner, total_increments, and created_at fields. Includes ownership validation to prevent unauthorized resets.

### Account Structure

```rust
#[account]
#[derive(InitSpace)]
pub struct Counter {
    pub owner: Pubkey,           // The wallet address that owns this counter (32 bytes)
    pub count: u64,              // Current counter value (8 bytes)
    pub total_increments: u64,   // Total number of times incremented, persists through resets (8 bytes)
    pub created_at: i64,         // Unix timestamp when the counter was created (8 bytes)
}
// Total account size: 8 (discriminator) + 32 + 8 + 8 + 8 = 64 bytes
```

## Testing

### Test Coverage

Comprehensive test suite covering all three instructions with both successful operations and error conditions. Tests run on a local validator using Anchor's test framework. All 8 tests pass successfully.

**Happy Path Tests:**
- **Initializes a counter account**: Verifies counter is created with owner set correctly, count and total_increments at 0, and valid creation timestamp
- **Increments the counter**: Confirms count increases from 0 to 1 and total_increments updates correctly
- **Increments multiple times**: Tests repeated increments work correctly (count reaches 3, total_increments tracks accurately)
- **Resets the counter**: Verifies count returns to 0 while total_increments persists at 3

**Unhappy Path Tests:**
- **Fails to initialize duplicate counter**: Attempts to create second counter for same user, correctly fails with account already exists error
- **Fails when unauthorized user tries to increment**: Tests PDA/ownership validation by having different wallet attempt to increment, correctly fails
- **Fails when unauthorized user tries to reset**: Verifies unauthorized user cannot reset another user's counter, correctly fails
- **Fails to fetch non-existent counter**: Confirms proper error handling when trying to fetch account that doesn't exist

### Running Tests
```bash
# Install dependencies (if not already done)
cd anchor_project/counter_dapp
yarn install

# Run all tests
anchor test

# Build only
anchor build

# Deploy to devnet
anchor deploy --provider.cluster devnet
```

**Test Results**: All 8 tests passing ✅

### Additional Notes for Evaluators

**Development Journey**: This Counter dApp was built to meet all School of Solana requirements while keeping the implementation clean and educational. The biggest learning moment was understanding how PDAs provide both deterministic addressing and built-in security through seed validation.

**Security Features**:
- Ownership validation on increment and reset operations
- Checked arithmetic to prevent overflow
- PDA seeds ensure unique accounts per user
- Anchor's account macros provide automatic security checks

**Code Quality**:
- Well-commented Rust code
- Comprehensive test coverage (8/8 tests passing)
- TypeScript frontend with proper error handling
- Clean separation of concerns

**Deployment**:
- Program deployed to Devnet: `Gs88iGv4WFEC8zfTBRnpDqP895o61BKzyFbdWNtHtFuy`
- Frontend ready for Vercel deployment (pending GitHub push)
- All test transactions confirmed on Devnet

**What I Learned**:
- How PDAs work and why they're powerful for account management
- Anchor's account validation system
- Proper error handling in Solana programs
- Wallet adapter integration in Next.js
- Testing strategies for both happy and unhappy paths