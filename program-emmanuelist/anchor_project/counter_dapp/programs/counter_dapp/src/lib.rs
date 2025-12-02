use anchor_lang::prelude::*;

declare_id!("Gs88iGv4WFEC8zfTBRnpDqP895o61BKzyFbdWNtHtFuy");

#[program]
pub mod counter_dapp {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let counter = &mut ctx.accounts.counter;
        counter.owner = ctx.accounts.user.key();
        counter.count = 0;
        counter.total_increments = 0;
        counter.created_at = Clock::get()?.unix_timestamp;
        
        msg!("Counter initialized for user: {}", ctx.accounts.user.key());
        Ok(())
    }

    pub fn increment(ctx: Context<Increment>) -> Result<()> {
        let counter = &mut ctx.accounts.counter;
        
        require!(
            counter.owner == ctx.accounts.user.key(),
            CounterError::Unauthorized
        );
        
        counter.count = counter.count.checked_add(1).ok_or(CounterError::Overflow)?;
        counter.total_increments = counter.total_increments.checked_add(1).ok_or(CounterError::Overflow)?;
        
        msg!("Counter incremented to: {}", counter.count);
        Ok(())
    }

    pub fn reset(ctx: Context<Reset>) -> Result<()> {
        let counter = &mut ctx.accounts.counter;
        
        require!(
            counter.owner == ctx.accounts.user.key(),
            CounterError::Unauthorized
        );
        
        counter.count = 0;
        
        msg!("Counter reset to 0");
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + Counter::INIT_SPACE,
        seeds = [b"counter", user.key().as_ref()],
        bump
    )]
    pub counter: Account<'info, Counter>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Increment<'info> {
    #[account(
        mut,
        seeds = [b"counter", user.key().as_ref()],
        bump
    )]
    pub counter: Account<'info, Counter>,
    pub user: Signer<'info>,
}

#[derive(Accounts)]
pub struct Reset<'info> {
    #[account(
        mut,
        seeds = [b"counter", user.key().as_ref()],
        bump
    )]
    pub counter: Account<'info, Counter>,
    pub user: Signer<'info>,
}

#[account]
#[derive(InitSpace)]
pub struct Counter {
    pub owner: Pubkey,
    pub count: u64,
    pub total_increments: u64,
    pub created_at: i64,
}

#[error_code]
pub enum CounterError {
    #[msg("You are not authorized to perform this action")]
    Unauthorized,
    #[msg("Counter overflow")]
    Overflow,
}
