import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Certificate, CertificateDocument } from '../certificates/schemas/certificate.schema';
import { Event, EventDocument } from '../events/schemas/event.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(Certificate.name) private certificateModel: Model<CertificateDocument>,
    @InjectModel(Event.name) private eventModel: Model<EventDocument>,
  ) {}

  async getCertificatesByWallet(walletAddress: string) {
    const certificates = await this.certificateModel.find({
      'candidates.walletAddress': { $regex: new RegExp(`^${walletAddress}$`, 'i') }
    }).sort({ createdAt: -1 }).exec();

    const eventIds = [...new Set(certificates.map(cert => cert.eventId).filter((id): id is string => !!id))];
    const events = await this.eventModel.find({ _id: { $in: eventIds } }).exec();
    const eventMap = new Map(events.map(e => [e._id.toString(), e.name]));

    return certificates.map(cert => {
      const certObj = cert.toObject();
      const candidateData = certObj.candidates?.find(
        (c: any) => c.walletAddress.toLowerCase() === walletAddress.toLowerCase()
      );

      return {
        _id: certObj._id,
        title: certObj.title,
        issuingAuthority: certObj.issuingAuthority,
        issuedAt: certObj.issuedAt,
        description: certObj.description,
        eventId: certObj.eventId,
        eventName: (certObj.eventId && eventMap.has(certObj.eventId.toString())) ? eventMap.get(certObj.eventId.toString()) : 'N/A',
        candidate: candidateData ? this.formatCandidate(candidateData) : null
      };
    });
  }

  async getCertificateByTx(txUrl: string) {
    let queryHash = txUrl;
    if (txUrl.includes('/tx/')) {
      queryHash = txUrl.split('/tx/').pop() || txUrl;
    }
    const certificate = await this.certificateModel.findOne({
      'candidates.transactionHash': { $regex: new RegExp(queryHash, 'i') }
    }).exec();

    if (!certificate) {
      return null;
    }

    const candidateData = certificate.candidates?.find(
      c => c.transactionHash && c.transactionHash.toLowerCase().includes(queryHash.toLowerCase())
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
