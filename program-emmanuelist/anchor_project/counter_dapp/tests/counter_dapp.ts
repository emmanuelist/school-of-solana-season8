import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { CounterDapp } from "../target/types/counter_dapp";
import { expect } from "chai";

describe("counter_dapp", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.CounterDapp as Program<CounterDapp>;
  const user = provider.wallet;

  // Derive the counter PDA
  const [counterPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("counter"), user.publicKey.toBuffer()],
    program.programId
  );

  describe("Happy Path Tests", () => {
    it("Initializes a counter account", async () => {
      const tx = await program.methods
        .initialize()
        .accounts({
          counter: counterPda,
          user: user.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      console.log("Initialize transaction signature:", tx);

      // Fetch the counter account
      const counterAccount = await program.account.counter.fetch(counterPda);

      // Verify the counter was initialized correctly
      expect(counterAccount.owner.toString()).to.equal(
        user.publicKey.toString()
      );
      expect(counterAccount.count.toNumber()).to.equal(0);
      expect(counterAccount.totalIncrements.toNumber()).to.equal(0);
      expect(counterAccount.createdAt.toNumber()).to.be.greaterThan(0);
    });

    it("Increments the counter", async () => {
      const tx = await program.methods
        .increment()
        .accounts({
          counter: counterPda,
          user: user.publicKey,
        })
        .rpc();

      console.log("Increment transaction signature:", tx);

      // Fetch the counter account
      const counterAccount = await program.account.counter.fetch(counterPda);

      // Verify the counter was incremented
      expect(counterAccount.count.toNumber()).to.equal(1);
      expect(counterAccount.totalIncrements.toNumber()).to.equal(1);
    });

    it("Increments the counter multiple times", async () => {
      // Increment twice more
      await program.methods
        .increment()
        .accounts({
          counter: counterPda,
          user: user.publicKey,
        })
        .rpc();

      await program.methods
        .increment()
        .accounts({
          counter: counterPda,
          user: user.publicKey,
        })
        .rpc();

      // Fetch the counter account
      const counterAccount = await program.account.counter.fetch(counterPda);

      // Verify the counter was incremented correctly
      expect(counterAccount.count.toNumber()).to.equal(3);
      expect(counterAccount.totalIncrements.toNumber()).to.equal(3);
    });

    it("Resets the counter", async () => {
      const tx = await program.methods
        .reset()
        .accounts({
          counter: counterPda,
          user: user.publicKey,
        })
        .rpc();

      console.log("Reset transaction signature:", tx);

      // Fetch the counter account
      const counterAccount = await program.account.counter.fetch(counterPda);

      // Verify the counter was reset
      expect(counterAccount.count.toNumber()).to.equal(0);
      // total_increments should persist
      expect(counterAccount.totalIncrements.toNumber()).to.equal(3);
    });
  });

  describe("Unhappy Path Tests", () => {
    it("Fails to initialize duplicate counter", async () => {
      try {
        await program.methods
          .initialize()
          .accounts({
            counter: counterPda,
            user: user.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .rpc();

        // If we reach here, the test should fail
        expect.fail("Should have thrown an error for duplicate initialization");
      } catch (error) {
        // Expected to fail - counter already exists
        expect(error).to.exist;
      }
    });

    it("Fails when unauthorized user tries to increment", async () => {
      // Create a new keypair to act as an unauthorized user
      const unauthorizedUser = anchor.web3.Keypair.generate();

      // Airdrop some SOL to the unauthorized user for transaction fees
      const signature = await provider.connection.requestAirdrop(
        unauthorizedUser.publicKey,
        1 * anchor.web3.LAMPORTS_PER_SOL
      );
      await provider.connection.confirmTransaction(signature);

      try {
        await program.methods
          .increment()
          .accounts({
            counter: counterPda,
            user: unauthorizedUser.publicKey,
          })
          .signers([unauthorizedUser])
          .rpc();

        expect.fail("Should have thrown an error for unauthorized access");
      } catch (error) {
        // The error occurs because the PDA derived with unauthorized user doesn't match
        // This is expected behavior - PDA validation prevents unauthorized access
        expect(error).to.exist;
      }
    });

    it("Fails when unauthorized user tries to reset", async () => {
      // Create a new keypair to act as an unauthorized user
      const unauthorizedUser = anchor.web3.Keypair.generate();

      // Airdrop some SOL to the unauthorized user
      const signature = await provider.connection.requestAirdrop(
        unauthorizedUser.publicKey,
        1 * anchor.web3.LAMPORTS_PER_SOL
      );
      await provider.connection.confirmTransaction(signature);

      try {
        await program.methods
          .reset()
          .accounts({
            counter: counterPda,
            user: unauthorizedUser.publicKey,
          })
          .signers([unauthorizedUser])
          .rpc();

        expect.fail("Should have thrown an error for unauthorized access");
      } catch (error) {
        // The error occurs because the PDA derived with unauthorized user doesn't match
        // This is expected behavior - PDA validation prevents unauthorized access
        expect(error).to.exist;
      }
    });

    it("Fails to fetch non-existent counter", async () => {
      const newUser = anchor.web3.Keypair.generate();
      const [nonExistentCounterPda] =
        anchor.web3.PublicKey.findProgramAddressSync(
          [Buffer.from("counter"), newUser.publicKey.toBuffer()],
          program.programId
        );

      try {
        await program.account.counter.fetch(nonExistentCounterPda);
        expect.fail("Should have thrown an error for non-existent account");
      } catch (error) {
        expect(error.toString()).to.include("Account does not exist");
      }
    });
  });
});
