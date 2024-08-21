import React, { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import * as web3 from "@solana/web3.js";
import * as borsh from "borsh";

const programId = new web3.PublicKey("J6ZnK6M64dCBVocoSNKJCnWD7dnua5Q8UGw2VqX9J9hU");
const connection = new web3.Connection(web3.clusterApiUrl("testnet"));


const IdentityDapp = () => {
  const { publicKey, signTransaction } = useWallet();
  const [nickname, setNickname] = useState("");
  const [status, setStatus] = useState("");

  const updateNickname = async () => {
    if (!publicKey) {
      setStatus("Please connect your wallet!");
      return;
    }
  
    try {
      // Get the latest blockhash
      const { blockhash } = await connection.getLatestBlockhash();
  
      // Find the program derived address (PDA) for the identity account
      const [identityPDA] = web3.PublicKey.findProgramAddressSync(
        [Buffer.from("identity"), publicKey.toBuffer()],
        programId
      );
  
      const instructionData = Buffer.from(nickname, "utf8");
  
      const instruction = new web3.TransactionInstruction({
        programId,
        keys: [
          { pubkey: publicKey, isSigner: true, isWritable: false },
          { pubkey: identityPDA, isSigner: false, isWritable: true },
          { pubkey: web3.SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        data: instructionData,
      });
  
      // Create the transaction and assign the recent blockhash
      const transaction = new web3.Transaction().add(instruction);
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;
  
      // Sign the transaction with the user's wallet
      const signedTransaction = await signTransaction(transaction);
  
      // Send the signed transaction to the network
      const signature = await connection.sendRawTransaction(signedTransaction.serialize());
  
      // Confirm the transaction
      const confirmation = await connection.confirmTransaction(signature);
  
      if (confirmation.value.err === null) {
        setStatus("Nickname updated successfully!");
      } else {
        setStatus("Failed to update nickname.");
      }
    } catch (error) {
      console.error("Error updating nickname:", error);
      setStatus("An error occurred while updating the nickname.");
    }
  };
  

  return (
    <div style={{display: "flex", justifyContent: "center", flexDirection: "column", alignItems: "center", width: '100vw'}}>
      <h1>Solana Identity Manager</h1>
      <input
        type="text"
        placeholder="Enter your name"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        style={{padding: "5px", text: "bold", margin: "5px", border: "2px solid black"}}
      />
      <button onClick={updateNickname}>Update Name</button>
      <p>{status}</p>
    </div>
  );
};

export default IdentityDapp;
