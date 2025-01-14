import { 
    PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID
} from '@metaplex-foundation/mpl-token-metadata';
import {
    Connection,
    Keypair,
    PublicKey,
    SystemProgram,
    SYSVAR_RENT_PUBKEY,
    TransactionInstruction,
    Transaction,
    sendAndConfirmTransaction,
} from '@solana/web3.js';
import {
    ASSOCIATED_TOKEN_PROGRAM_ID,
    getAssociatedTokenAddress,
    TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { Buffer } from "buffer";
import { 
    CreateTokenArgs,
    MintToArgs,
    NftMinterInstruction,
} from './instructions';


function createKeypairFromFile(path: string): Keypair {
    return Keypair.fromSecretKey(
        Buffer.from(JSON.parse(require('fs').readFileSync(path, "utf-8")))
    )
};


describe("NFT Minter", async () => {

    // const connection = new Connection(`http://localhost:8899`, 'confirmed');
    const connection = new Connection(`https://api.devnet.solana.com/`, 'confirmed');
    const payer = createKeypairFromFile(require('os').homedir() + '/.config/solana/id.json');
    const program = createKeypairFromFile('./program/target/deploy/program-keypair.json');

    const mintKeypair: Keypair = Keypair.generate();

    it("Create an NFT!", async () => {

        const metadataAddress = (PublicKey.findProgramAddressSync(
            [
              Buffer.from("metadata"),
              TOKEN_METADATA_PROGRAM_ID.toBuffer(),
              mintKeypair.publicKey.toBuffer(),
            ],
            TOKEN_METADATA_PROGRAM_ID
        ))[0];
        
        const instructionData = new CreateTokenArgs({
            instruction: NftMinterInstruction.Create,
            nft_title: "Homer NFT",
            nft_symbol: "HOMR",
            nft_uri: "https://raw.githubusercontent.com/solana-developers/program-examples/new-examples/tokens/tokens/.assets/nft.json",
        });

        let ix = new TransactionInstruction({
            keys: [
                { pubkey: mintKeypair.publicKey, isSigner: true, isWritable: true },            // Mint account
                { pubkey: payer.publicKey, isSigner: false, isWritable: true },                 // Mint authority account
                { pubkey: metadataAddress, isSigner: false, isWritable: true },                 // Metadata account
                { pubkey: payer.publicKey, isSigner: true, isWritable: true },                  // Payer
                { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },             // Rent account
                { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },        // System program
                { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },               // Token program
                { pubkey: TOKEN_METADATA_PROGRAM_ID, isSigner: false, isWritable: false },      // Token metadata program
            ],
            programId: program.publicKey,
            data: instructionData.toBuffer(),
        });

        const sx = await sendAndConfirmTransaction(
            connection, 
            new Transaction().add(ix),
            [payer, mintKeypair]
        );

        console.log("Success!");
        console.log(`   Mint Address: ${mintKeypair.publicKey}`);
        console.log(`   Tx Signature: ${sx}`);
    });

    it("Mint the NFT to your wallet!", async () => {

        const metadataAddress = (PublicKey.findProgramAddressSync(
            [
              Buffer.from("metadata"),
              TOKEN_METADATA_PROGRAM_ID.toBuffer(),
              mintKeypair.publicKey.toBuffer(),
            ],
            TOKEN_METADATA_PROGRAM_ID
        ))[0];

        const editionAddress = (PublicKey.findProgramAddressSync(
            [
              Buffer.from("metadata"),
              TOKEN_METADATA_PROGRAM_ID.toBuffer(),
              mintKeypair.publicKey.toBuffer(),
              Buffer.from("edition"),
            ],
            TOKEN_METADATA_PROGRAM_ID
        ))[0];

        const associatedTokenAccountAddress = await getAssociatedTokenAddress(
            mintKeypair.publicKey,
            payer.publicKey,
        );
        
        const instructionData = new MintToArgs({
            instruction: NftMinterInstruction.Mint,
        });

        let ix = new TransactionInstruction({
            keys: [
                { pubkey: mintKeypair.publicKey, isSigner: false, isWritable: true },           // Mint account
                { pubkey: metadataAddress, isSigner: false, isWritable: true },                 // Metadata account
                { pubkey: editionAddress, isSigner: false, isWritable: true },                  // Edition account
                { pubkey: payer.publicKey, isSigner: false, isWritable: true },                 // Mint authority account
                { pubkey: associatedTokenAccountAddress, isSigner: false, isWritable: true },   // ATA
                { pubkey: payer.publicKey, isSigner: true, isWritable: true },                  // Payer
                { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },             // Rent account
                { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },        // System program
                { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },               // Token program
                { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },    // Associated token program
                { pubkey: TOKEN_METADATA_PROGRAM_ID, isSigner: false, isWritable: false },      // Token metadata program
            ],
            programId: program.publicKey,
            data: instructionData.toBuffer(),
        });

        const sx = await sendAndConfirmTransaction(
            connection, 
            new Transaction().add(ix),
            [payer],
        );

        console.log("Success!");
        console.log(`   ATA Address: ${associatedTokenAccountAddress}`);
        console.log(`   Tx Signature: ${sx}`);
  });
});