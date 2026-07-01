#!/usr/bin/env node
// scripts/cli.js
const { program } = require("commander");
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

const contractABI = require("../artifacts/contracts/Forticore.sol/Forticore.json").abi;

program
    .name("forticore-cli")
    .description("CLI tool for Forticore smart contract")
    .version("1.0.0");

async function getContract(network) {
    const rpcUrl = process.env.RPC_URL || "http://127.0.0.1:8545";
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    
    let signer;
    if (process.env.PRIVATE_KEY) {
        signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    } else {
        signer = await provider.getSigner();
    }
    
    const deploymentPath = path.join(__dirname, "../deployments", `${network}.json`);
    const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
    
    return new ethers.Contract(deployment.address, contractABI, signer);
}

program
    .command("store <key> <value>")
    .description("Store a key-value pair")
    .option("-n, --network <network>", "Network name", "localhost")
    .action(async (key, value, options) => {
        try {
            const contract = await getContract(options.network);
            const keyBytes = ethers.id(key);
            const valueBytes = ethers.toUtf8Bytes(value);
            
            console.log("📝 Storing data...");
            const tx = await contract.store(keyBytes, valueBytes);
            await tx.wait();
            
            console.log("✅ Stored successfully!");
            console.log("📋 TX:", tx.hash);
        } catch (error) {
            console.error("❌ Error:", error.message);
            process.exit(1);
        }
    });

program
    .command("retrieve <key>")
    .description("Retrieve a value by key")
    .option("-n, --network <network>", "Network name", "localhost")
    .action(async (key, options) => {
        try {
            const contract = await getContract(options.network);
            const keyBytes = ethers.id(key);
            const valueBytes = await contract.retrieve(keyBytes);
            const value = ethers.toUtf8String(valueBytes);
            
            console.log("📖 Key:", key);
            console.log("📄 Value:", value);
        } catch (error) {
            console.error("❌ Error:", error.message);
            process.exit(1);
        }
    });

program
    .command("info")
    .description("Get contract information")
    .option("-n, --network <network>", "Network name", "localhost")
    .action(async (options) => {
        try {
            const deploymentPath = path.join(__dirname, "../deployments", `${options.network}.json`);
            const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
            
            const contract = await getContract(options.network);
            const owner = await contract.owner();
            
            console.log("📋 Contract Info:");
            console.log("   Address:", deployment.address);
            console.log("   Owner:", owner);
            console.log("   Network:", options.network);
            console.log("   Deployed:", deployment.timestamp);
        } catch (error) {
            console.error("❌ Error:", error.message);
            process.exit(1);
        }
    });

program.parse();
