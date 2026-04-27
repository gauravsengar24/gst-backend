import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Certificate, CertificateDocument } from '../certificates/schemas/certificate.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(Certificate.name) private certificateModel: Model<CertificateDocument>,
  ) {}

  async getCertificatesByWallet(walletAddress: string) {
    const certificates = await this.certificateModel.find({
      'candidates.walletAddress': { $regex: new RegExp(`^${walletAddress}$`, 'i') }
    }).exec();

    return certificates.map(cert => {
      const candidateData = cert.candidates?.find(
        c => c.walletAddress.toLowerCase() === walletAddress.toLowerCase()
      );

      return {
        _id: cert._id,
        title: cert.title,
        issuingAuthority: cert.issuingAuthority,
        issuedAt: cert.issuedAt,
        description: cert.description,
        eventId: cert.eventId,
        candidate: candidateData ? {
          name: candidateData.name,
          email: candidateData.email,
          walletAddress: candidateData.walletAddress,
          type: candidateData.type,
          ipfsUrl: candidateData.ipfsHash ? `https://gateway.pinata.cloud/ipfs/${candidateData.ipfsHash}` : null,
          metadataUrl: candidateData.metadataUrl,
          transactionHash: candidateData.transactionHash,
          tokenId: candidateData.tokenId,
        } : null
      };
    });
  }
}
