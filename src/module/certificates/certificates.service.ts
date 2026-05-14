import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as PDFDocument from 'pdfkit';
import { CreateCertificateDto } from './dto/create-certificate.dto';
import { UpdateCertificateDto } from './dto/update-certificate.dto';
import { CreateCandidateDto } from '../candidates/dto/create-candidate.dto';
import { Certificate, CertificateDocument, CertificateType } from './schemas/certificate.schema';
import { MintLog, MintLogDocument } from './schemas/mint-log.schema';
import { Event, EventDocument } from '../events/schemas/event.schema';
import { MetadataService } from '../metadata/metadata.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import * as fs from 'fs';
import * as path from 'path';
import * as csv from 'csv-parser';
import { Readable } from 'stream';
import { isAddress, getAddress } from 'ethers';

@Injectable()
export class CertificatesService {
  constructor(
    @InjectModel(Certificate.name) private certificateModel: Model<CertificateDocument>,
    @InjectModel(MintLog.name) private mintLogModel: Model<MintLogDocument>,
    @InjectModel(Event.name) private eventModel: Model<EventDocument>,
    private metadataService: MetadataService,
    private blockchainService: BlockchainService,
  ) {}

  async create(createCertificateDto: CreateCertificateDto, mintType: 'single' | 'bulk' = 'single') {
    const { candidates = [], description, issuingAuthority, ...rest } = createCertificateDto;

    for (const candidate of candidates) {
      if (candidate.walletAddress) {
        const wallet = String(candidate.walletAddress);
        const lowerWallet = wallet.toLowerCase();
        if (isAddress(wallet)) {
          candidate.walletAddress = getAddress(wallet);
        } else if (isAddress(lowerWallet)) {
          candidate.walletAddress = getAddress(lowerWallet);
        } else {
          throw new BadRequestException(`Invalid wallet address format for candidate ${candidate.name}: ${wallet}`);
        }
      }
    }
    
    // if (rest.eventId) {
    //   const existingCertificate = await this.certificateModel.findOne({ eventId: rest.eventId }).exec();
    //   if (existingCertificate) {
    //     if (candidates.length > 0) {
    //       const updatedCandidates = await this.generateLocalImages(existingCertificate, candidates);
          
    //       await this.certificateModel.findByIdAndUpdate(
    //         existingCertificate._id,
    //         { 
    //           $push: { candidates: { $each: updatedCandidates } },
    //           $setOnInsert: { creator: this.blockchainService.getMinterAddress() }
    //         },
    //         { new: true, upsert: false }
    //       ).exec();

    //       if (!existingCertificate.creator) {
    //         await this.certificateModel.findByIdAndUpdate(existingCertificate._id, {
    //           $set: { creator: this.blockchainService.getMinterAddress() }
    //         });
    //       }

    //       return this.uploadToIpfs(existingCertificate._id.toString(), mintType);
    //     }
    //     return existingCertificate;
    //   }
    // }

    const createdCertificate = new this.certificateModel({
      ...rest,
      description,
      issuingAuthority,
      candidates,
      creator: this.blockchainService.getMinterAddress()
    });
    
    const savedCertificate = await createdCertificate.save();

    if (savedCertificate.candidates && savedCertificate.candidates.length > 0) {
      const updatedCandidates = await this.generateLocalImages(savedCertificate, savedCertificate.candidates);
      
      await this.certificateModel.findByIdAndUpdate(
        savedCertificate._id,
        { $set: { candidates: updatedCandidates } },
        { returnDocument: 'after' }
      ).exec();

      return this.uploadToIpfs(savedCertificate._id.toString(), mintType);
    }

    return savedCertificate;
  }

  async uploadToIpfs(id: string, mintType: 'single' | 'bulk' = 'single') {
    const certificate = await this.certificateModel.findById(id).exec();
    if (!certificate) {
      throw new NotFoundException('Certificate not found');
    }

    const certObjectId = new Types.ObjectId(id);
    const updatedCandidates: any[] = [];

    for (const candidate of certificate.candidates || []) {
      // Already minted or no local image — skip
      if (!candidate.localImagePath || candidate.ipfsHash) {
        updatedCandidates.push(candidate);
        await this.mintLogModel.create({
          certificateId: certObjectId,
          certificateTitle: certificate.title,
          eventId: certificate.eventId,
          mintType,
          candidateName: candidate.name,
          candidateEmail: candidate.email,
          walletAddress: candidate.walletAddress,
          status: candidate.transactionHash ? 'success' : 'skipped',
          ipfsImageHash: candidate.ipfsHash,
          ipfsMetadataUrl: candidate.metadataUrl,
          tokenId: candidate.tokenId,
          transactionHash: candidate.transactionHash,
        });
        continue;
      }
      
      try {
        const imagePath = path.join(process.cwd(), candidate.localImagePath);
        if (!fs.existsSync(imagePath)) {
          console.error(`Local image not found for upload: ${imagePath}`);
          updatedCandidates.push(candidate);
          await this.mintLogModel.create({
            certificateId: certObjectId,
            certificateTitle: certificate.title,
            eventId: certificate.eventId,
            mintType,
            candidateName: candidate.name,
            candidateEmail: candidate.email,
            walletAddress: candidate.walletAddress,
            status: 'failed',
            errorMessage: `Local image file not found at path: ${imagePath}`,
          });
          continue;
        }
        
        const imageBuffer = fs.readFileSync(imagePath);

        const ipfsData = await this.metadataService.uploadToIpfs({
          name: candidate.name,
          description: certificate.description || '',
          date: certificate.issuedAt.toISOString().split('T')[0],
          issuedBy: certificate.issuingAuthority,
          title: certificate.title,
          type: candidate.type,
          imageBuffer,
          walletAddress: candidate.walletAddress,
          skipSave: true,
        });

        let txHash = '';
        let tokenId = Math.floor(Date.now() / 1000) + Math.floor(Math.random() * 1000);

        if (candidate.walletAddress) {
          txHash = await this.blockchainService.mintCertificate(
            candidate.walletAddress,
            tokenId,
            ipfsData.metadataUrl
          );
          // Wait 3 sec
          await new Promise(resolve => setTimeout(resolve, 3000));
        }

        const mintedCandidate = {
          name: candidate.name,
          email: candidate.email,
          walletAddress: candidate.walletAddress,
          type: candidate.type,
          localImagePath: candidate.localImagePath,
          ipfsHash: ipfsData.imageHash,
          metadataUrl: ipfsData.metadataUrl,
          tokenId: txHash ? tokenId : undefined,
          transactionHash: txHash ? `https://testnet.mstscan.com/tx/${txHash}` : undefined,
        };

        updatedCandidates.push(mintedCandidate);

        // ── Success log ─────────────────────────────────────────────────────
        await this.mintLogModel.create({
          certificateId: certObjectId,
          certificateTitle: certificate.title,
          eventId: certificate.eventId,
          mintType,
          candidateName: candidate.name,
          candidateEmail: candidate.email,
          walletAddress: candidate.walletAddress,
          status: 'success',
          ipfsImageHash: ipfsData.imageHash,
          ipfsMetadataUrl: ipfsData.metadataUrl,
          tokenId: txHash ? tokenId : undefined,
          transactionHash: mintedCandidate.transactionHash,
        });

      } catch (error) {
        await this.certificateModel.findByIdAndUpdate(
          id,
          { $set: { candidates: [...updatedCandidates, ...(certificate.candidates || []).slice(updatedCandidates.length)] } },
          { returnDocument: 'after' }
        ).exec();

        // ── Failure log ──────────────────────────────────────────────────────
        await this.mintLogModel.create({
          certificateId: certObjectId,
          certificateTitle: certificate.title,
          eventId: certificate.eventId,
          mintType,
          candidateName: candidate.name,
          candidateEmail: candidate.email,
          walletAddress: candidate.walletAddress,
          status: 'failed',
          errorMessage: (error as any).message,
        });
        
        console.error(`Failed to process candidate ${candidate.name}:`, error);
        throw new BadRequestException(`Processing failed at candidate ${candidate.name}: ${(error as any).message}`);
      }
    }

    return this.certificateModel.findByIdAndUpdate(
      id,
      { $set: { candidates: updatedCandidates } },
      { returnDocument: 'after' }
    ).exec();
  }

  private async generateLocalImages(certificate: CertificateDocument, candidates: any[]) {
    let baseImagePath: string | undefined;
    if (certificate.eventId && Types.ObjectId.isValid(certificate.eventId)) {
      const event = await this.eventModel.findById(certificate.eventId).exec();
      if (event && event.baseCertificatePath) {
        baseImagePath = event.baseCertificatePath;
      }
    }

    return Promise.all(
      candidates.map(async (candidate) => {
        if (!candidate.name) return candidate;
        
        if (candidate.localImagePath) {
          return candidate;
        }

        const imageBuffer = await this.metadataService.generateCertificateImage(candidate.name, baseImagePath);
        const localImagePath = await this.saveCertificateImage(certificate._id.toString(), candidate.name, imageBuffer);
        
        const candidateData = typeof candidate.toObject === 'function' ? candidate.toObject() : candidate;
        
        return { 
          ...candidateData,
          localImagePath
        };
      })
    );
  }

  private async saveCertificateImage(id: string, name: string, buffer: Buffer): Promise<string> {
    const uploadDir = path.join(process.cwd(), 'uploads/certificates', id);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    const fileName = `${name.replace(/\s+/g, '_')}_${Date.now()}.jpg`;
    const filePath = path.join(uploadDir, fileName);
    fs.writeFileSync(filePath, buffer);
    return `uploads/certificates/${id}/${fileName}`;
  }

  async findAll(page: number = 1, limit: number = 10, search?: string) {
    const skip = (page - 1) * limit;
    const query: any = {};

    if (search) {
      query.$or = [
        { 'candidates.name': { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } },
        { issuingAuthority: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const [data, total] = await Promise.all([
      this.certificateModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      this.certificateModel.countDocuments(query)
    ]);

    const eventIds = [...new Set(data.map(cert => cert.eventId).filter((id): id is string => !!id && Types.ObjectId.isValid(id)))];
    let eventMap = new Map();
    if (eventIds.length > 0) {
      const events = await this.eventModel.find({ _id: { $in: eventIds } }).exec();
      eventMap = new Map(events.map(e => [e._id.toString(), e.name]));
    }

    const resultData = data.map(cert => {
      const certObj = cert.toObject();
      const eventIdStr = certObj.eventId?.toString();
      if (eventIdStr && eventMap.has(eventIdStr)) {
        (certObj as any).eventName = eventMap.get(eventIdStr);
      }
      
      if (certObj.candidates && Array.isArray(certObj.candidates)) {
        certObj.candidates.sort((a: any, b: any) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : (a._id ? parseInt(a._id.toString().substring(0, 8), 16) * 1000 : 0);
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : (b._id ? parseInt(b._id.toString().substring(0, 8), 16) * 1000 : 0);
          return dateB - dateA; // Sort descending (latest first)
        });
      }
      
      return certObj;
    });

    return {
      data: resultData,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async findOne(id: string) {
    const certificate = await this.certificateModel.findOne({ '_id': id }).exec();

    if (!certificate) {
      throw new NotFoundException(`Certificate with id ${id} not found`);
    }

    const certObj = certificate.toObject();
    if (certObj.eventId && Types.ObjectId.isValid(certObj.eventId)) {
      const event = await this.eventModel.findById(certObj.eventId).exec();
      if (event) {
        (certObj as any).eventName = event.name;
      }
    }

    return certObj;
  }

  async update(id: string, updateCertificateDto: UpdateCertificateDto) {
    const updated = await this.certificateModel.findByIdAndUpdate(id, updateCertificateDto, { new: true }).exec();

    if (!updated) {
      throw new NotFoundException(`Certificate with id ${id} not found`);
    }

    return updated;
  }

  async remove(id: string) {
    const deleted = await this.certificateModel.findByIdAndDelete(id).exec();

    if (!deleted) {
      throw new NotFoundException(`Certificate with id ${id} not found`);
    }

    return { message: 'Certificate deleted successfully', success: true };
  }

  async addCandidates(id: string, candidates: CreateCandidateDto[]) {
    // Validate and normalize wallet addresses
    for (const candidate of candidates) {
      if (candidate.walletAddress) {
        const wallet = String(candidate.walletAddress);
        const lowerWallet = wallet.toLowerCase();
        if (isAddress(wallet)) {
          candidate.walletAddress = getAddress(wallet);
        } else if (isAddress(lowerWallet)) {
          candidate.walletAddress = getAddress(lowerWallet);
        } else {
          throw new BadRequestException(`Invalid wallet address format for candidate ${candidate.name}: ${wallet}`);
        }
      }
    }

    const certificate = await this.certificateModel.findById(id).exec();
    if (!certificate) {
      throw new NotFoundException('Certificate not found');
    }

    const updatedCandidates = await this.generateLocalImages(certificate, candidates);
    
    await this.certificateModel.findByIdAndUpdate(
      id,
      { $push: { candidates: { $each: updatedCandidates } } },
      { new: true }
    ).exec();

    return this.uploadToIpfs(id, 'single');
  }

  async generatePdf(id: string, candidateName?: string) {
    const certificate = await this.certificateModel.findById(id).exec();
    if (!certificate) {
      throw new NotFoundException('Certificate not found');
    }

    const doc = new PDFDocument({
      layout: 'landscape',
      size: 'A4',
    });

    const candidate = certificate.candidates?.find(c => c.name === candidateName);
    const type = candidate?.type || CertificateType.Participation;
    const name = candidateName || 'Recipient';

    doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40).stroke();

    doc.fontSize(40).text('CERTIFICATE', { align: 'center' }).moveDown();
    doc.fontSize(20).text('OF ' + type.toUpperCase(), { align: 'center' }).moveDown();
    
    doc.fontSize(15).text('This is to certify that', { align: 'center' }).moveDown();
    
    doc.fontSize(30).fillColor('#2c3e50').text(name, { align: 'center' }).moveDown();
    
    doc.fontSize(15).fillColor('black').text('has successfully completed', { align: 'center' }).moveDown();
    
    doc.fontSize(20).text(certificate.title, { align: 'center' }).moveDown();
    
    doc.fontSize(12).text(certificate.description || '', { align: 'center' }).moveDown(2);
    
    doc.fontSize(15).text('Issued by: ' + certificate.issuingAuthority, { align: 'center' });
    doc.text('Date: ' + new Date(certificate.issuedAt).toLocaleDateString(), { align: 'center' });

    doc.end();
    return doc;
  }

  async getLocalCertificatePath(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid ID format');
    }

    let certificate = await this.certificateModel.findOne({
      'candidates._id': id
    }).exec();

    console.log(certificate);

    let candidate: any;

    if (certificate) {
      candidate = certificate.candidates?.find(c => (c as any)._id.toString() === id);
    } else {
      // Try treating the id as a certificate ID and download the first candidate
      certificate = await this.certificateModel.findById(id).exec();
      if (certificate && certificate.candidates && certificate.candidates.length > 0) {
        candidate = certificate.candidates[0];
      }
    }

    if (!certificate || !candidate) {
      throw new NotFoundException('Candidate or Certificate not found');
    }

    let fullPath = candidate.localImagePath ? path.join(process.cwd(), candidate.localImagePath) : null;

    if (!fullPath || !fs.existsSync(fullPath)) {
      // The file doesn't exist, we need to re-generate it
      let baseImagePath: string | undefined;
      if (certificate.eventId && Types.ObjectId.isValid(certificate.eventId.toString())) {
        const event = await this.eventModel.findById(certificate.eventId).exec();
        if (event && event.baseCertificatePath) {
          baseImagePath = event.baseCertificatePath;
        }
      }

      const imageBuffer = await this.metadataService.generateCertificateImage(candidate.name, baseImagePath);
      const newLocalImagePath = await this.saveCertificateImage(certificate._id.toString(), candidate.name, imageBuffer);
      
      // Update the database with the new path
      await this.certificateModel.findOneAndUpdate(
        { 'candidates._id': candidate._id },
        { $set: { 'candidates.$.localImagePath': newLocalImagePath } }
      ).exec();

      fullPath = path.join(process.cwd(), newLocalImagePath);
    }

    return fullPath;
  }

  private async processSingleCertificate(candidate: CreateCandidateDto, createCertificateDto: CreateCertificateDto) {
    let baseImagePath: string | undefined;
    if (createCertificateDto.eventId && Types.ObjectId.isValid(createCertificateDto.eventId)) {
      const event = await this.eventModel.findById(createCertificateDto.eventId).exec();
      if (event && event.baseCertificatePath) {
        baseImagePath = event.baseCertificatePath;
      }
    }

    // 1. Generate Image Buffer
    const imageBuffer = await this.metadataService.generateCertificateImage(candidate.name, baseImagePath);

    // 2. Upload to IPFS
    const ipfsData = await this.metadataService.uploadToIpfs({
      name: candidate.name,
      description: createCertificateDto.description || '',
      date: createCertificateDto.issuedAt ? new Date(createCertificateDto.issuedAt).toISOString() : new Date().toISOString(),
      issuedBy: createCertificateDto.issuingAuthority,
      title: createCertificateDto.title,
      type: candidate.type,
      imageBuffer,
      walletAddress: candidate.walletAddress,
      skipSave: true,
    });

    return {
      ...candidate,
      ipfsHash: ipfsData.imageHash,
      metadataUrl: ipfsData.metadataUrl,
    };
  }

  async createWithCsv(createCertificateDto: CreateCertificateDto, file: Express.Multer.File, mintType: 'single' | 'bulk' = 'single') {
    const candidates: CreateCandidateDto[] = [];
    const requiredHeaders = ['name', 'walletAddress'];
    let headers: string[] = [];
    
    if (!file) {
      throw new BadRequestException('CSV file is required');
    }

    if (!createCertificateDto.bulkCount) {
       throw new BadRequestException('bulkCount is required for CSV upload');
    }

    // Parse CSV file
    const stream = Readable.from(file.buffer);
    await new Promise((resolve, reject) => {
      stream
        .pipe(csv())
        .on('headers', (headerList) => {
          headers = headerList;
          const missingHeaders = requiredHeaders.filter(h => 
            !headers.some(actualHeader => actualHeader.toLowerCase() === h.toLowerCase())
          );
          if (missingHeaders.length > 0) {
            reject(new BadRequestException(`Missing required columns: ${missingHeaders.join(', ')}`));
          }
        })
        .on('data', (data) => {
          let wallet = data.walletAddress || data.WalletAddress || data.wallet || '';
          if (wallet) {
            const strWallet = String(wallet);
            const lowerWallet = strWallet.toLowerCase();
            if (isAddress(strWallet)) {
              wallet = getAddress(strWallet);
            } else if (isAddress(lowerWallet)) {
              wallet = getAddress(lowerWallet);
            } else {
              reject(new BadRequestException(`Invalid wallet address format for candidate ${data.name || data.Name}: ${strWallet}`));
              return;
            }
          }
          
          const parsedType = data.type || data.Type || CertificateType.Participation;
          if (!Object.values(CertificateType).includes(parsedType as CertificateType)) {
            reject(new BadRequestException(`Invalid certificate type '${parsedType}' for candidate ${data.name || data.Name || data.candidateName}. Must be one of: ${Object.values(CertificateType).join(', ')}`));
            return;
          }
          
          const candidate: CreateCandidateDto = {
            name: data.name || data.Name || data.candidateName || '',
            email: data.email || data.Email || '',
            walletAddress: wallet,
            type: parsedType as CertificateType
          };
          
          if (candidate.name) {
            candidates.push(candidate);
          }
        })
        .on('end', resolve)
        .on('error', reject);
    });

    if (candidates.length !== Number(createCertificateDto.bulkCount)) {
      throw new BadRequestException(`CSV row count (${candidates.length}) does not match bulkCount (${createCertificateDto.bulkCount})`);
    }

    // 2. Parallelize Generation and Upload
    const processedData = await Promise.all(
      candidates.map(async (candidate) => {
        return this.processSingleCertificate(candidate, createCertificateDto);
      })
    );

    // 3. Final Batch Minting
    const validCandidates = processedData.filter(c => c.walletAddress);
    let txHash = '';

    if (validCandidates.length > 0) {
      const addresses = validCandidates.map(c => c.walletAddress);
      const uris = validCandidates.map(c => c.metadataUrl);
      try {
        txHash = await this.blockchainService.bulkMint(addresses, uris);
        // assign txHash and pseudo tokenId
        processedData.forEach(c => {
          if (c.walletAddress) {
            (c as any).transactionHash = `https://testnet.mstscan.com/tx/${txHash}`;
            (c as any).tokenId = Math.floor(Date.now() / 1000) + Math.floor(Math.random() * 1000);
          }
        });
      } catch (err) {
        console.error('Bulk minting failed:', err);
      }
    }

    // Create certificate with parsed candidates
    return this.create({
      ...createCertificateDto,
      candidates: processedData
    }, mintType);
  }
}
