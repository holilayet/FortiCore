// scripts/frontend-integration.js
/**
 * Frontend Integration Example
 * This file demonstrates how to integrate Forticore with a web frontend
 */

// For React/Vue/Angular applications
export class ForticoreClient {
    constructor(provider, contractAddress) {
        this.provider = provider;
        this.contractAddress = contractAddress;
        this.contractABI = [
            "function store(bytes32 key, bytes calldata value) external",
            "function retrieve(bytes32 key) external view returns (bytes)",
            "function owner() external view returns (address)",
            "event DataStored(bytes32 indexed key, address indexed sender)"
        ];
    }
    
    async connect(signer) {
        const { ethers } = await import("ethers");
        this.contract = new ethers.Contract(
            this.contractAddress,
            this.contractABI,
            signer
        );
        return this;
    }
    
    async store(key, value) {
        const { ethers } = await import("ethers");
        const keyBytes = ethers.id(key);
        const valueBytes = ethers.toUtf8Bytes(value);
        
        const tx = await this.contract.store(keyBytes, valueBytes);
        return await tx.wait();
    }
    
    async retrieve(key) {
        const { ethers } = await import("ethers");
        const keyBytes = ethers.id(key);
        const valueBytes = await this.contract.retrieve(keyBytes);
        return ethers.toUtf8String(valueBytes);
    }
    
    async getOwner() {
        return await this.contract.owner();
    }
    
    onDataStored(callback) {
        this.contract.on("DataStored", (key, sender, event) => {
            callback({ key, sender, event });
        });
    }
}

// Usage example with ethers.js and MetaMask
async function connectWallet() {
    if (typeof window.ethereum === "undefined") {
        throw new Error("MetaMask not installed");
    }
    
    const { ethers } = await import("ethers");
    await window.ethereum.request({ method: "eth_requestAccounts" });
    
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    
    return { provider, signer };
}

// React Hook example
export function useContract(contractAddress) {
    const [client, setClient] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    useEffect(() => {
        async function init() {
            try {
                const { provider, signer } = await connectWallet();
                const contractClient = new ForticoreClient(provider, contractAddress);
                await contractClient.connect(signer);
                setClient(contractClient);
            } catch (err) {
                setError(err);
            } finally {
                setLoading(false);
            }
        }
        init();
    }, [contractAddress]);
    
    return { client, loading, error };
}
