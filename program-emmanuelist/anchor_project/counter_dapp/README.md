# Counter dApp - Anchor Program

A Solana program built with Anchor framework for a decentralized counter application.

## Program Features

- **Initialize**: Create a personal counter account using PDA
- **Increment**: Increase counter by 1 (owner-only)
- **Reset**: Set counter back to 0 (owner-only)

## Account Structure

\`\`\`rust
pub struct Counter {
    pub owner: Pubkey,           // Owner's wallet address
    pub count: u64,              // Current count value
    pub total_increments: u64,   // Total increments (persists through resets)
    pub created_at: i64,         // Unix timestamp of creation
}
\`\`\`

## PDA Seeds

Counter PDA: `["counter", user_pubkey]`

## Deployed Program

**Devnet Program ID**: \`Gs88iGv4WFEC8zfTBRnpDqP895o61BKzyFbdWNtHtFuy\`

## Build & Test

\`\`\`bash
# Build
anchor build

# Test
anchor test

# Deploy to Devnet
anchor deploy --provider.cluster devnet
\`\`\`

## Test Coverage

- ✅ Happy path: initialize, increment, reset
- ❌ Unhappy path: duplicate init, unauthorized access, non-existent accounts
