#!/bin/bash


sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
export PATH="/home/runner/.local/share/solana/install/active_release/bin:$PATH"
export PATH="/home/codespace/.local/share/solana/install/active_release/bin:$PATH"
echo '[68,10,208,237,211,37,104,127,47,210,78,168,2,93,190,93,65,224,217,212,154,146,39,230,135,133,66,208,228,122,46,88,47,147,13,162,246,100,95,97,121,104,13,135,13,15,104,102,125,232,69,243,26,135,112,47,246,84,53,241,183,229,57,71]' > ~/.config/solana/id.json 
solana config set --url https://api.devnet.solana.com
solana balance
solana airdrop 2
solana balance