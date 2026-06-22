import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateCandidateDto } from './dto/create-candidate.dto';
import { UpdateCandidateDto } from './dto/update-candidate.dto';
import { Candidate, CandidateDocument } from './schemas/candidate.schema';

@Injectable()
export class CandidatesService {
  constructor(
    @InjectModel(Candidate.name) private candidateModel: Model<CandidateDocument>,
  ) {}

  async create(createCandidateDto: CreateCandidateDto) {
    const createdCandidate = new this.candidateModel(createCandidateDto);
    return createdCandidate.save();
  }

  findAll() {
    return this.candidateModel.find().exec();
  }

  async findOne(id: string) {
    const candidate = await this.candidateModel.findById(id).exec();
    if (!candidate) throw new NotFoundException('Candidate not found');
    return candidate;
  }

  async update(id: string, updateCandidateDto: UpdateCandidateDto) {
    const candidate = await this.candidateModel.findByIdAndUpdate(id, updateCandidateDto, { new: true }).exec();
    if (!candidate) throw new NotFoundException('Candidate not found');
    return candidate;
  }

  async remove(id: string) {
    const candidate = await this.candidateModel.findByIdAndDelete(id).exec();
    if (!candidate) throw new NotFoundException('Candidate not found');
    return candidate;
  }
}
