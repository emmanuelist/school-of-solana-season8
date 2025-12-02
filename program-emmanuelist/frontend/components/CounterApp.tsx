'use client';

import { FC, useEffect, useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Program, AnchorProvider, web3, BN } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import idl from '../idl/counter_dapp.json';

const PROGRAM_ID = new PublicKey('Gs88iGv4WFEC8zfTBRnpDqP895o61BKzyFbdWNtHtFuy');

export const CounterApp: FC = () => {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [count, setCount] = useState<number | null>(null);
  const [totalIncrements, setTotalIncrements] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [counterExists, setCounterExists] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const getProvider = () => {
    if (!wallet.publicKey) return null;
    const provider = new AnchorProvider(connection, wallet as any, {
      commitment: 'confirmed',
    });
    return provider;
  };

  const getProgram = () => {
    const provider = getProvider();
    if (!provider) return null;
    return new Program(idl as any, provider);
  };

  const getCounterPDA = () => {
    if (!wallet.publicKey) return null;
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from('counter'), wallet.publicKey.toBuffer()],
      PROGRAM_ID
    );
    return pda;
  };

  const fetchCounter = async () => {
    if (!wallet.publicKey) return;
    
    const program = getProgram();
    if (!program) return;

    const counterPDA = getCounterPDA();
    if (!counterPDA) return;

    try {
      // @ts-ignore - IDL types are dynamically generated
      const counterAccount = await program.account.counter.fetch(counterPDA);
      setCount((counterAccount.count as BN).toNumber());
      setTotalIncrements((counterAccount.totalIncrements as BN).toNumber());
      setCounterExists(true);
    } catch (error) {
      console.log('Counter not found');
      setCounterExists(false);
      setCount(null);
      setTotalIncrements(null);
    }
  };

  useEffect(() => {
    if (wallet.publicKey) {
      fetchCounter();
    }
  }, [wallet.publicKey]);

  const initialize = async () => {
    if (!wallet.publicKey) return;
    
    setLoading(true);
    try {
      const program = getProgram();
      if (!program) return;

      const counterPDA = getCounterPDA();
      if (!counterPDA) return;

      const tx = await program.methods
        .initialize()
        .accounts({
          counter: counterPDA,
          user: wallet.publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc();

      console.log('Initialize transaction signature:', tx);
      await fetchCounter();
      alert('Counter created successfully! 🎉');
    } catch (error: any) {
      console.error('Error initializing counter:', error);
      if (error.message?.includes('insufficient funds') || error.message?.includes('no record of a prior credit')) {
        alert('❌ Insufficient funds. Please get some Devnet SOL from https://faucet.solana.com');
      } else {
        alert('Failed to initialize counter: ' + (error.message || 'Unknown error'));
      }
    } finally {
      setLoading(false);
    }
  };

  const increment = async () => {
    if (!wallet.publicKey) return;
    
    setLoading(true);
    try {
      const program = getProgram();
      if (!program) return;

      const counterPDA = getCounterPDA();
      if (!counterPDA) return;

      const tx = await program.methods
        .increment()
        .accounts({
          counter: counterPDA,
          user: wallet.publicKey,
        })
        .rpc();

      console.log('Increment transaction signature:', tx);
      await fetchCounter();
    } catch (error: any) {
      console.error('Error incrementing counter:', error);
      if (error.message?.includes('insufficient funds') || error.message?.includes('no record of a prior credit')) {
        alert('❌ Insufficient funds for transaction fee. Get Devnet SOL from https://faucet.solana.com');
      } else {
        alert('Failed to increment counter: ' + (error.message || 'Unknown error'));
      }
    } finally {
      setLoading(false);
    }
  };

  const reset = async () => {
    if (!wallet.publicKey) return;
    
    setLoading(true);
    try {
      const program = getProgram();
      if (!program) return;

      const counterPDA = getCounterPDA();
      if (!counterPDA) return;

      const tx = await program.methods
        .reset()
        .accounts({
          counter: counterPDA,
          user: wallet.publicKey,
        })
        .rpc();

      console.log('Reset transaction signature:', tx);
      await fetchCounter();
    } catch (error) {
      console.error('Error resetting counter:', error);
      alert('Failed to reset counter');
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <h1 className="text-4xl font-bold text-center mb-6 bg-gradient-to-r from-purple-600 to-cyan-600 bg-clip-text text-transparent">
          Solana Counter dApp
        </h1>

        <div className="mb-6">
          <WalletMultiButton className="!bg-gradient-to-r !from-purple-600 !to-cyan-600 hover:!from-purple-700 hover:!to-cyan-700 !rounded-xl !font-semibold !w-full !justify-center" />
        </div>

        {wallet.publicKey && (
          <div className="space-y-6">
            {counterExists ? (
              <>
                <div className="bg-gradient-to-r from-purple-100 to-cyan-100 rounded-xl p-6 text-center">
                  <p className="text-gray-600 text-sm mb-2">Current Count</p>
                  <p className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-cyan-600">
                    {count}
                  </p>
                  <p className="text-gray-500 text-sm mt-2">
                    Total Increments: {totalIncrements}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={increment}
                    disabled={loading}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-4 px-6 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg text-2xl"
                  >
                    {loading ? '...' : '+'}
                  </button>
                  <button
                    onClick={reset}
                    disabled={loading}
                    className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-bold py-4 px-6 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                  >
                    {loading ? '...' : 'Reset'}
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center">
                <p className="text-gray-600 mb-4">
                  You don't have a counter yet. Create one to get started!
                </p>
                <button
                  onClick={initialize}
                  disabled={loading}
                  className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white font-bold py-3 px-8 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg w-full"
                >
                  {loading ? 'Creating...' : 'Create Counter'}
                </button>
              </div>
            )}
          </div>
        )}

        {!wallet.publicKey && (
          <p className="text-center text-gray-600 mt-4">
            Connect your wallet to get started
          </p>
        )}
      </div>

      <div className="mt-8 text-white text-center space-y-2">
        <p className="text-sm opacity-80">
          Built on Solana Devnet • School of Solana
        </p>
        {wallet.publicKey && (
          <p className="text-xs opacity-70">
            Need Devnet SOL? Visit{' '}
            <a 
              href="https://faucet.solana.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="underline hover:opacity-100"
            >
              faucet.solana.com
            </a>
          </p>
        )}
      </div>
    </div>
  );
};
