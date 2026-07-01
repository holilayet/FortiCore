// test/Forticore.test.js
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Forticore", function () {
    let contract;
    let owner;
    let user1;
    
    beforeEach(async function () {
        [owner, user1] = await ethers.getSigners();
        const Contract = await ethers.getContractFactory("Forticore");
        contract = await Contract.deploy();
        await contract.waitForDeployment();
    });
    
    describe("Deployment", function () {
        it("Should set the right owner", async function () {
            expect(await contract.owner()).to.equal(owner.address);
        });
    });
    
    describe("Storage", function () {
        it("Should store and retrieve data", async function () {
            const key = ethers.id("testKey");
            const value = ethers.toUtf8Bytes("testValue");
            
            await contract.store(key, value);
            const retrieved = await contract.retrieve(key);
            
            expect(ethers.toUtf8String(retrieved)).to.equal("testValue");
        });
        
        it("Should emit DataStored event", async function () {
            const key = ethers.id("eventKey");
            const value = ethers.toUtf8Bytes("eventValue");
            
            await expect(contract.store(key, value))
                .to.emit(contract, "DataStored")
                .withArgs(key, owner.address);
        });
    });
});
