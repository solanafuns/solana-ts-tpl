import { initializeKeypair } from "./initializeKeypair";
import * as web3 from "@solana/web3.js";

const connection = new web3.Connection("http://127.0.0.1:8899");
// const connection = new web3.Connection(web3.clusterApiUrl("devnet"));

const program = new web3.PublicKey(
  "EHCFCSPghqC1ivDFmfSTxW2AvPfQoKFyCvaaH9BfS9qi"
);

async function ada_usage(signer: web3.Keypair) {
  const seed = "ada.creator";
  let ada_account = await web3.PublicKey.createWithSeed(
    signer.publicKey,
    seed,
    program
  );
  console.log("ada_account address: ", ada_account.toBase58());

  let ada_info = await connection.getAccountInfo(ada_account);

  if (ada_info) {
    console.log(ada_info);
    console.log("try resign program...");

    const transaction = new web3.Transaction().add(
      web3.SystemProgram.assign({
        accountPubkey: ada_account,
        basePubkey: signer.publicKey,
        programId: program,
        seed,
      })
    );

    let signature = await web3.sendAndConfirmTransaction(
      connection,
      transaction,
      [signer]
    );
    console.log(signature);
  } else {
    console.log("ada account not found");

    const transaction = new web3.Transaction().add(
      web3.SystemProgram.createAccountWithSeed({
        newAccountPubkey: ada_account,
        fromPubkey: signer.publicKey,
        basePubkey: signer.publicKey,
        programId: program,
        seed,
        lamports: web3.LAMPORTS_PER_SOL,
        space: 20,
      })
    );

    const signature = await web3.sendAndConfirmTransaction(
      connection,
      transaction,
      [signer]
    );

    console.log(signature);
  }
}

async function pda_usage(signer: web3.Keypair) {
  const pda_address = "EHCFCSPghqC1ivDFmfSTxW2AvPfQoKFyCvaaH9BfS9qi";
  let pda_program = new web3.PublicKey(pda_address);

  const [pda, bump_seed] = web3.PublicKey.findProgramAddressSync(
    [signer.publicKey.toBuffer(), new TextEncoder().encode("pda-account")],
    pda_program
  );

  console.log("pda address : ", pda.toBase58());

  const instruction = new web3.TransactionInstruction({
    keys: [
      {
        // 你的帐户将支付费用，因此会写入网络
        pubkey: signer.publicKey,
        isSigner: true,
        isWritable: false,
      },
      {
        // PDA将存储电影评论
        pubkey: pda,
        isSigner: false,
        isWritable: true,
      },
      {
        // 系统程序将用于创建PDA
        pubkey: web3.SystemProgram.programId,
        isSigner: false,
        isWritable: false,
      },
    ],
    // 这是最重要的部分！
    data: Buffer.from("transfer"),
    programId: pda_program,
  });

  const transaction = new web3.Transaction().add(instruction);
  transaction.recentBlockhash = (
    await connection.getLatestBlockhash()
  ).blockhash;
  transaction.feePayer = signer.publicKey;

  const transactionBuffer = transaction.serializeMessage();
  console.log(" Transaction Buffer : ", transactionBuffer);

  const xxx = web3.Transaction.from(Buffer.from(transactionBuffer));
  console.log("re deserialize : ", xxx);

  const signature = await web3.sendAndConfirmTransaction(
    connection,
    transaction,
    [signer]
  );

  // console.log(signature);

  // const signature = await web3.sendAndConfirmTransaction(
  //   connection,
  //   transaction,
  //   [signer]
  // );

  // console.log(signature);
}

async function pda_transfer(signer: web3.Keypair) {
  const pda_address = "EHCFCSPghqC1ivDFmfSTxW2AvPfQoKFyCvaaH9BfS9qi";
  let pda_program = new web3.PublicKey(pda_address);

  const [pda, bump_seed] = web3.PublicKey.findProgramAddressSync(
    [
      // signer.publicKey.toBuffer(),
      new TextEncoder().encode("creatordao-pda-vault"),
    ],
    pda_program
  );

  console.log("pda address : ", pda.toBase58());

  const instruction = new web3.TransactionInstruction({
    keys: [
      {
        // 你的帐户将支付费用，因此会写入网络
        pubkey: signer.publicKey,
        isSigner: true,
        isWritable: false,
      },
      {
        // PDA将存储电影评论
        pubkey: pda,
        isSigner: false,
        isWritable: true,
      },
      {
        // 系统程序将用于创建PDA
        pubkey: web3.SystemProgram.programId,
        isSigner: false,
        isWritable: false,
      },
    ],
    // 这是最重要的部分！
    data: Buffer.from("init"),
    programId: pda_program,
  });

  const transaction = new web3.Transaction().add(instruction);
  console.log("serialized: ", transaction.serializeMessage());
  let transactionBuffer = transaction.serializeMessage();
}

async function outSignaAndSend(messageBuffer: Buffer) {
  const secret = JSON.parse(process.env.PRIVATE_KEY ?? "") as number[];
  const secretKey = Uint8Array.from(secret);
  const signer = web3.Keypair.fromSecretKey(secretKey);
  console.log("message buffer is :-> ", messageBuffer);
  // console.log(process.env.PRIVATE_KEY);
  const tx = web3.Transaction.populate(web3.Message.from(messageBuffer));
  // console.log("tx is -> ", tx);
  tx.partialSign(signer);
  console.log("after sign  -> ", tx);

  const transaction = await connection.sendRawTransaction(tx.serialize());
  console.log("execute transaction  is -> ", transaction);

  // console.log("=======================", tx);
  // connection
  //   .sendRawTransaction(tx.serialize())
  //   .then((res) => {
  //     console.log(res);
  //   })
  //   .catch((err) => {
  //     console.log(err);
  //   });
  // console.log(mx);
  // console.log("execute transaction  is -> ", mx);
}

async function main() {
  const signer = await initializeKeypair(connection);
  // await ada_usage(signer);
  // await pda_usage(signer);
  // await pda_transfer(signer);

  const ix = web3.SystemProgram.transfer({
    fromPubkey: signer.publicKey,
    toPubkey: signer.publicKey,
    lamports: 100,
  });
  const tx = new web3.Transaction();
  tx.add(ix);

  const latestBlockhash = await connection.getLatestBlockhash();
  tx.recentBlockhash = latestBlockhash.blockhash;
  tx.feePayer = signer.publicKey;

  console.log("sign and execute out --------> ");
  // console.log(tx.serializeMessage());
  outSignaAndSend(tx.serializeMessage());

  // tx.sign(signer);
  // const transaction = await connection.sendRawTransaction(tx.serialize());
  // console.log(transaction);
}

main()
  .then(() => {
    console.log("Finished successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.log(error);
    process.exit(1);
  });
