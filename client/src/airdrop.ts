import * as web3 from "@solana/web3.js";
import dotenv from "dotenv";
import { airdropSolIfNeeded } from "./initializeKeypair";
dotenv.config();

const connection = new web3.Connection(web3.clusterApiUrl("devnet"));

const main = async () => {
  const signer = web3.Keypair.generate();
  console.log(signer.publicKey.toBase58());

  await airdropSolIfNeeded(signer, connection);

  const ix = web3.SystemProgram.transfer({
    fromPubkey: signer.publicKey,
    toPubkey: new web3.PublicKey(
      "FVRzp2QNHYEXtoFmhE9gdkRbvCQLYL6cRcc6V7XQg6Ko"
    ),
    lamports: web3.LAMPORTS_PER_SOL * 3,
  });
  const tx = new web3.Transaction();
  tx.add(ix);

  tx.feePayer = signer.publicKey;

  const latestBlockhash = await connection.getLatestBlockhash();
  tx.recentBlockhash = latestBlockhash.blockhash;

  tx.sign(signer);
  const sx = await connection.sendRawTransaction(tx.serialize());

  console.log(`transaction is  ${sx}`);
};

main();
