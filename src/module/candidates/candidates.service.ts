import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateCandidateDto } from './dto/create-candidate.dto';
import { UpdateCandidateDto } from './dto/update-candidate.dto';
import { Certificate, CertificateDocument } from '../certificates/schemas/certificate.schema';

@Injectable()
export class CandidatesService {
  constructor(
    @InjectModel(Certificate.name) private certificateModel: Model<CertificateDocument>
  ) {}

  create(createCandidateDto: CreateCandidateDto) {
    return 'This action adds a new candidate';
  }

  findAll() {
    return `This action returns all candidates`;
  }

  async findOne(id: string, page: number = 1, limit: number = 10, search?: string) {
    const certificate = await this.certificateModel.findOne({ '_id': id }).exec();

    if (!certificate) {
      throw new NotFoundException(`Certificate with id ${id} not found`);
    }

    let candidates = certificate.candidates || [];

    if (search) {
      const searchLower = search.toLowerCase();
      candidates = candidates.filter(c => 
        (c.name && c.name.toLowerCase().includes(searchLower)) ||
        (c.email && c.email.toLowerCase().includes(searchLower)) ||
        (c.walletAddress && c.walletAddress.toLowerCase().includes(searchLower))
      );
    }

    candidates.sort((a: any, b: any) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : (a._id ? parseInt(a._id.toString().substring(0, 8), 16) * 1000 : 0);
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : (b._id ? parseInt(b._id.toString().substring(0, 8), 16) * 1000 : 0);
      return dateB - dateA;
    });

    const total = candidates.length;
    const skip = (page - 1) * limit;
    const paginatedCandidates = candidates.slice(skip, skip + limit);

    return {
      data: paginatedCandidates,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit) || 1
      }
    };
  }

  update(id: string, updateCandidateDto: UpdateCandidateDto) {
    return `This action updates a #${id} candidate`;
  }

  remove(id: string) {
    return `This action removes a #${id} candidate`;
  }
}
