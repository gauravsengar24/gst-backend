import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Certificate, CertificateDocument } from '../certificates/schemas/certificate.schema';
import * as sharp from 'sharp';
import * as path from 'path';
import axios from 'axios';
import * as FormData from 'form-data';

@Injectable()
export class MetadataService {
  private readonly templatePath = path.join(process.cwd(), 'src/module/metadata/certificate.jpeg');

  constructor(
    private configService: ConfigService,
    @InjectModel(Certificate.name) private certificateModel: Model<CertificateDocument>,
  ) {}

  /**
   * Generates a certificate image with the candidate's name overlayed.
   */
  async generateCertificateImage(name: string): Promise<Buffer> {
    const width = 3508;
    const height = 2480;

    const svgImage = `
      <svg width="${width}" height="${height}">
        <style>
          .name { fill: #2c3e50; font-size: 140px; font-weight: 600; font-family: 'serif'; }
        </style>
        <text x="50%" y="46%" text-anchor="middle" class="name">${name.toUpperCase()}</text>
      </svg>
    `;
    const svgBuffer = Buffer.from(svgImage);

    return sharp(this.templatePath)
      .composite([{ input: svgBuffer, top: 0, left: 0 }])
      .jpeg({ quality: 90 })
      .toBuffer();
  }

  /**
   * Uploads image and metadata to IPFS via Pinata.
   */
  async uploadToIpfs(data: {
    name: string;
    description: string;
    date: string;
    issuedBy: string;
    title: string;
    type: string;
    imageBuffer: Buffer;
  }) {
    const imageFormData = new FormData();
    imageFormData.append('file', data.imageBuffer, {
      filename: `certificate_${data.name.replace(/\s+/g, '_')}.jpg`,
      contentType: 'image/jpeg',
    });

    const imageResponse = await this.uploadToPinata(imageFormData, 'Image');
    const imageHash = imageResponse.IpfsHash;

    const payload = {
      pinataContent: {
        name: `${data.title} - ${data.name}`,
        description: data.description,
        image: `ipfs://${imageHash}`,
        attributes: [
          { trait_type: 'Candidate Name', value: data.name },
          { trait_type: 'Issued By', value: data.issuedBy },
          { trait_type: 'Date', value: data.date },
          { trait_type: 'Certificate Title', value: data.title },
          { trait_type: 'Certificate Type', value: data.type },
        ],
      },
      pinataMetadata: { name: `metadata_${data.name.replace(/\s+/g, '_')}.json` },
      pinataOptions: { cidVersion: 1 },
    };

    // 3. Upload Metadata JSON to IPFS
    const metadataResponse = await this.uploadToPinata(payload, 'Metadata');

    // 4. Save to Certificate collection in MongoDB
    await this.certificateModel.create({
      title: data.title,
      issuer: data.issuedBy,
      description: data.description,
      issuedAt: new Date(data.date),
      ipfsHash: imageHash,
      metadataUrl: `ipfs://${metadataResponse.IpfsHash}`,
      candidates: [{
        name: data.name,
        type: data.type,
        localImagePath: '',
        ipfsHash: imageHash,
        metadataUrl: `ipfs://${metadataResponse.IpfsHash}`
      }]
    });
    
    return {
      imageHash,
      metadataHash: metadataResponse.IpfsHash,
      metadataUrl: `ipfs://${metadataResponse.IpfsHash}`,
    };
  }

  private async uploadToPinata(data: any, type: 'Image' | 'Metadata') {
    const jwt = this.configService.get<string>('PINATA_JWT');

    if (!jwt) {
      throw new Error('PINATA_JWT is missing in configuration (.env)');
    }

    const url = type === 'Image' 
      ? 'https://api.pinata.cloud/pinning/pinFileToIPFS'
      : 'https://api.pinata.cloud/pinning/pinJSONToIPFS';

    const headers = type === 'Image'
      ? { ...data.getHeaders(), Authorization: `Bearer ${jwt}` }
      : { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' };

    const response = await axios.post(url, data, { headers, maxBodyLength: Infinity });
    return response.data;
  }
}
