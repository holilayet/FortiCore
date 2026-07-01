// scripts/api-server.js
const express = require("express");
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.json());

// Load contract ABI
const contractABI = require("../artifacts/contracts/Forticore.sol/Forticore.json").abi;

let contract;
let provider;
let signer;

async function initialize() {
    const network = process.env.NETWORK || "localhost";
    const rpcUrl = process.env.RPC_URL || "http://127.0.0.1:8545";
    
    provider = new ethers.JsonRpcProvider(rpcUrl);
    
    if (process.env.PRIVATE_KEY) {
        signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    } else {
        signer = await provider.getSigner();
    }
    
    const deploymentPath = path.join(__dirname, "../deployments", `${network}.json`);
    const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
    
    contract = new ethers.Contract(deployment.address, contractABI, signer);
    
    console.log("📝 Contract loaded at:", deployment.address);
}

// API Routes
app.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.post("/store", async (req, res) => {
    try {
        const { key, value } = req.body;
        const keyBytes = ethers.id(key);
        const valueBytes = ethers.toUtf8Bytes(value);
        
        const tx = await contract.store(keyBytes, valueBytes);
        const receipt = await tx.wait();
        
        res.json({
            success: true,
            transactionHash: tx.hash,
            blockNumber: receipt.blockNumber
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get("/retrieve/:key", async (req, res) => {
    try {
        const keyBytes = ethers.id(req.params.key);
        const valueBytes = await contract.retrieve(keyBytes);
        const value = ethers.toUtf8String(valueBytes);
        
        res.json({ key: req.params.key, value });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get("/contract", async (req, res) => {
    const address = await contract.getAddress();
    const owner = await contract.owner();
    
    res.json({ address, owner });
});

const PORT = process.env.PORT || 3000;

initialize().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 API Server running on http://localhost:${PORT}`);
    });
});
