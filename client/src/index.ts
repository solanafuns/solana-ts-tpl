import { initializeKeypair } from "./initializeKeypair";
import * as web3 from "@solana/web3.js";
import { Movie } from "./movie";

// const connection = new web3.Connection(web3.clusterApiUrl("devnet"));
const connection = new web3.Connection("http://localhost:8899");
const program = new web3.PublicKey(
  "2nStmaWKf1dShpT8nvKicx6KL55jB9SdZbTwLwY4JaN3"
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
        programId: new web3.PublicKey(
          "HwFF1oi1uD14nRbDkrtrjsJqzs45WkQ9eP8YakAxG3PG"
        ),
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
    data: Buffer.from("hello this is creator world!!!"),
    programId: pda_program,
  });

  const transaction = new web3.Transaction().add(instruction);

  const signature = await web3.sendAndConfirmTransaction(
    connection,
    transaction,
    [signer]
  );

  console.log(signature);
}

async function main() {
  const signer = await initializeKeypair(connection);
  const info = await connection.getAccountInfo(program);
  console.log(info);
  // await ada_usage(signer);
  await pda_usage(signer);
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
