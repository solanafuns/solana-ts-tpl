import * as web3 from "@solana/web3.js";
import dotenv from "dotenv";
dotenv.config();

const connection = new web3.Connection("http://127.0.0.1:8899");

const outSignaAndSend = async (message: Buffer) => {
  console.log("sleep 3 seconds!!!");
  await new Promise((resolve) => setTimeout(resolve, 3000));

  const secret = JSON.parse(process.env.PRIVATE_KEY ?? "") as number[];
  const secretKey = Uint8Array.from(secret);
  const signer = web3.Keypair.fromSecretKey(secretKey);
  const tx = web3.Transaction.populate(web3.Message.from(message));
  tx.partialSign(signer);
  console.log(tx.signatures);
  const sx = await connection.sendRawTransaction(tx.serialize());
  console.log(`transaction is  ${sx}`);
};

const main = async () => {
  const secret = JSON.parse(process.env.PRIVATE_KEY ?? "") as number[];
  const secretKey = Uint8Array.from(secret);
  const signer = web3.Keypair.fromSecretKey(secretKey);
  console.log(signer.publicKey.toBase58());

  const ix = web3.SystemProgram.transfer({
    fromPubkey: signer.publicKey,
    toPubkey: signer.publicKey,
    lamports: 100,
  });
  const tx = new web3.Transaction();
  tx.add(ix);

  tx.feePayer = signer.publicKey;

  const latestBlockhash = await connection.getLatestBlockhash();
  tx.recentBlockhash = latestBlockhash.blockhash;

  for (let i = 0; i < 10; i++) {
    console.log("sign and execute out --------> ");
    await outSignaAndSend(tx.serializeMessage());
  }

  // await outSignaAndSend(tx.serializeMessage());

  //   tx.sign(signer);
  //   const sx = await connection.sendRawTransaction(tx.serialize());

  //   console.log(`transaction is  ${sx}`);
};

main();
