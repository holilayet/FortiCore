// scripts/interact.js
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function loadDeployment() {
    const deploymentPath = path.join(
        __dirname, 
        "../deployments", 
        `${hre.network.name}.json`
    );
    
    if (!fs.existsSync(deploymentPath)) {
        throw new Error(`No deployment found for network: ${hre.network.name}`);
    }
    
    return JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
}

async function storeData(key, value) {
    const deployment = await loadDeployment();
    const contract = await hre.ethers.getContractAt(
        "Forticore", 
        deployment.address
    );
    
    const keyBytes = hre.ethers.id(key);
    const valueBytes = hre.ethers.toUtf8Bytes(value);
    
    console.log("📝 Storing data...");
    const tx = await contract.store(keyBytes, valueBytes);
    await tx.wait();
    
    console.log("✅ Data stored! Key:", key);
    console.log("📋 Transaction:", tx.hash);
}

async function retrieveData(key) {
    const deployment = await loadDeployment();
    const contract = await hre.ethers.getContractAt(
        "Forticore", 
        deployment.address
    );
    
    const keyBytes = hre.ethers.id(key);
    const valueBytes = await contract.retrieve(keyBytes);
    const value = hre.ethers.toUtf8String(valueBytes);
    
    console.log("📖 Retrieved data for key:", key);
    console.log("📄 Value:", value);
    
    return value;
}

async function main() {
    const args = process.argv.slice(2);
    const command = args[0];
    
    switch (command) {
        case "store":
            await storeData(args[1], args[2]);
            break;
        case "retrieve":
            await retrieveData(args[1]);
            break;
        default:
            console.log("Usage:");
            console.log("  npx hardhat run scripts/interact.js store <key> <value>");
            console.log("  npx hardhat run scripts/interact.js retrieve <key>");
    }
}

main().catch(console.error);
