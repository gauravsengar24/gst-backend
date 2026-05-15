import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Certificate, CertificateDocument } from '../certificates/schemas/certificate.schema';
import { Event, EventDocument } from '../events/schemas/event.schema';
import { BlockchainService } from '../blockchain/blockchain.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(Certificate.name) private certificateModel: Model<CertificateDocument>,
    @InjectModel(Event.name) private eventModel: Model<EventDocument>,
    private blockchainService: BlockchainService,
  ) {}

  async getCertificatesByWallet(walletAddress: string) {
    const certificates = await this.certificateModel.find({
      'candidates.walletAddress': { $regex: new RegExp(`^${walletAddress}$`, 'i') }
    }).sort({ createdAt: -1 }).exec();

    const eventIds = [...new Set(certificates.map(cert => cert.eventId).filter((id): id is string => !!id))];
    const events = await this.eventModel.find({ _id: { $in: eventIds } }).exec();
    const eventMap = new Map(events.map(e => [e._id.toString(), e.name]));

    const result: any[] = [];

    certificates.forEach(cert => {
      const certObj = cert.toObject();
      const matchingCandidates = certObj.candidates?.filter(
        (c: any) => c.walletAddress.toLowerCase() === walletAddress.toLowerCase()
      ) || [];

      matchingCandidates.forEach((candidate: any) => {
        result.push({
          _id: certObj._id,
          title: certObj.title,
          issuingAuthority: certObj.issuingAuthority,
          issuedAt: certObj.issuedAt,
          description: certObj.description,
          level: certObj.level,
          creator: certObj.creator,
          eventId: certObj.eventId,
          eventName: (certObj.eventId && eventMap.has(certObj.eventId.toString())) ? eventMap.get(certObj.eventId.toString()) : 'N/A',
          candidate: this.formatCandidate(candidate)
        });
      });
    });

    return result;
  }

  async getCertificateByTx(txUrl: string) {
    let queryHash = txUrl;
    if (txUrl.includes('/tx/')) {
      queryHash = txUrl.split('/tx/').pop() || txUrl;
    }

    const blockchainRecipient = await this.blockchainService.getTransactionRecipient(queryHash);

    const dbQuery: any = {
      'candidates.transactionHash': { $regex: new RegExp(queryHash, 'i') }
    };

    if (blockchainRecipient) {
      if (Array.isArray(blockchainRecipient)) {
        dbQuery['candidates.walletAddress'] = { 
          $in: blockchainRecipient.map(addr => new RegExp(`^${addr}$`, 'i')) 
        };
      } else {
        dbQuery['candidates.walletAddress'] = { $regex: new RegExp(`^${blockchainRecipient}$`, 'i') };
      }
    }

    const certificate = await this.certificateModel.findOne(dbQuery).exec();

    if (!certificate) {
      return null;
    }

    const candidateData = certificate.candidates?.find(
      c => {
        const hashMatch = c.transactionHash && c.transactionHash.toLowerCase().includes(queryHash.toLowerCase());
        let walletMatch = true;
        if (blockchainRecipient) {
          if (Array.isArray(blockchainRecipient)) {
            walletMatch = blockchainRecipient.some(addr => addr.toLowerCase() === c.walletAddress.toLowerCase());
          } else {
            walletMatch = blockchainRecipient.toLowerCase() === c.walletAddress.toLowerCase();
          }
        }
        return hashMatch && walletMatch;
      }
    );

    let eventName = 'N/A';
    if (certificate.eventId) {
      const event = await this.eventModel.findById(certificate.eventId).exec();
      if (event) eventName = event.name;
    }

    return {
      _id: certificate._id,
      title: certificate.title,
      issuingAuthority: certificate.issuingAuthority,
      issuedAt: certificate.issuedAt,
      description: certificate.description,
      level: certificate.level,
      creator: certificate.creator,
      eventId: certificate.eventId,
      eventName,
      candidate: candidateData ? this.formatCandidate(candidateData) : null
    };
  }

  private formatCandidate(candidate: any) {
    return {
      name: candidate.name,
      email: candidate.email,
      walletAddress: candidate.walletAddress,
      type: candidate.type,
      ipfsUrl: candidate.ipfsHash ? `https://gateway.pinata.cloud/ipfs/${candidate.ipfsHash}` : null,
      metadataUrl: candidate.metadataUrl,
      transactionHash: candidate.transactionHash,
      tokenId: candidate.tokenId,
    };
  }
}
