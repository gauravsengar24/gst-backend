import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';

@Injectable()
export class BlockchainService implements OnModuleInit {
  private provider!: ethers.JsonRpcProvider;
  private wallet!: ethers.Wallet;
  private contract!: ethers.Contract;

  private readonly ABI = [
    'function safeMint(address to, string memory uri) public',
    'function symbol() public view returns (string memory)',
    'function owner() public view returns (address)',
    'function bulkMint(address[] memory to, string[] memory uris) public'
  ];

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const rpcUrl = this.configService.get<string>('BLOCKCHAIN_RPC') || 'https://testnetrpc.mstblockchain.com';
    const privateKey = this.configService.get<string>('PRIVATE_KEY');
    const contractAddress = this.configService.get<string>('NFT_CONTRACT_ADDRESS');

    if (!privateKey || !contractAddress) {
      console.warn('PRIVATE_KEY or NFT_CONTRACT_ADDRESS is missing in .env. Blockchain minting will not work.');
      return;
    }

    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.wallet = new ethers.Wallet(privateKey, this.provider);
    this.contract = new ethers.Contract(contractAddress, this.ABI, this.wallet);
  }

  async mintCertificate(to: string, tokenId: number, tokenURI: string) {
    if (!this.contract) {
      throw new Error('Blockchain service not initialized (missing private key?)');
    }

    try {
      const nonce = await this.wallet.getNonce('pending');
      
      const tx = await this.contract.safeMint(to, tokenURI, {
        nonce: nonce
      });
      
      const receipt = await tx.wait();
      return receipt.hash;
    } catch (error) {
      console.error('Minting failed:', error);
      throw error;
    }
  }

  async bulkMint(to: string[], uris: string[]) {
    if (!this.contract) {
      throw new Error('Blockchain service not initialized');
    }
    try {
      const nonce = await this.wallet.getNonce('pending');
      const tx = await this.contract.bulkMint(to, uris, { nonce });
      const receipt = await tx.wait();
      return receipt.hash;
    } catch (error) {
      console.error('Bulk minting failed:', error);
      throw error;
    }
  }
}
