import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as PDFDocument from 'pdfkit';
import { CreateCertificateDto } from './dto/create-certificate.dto';
import { UpdateCertificateDto } from './dto/update-certificate.dto';
import { CreateCandidateDto } from '../candidates/dto/create-candidate.dto';
import { Certificate, CertificateDocument } from './schemas/certificate.schema';
import { MetadataService } from '../metadata/metadata.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import * as fs from 'fs';
import * as path from 'path';
import * as csv from 'csv-parser';
import { Readable } from 'stream';

@Injectable()
export class CertificatesService {
  constructor(
    @InjectModel(Certificate.name) private certificateModel: Model<CertificateDocument>,
    private metadataService: MetadataService,
    private blockchainService: BlockchainService,
  ) {}

  async create(createCertificateDto: CreateCertificateDto) {
    const { candidates = [], bulkCount = 0, generatePlaceholders, ...rest } = createCertificateDto;
    
    let finalCandidates = [...candidates];
    
    if (generatePlaceholders && bulkCount > 0) {
      const placeholders = Array.from({ length: bulkCount }, (_, i) => ({
        name: `Candidate ${i + 1}`,
        email: '',
        walletAddress: '',
        type: 'Participation'
      }));
      finalCandidates = [...finalCandidates, ...placeholders];
    }

    const createdCertificate = new this.certificateModel({
      ...rest,
      candidates: finalCandidates
    });
    
    const savedCertificate = await createdCertificate.save();

    if (savedCertificate.candidates && savedCertificate.candidates.length > 0) {
      const updatedCandidates = await this.generateLocalImages(savedCertificate, savedCertificate.candidates);
      
      return this.certificateModel.findByIdAndUpdate(
        savedCertificate._id,
        { $set: { candidates: updatedCandidates } },
        { new: true }
      ).exec();
    }

    return savedCertificate;
  }

  async uploadToIpfs(id: string) {
    const certificate = await this.certificateModel.findById(id).exec();
    if (!certificate) {
      throw new NotFoundException('Certificate not found');
    }

    const updatedCandidates = await Promise.all(
      (certificate.candidates || []).map(async (candidate) => {
        if (!candidate.localImagePath || candidate.ipfsHash) return candidate;
        
        try {
          const imagePath = path.join(process.cwd(), candidate.localImagePath);
          if (!fs.existsSync(imagePath)) {
            console.error(`Local image not found for upload: ${imagePath}`);
            return candidate;
          }
          
          const imageBuffer = fs.readFileSync(imagePath);

          const ipfsData = await this.metadataService.uploadToIpfs({
            name: candidate.name,
            description: certificate.description || '',
            date: certificate.issuedAt.toISOString().split('T')[0],
            issuedBy: certificate.issuer,
            title: certificate.title,
            type: candidate.type,
            imageBuffer,
            walletAddress: candidate.walletAddress,
            skipSave: true,
          });

          let txHash = '';
          let tokenId = Math.floor(Date.now() / 1000) + Math.floor(Math.random() * 1000); // make this dynamically incremental after some time!

          if (candidate.walletAddress) {
            try {
              txHash = await this.blockchainService.mintCertificate(
                candidate.walletAddress,
                tokenId,
                ipfsData.metadataUrl
              );
            } catch (mintError) {
              console.error(`Failed to mint NFT for ${candidate.name}:`, mintError);
            }
          }
          // console.log(txHash);
          return { 
            name: candidate.name,
            email: candidate.email,
            walletAddress: candidate.walletAddress,
            type: candidate.type,
            ipfsHash: ipfsData.imageHash,
            metadataUrl: ipfsData.metadataUrl,
            tokenId: txHash ? tokenId : undefined,
            transactionHash: txHash ? `https://www.mstscan.com/tx/${txHash}` : undefined
          };
        } catch (error) {
          console.error(`Failed to upload candidate ${candidate.name} to IPFS:`, error);
          return candidate;
        }
      })
    );

    return this.certificateModel.findByIdAndUpdate(
      id,
      { $set: { candidates: updatedCandidates } },
      { new: true }
    ).exec();
  }

  private async generateLocalImages(certificate: CertificateDocument, candidates: any[]) {
    return Promise.all(
      candidates.map(async (candidate) => {
        if (!candidate.name) return candidate;
        
        try {
          // Generate and save image locally
          const imageBuffer = await this.metadataService.generateCertificateImage(candidate.name);
          const localImagePath = await this.saveCertificateImage(certificate._id.toString(), candidate.name, imageBuffer);
          
          return { 
            name: candidate.name,
            email: candidate.email,
            walletAddress: candidate.walletAddress,
            type: candidate.type,
            localImagePath
          };
        } catch (error) {
          console.error(`Failed to generate local image for ${candidate.name}:`, error);
          return candidate;
        }
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
        { issuer: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const [data, total] = await Promise.all([
      this.certificateModel.find(query).skip(skip).limit(limit).exec(),
      this.certificateModel.countDocuments(query)
    ]);

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  }

  findOne(id: string) {
    return this.certificateModel.findById(id).exec();
  }

  update(id: string, updateCertificateDto: UpdateCertificateDto) {
    return this.certificateModel.findByIdAndUpdate(id, updateCertificateDto, { new: true }).exec();
  }

  remove(id: string) {
    return this.certificateModel.findByIdAndDelete(id).exec();
  }

  async addCandidates(id: string, candidates: CreateCandidateDto[]) {
    const certificate = await this.certificateModel.findById(id).exec();
    if (!certificate) {
      throw new NotFoundException('Certificate not found');
    }

    const updatedCandidates = await this.generateLocalImages(certificate, candidates);
    
    return this.certificateModel.findByIdAndUpdate(
      id,
      { $push: { candidates: { $each: updatedCandidates } } },
      { new: true }
    ).exec();
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
    const type = candidate?.type || 'Participation';
    const name = candidateName || 'Recipient';

    doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40).stroke();

    doc.fontSize(40).text('CERTIFICATE', { align: 'center' }).moveDown();
    doc.fontSize(20).text('OF ' + type.toUpperCase(), { align: 'center' }).moveDown();
    
    doc.fontSize(15).text('This is to certify that', { align: 'center' }).moveDown();
    
    doc.fontSize(30).fillColor('#2c3e50').text(name, { align: 'center' }).moveDown();
    
    doc.fontSize(15).fillColor('black').text('has successfully completed', { align: 'center' }).moveDown();
    
    doc.fontSize(20).text(certificate.title, { align: 'center' }).moveDown();
    
    doc.fontSize(12).text(certificate.description || '', { align: 'center' }).moveDown(2);
    
    doc.fontSize(15).text('Issued by: ' + certificate.issuer, { align: 'center' });
    doc.text('Date: ' + new Date(certificate.issuedAt).toLocaleDateString(), { align: 'center' });

    doc.end();
    return doc;
  }

  async createWithCsv(createCertificateDto: CreateCertificateDto, file: Express.Multer.File) {
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
          const candidate: CreateCandidateDto = {
            name: data.name || data.Name || data.candidateName || '',
            email: data.email || data.Email || '',
            walletAddress: data.walletAddress || data.WalletAddress || data.wallet || '',
            type: data.type || data.Type || 'Participation'
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

    // Create certificate with parsed candidates
    return this.create({
      ...createCertificateDto,
      candidates
    });
  }
}
