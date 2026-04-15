import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateCertificateDto } from './dto/create-certificate.dto';
import { UpdateCertificateDto } from './dto/update-certificate.dto';
import { Certificate, CertificateDocument } from './schemas/certificate.schema';

@Injectable()
export class CertificatesService {
  constructor(
    @InjectModel(Certificate.name) private certificateModel: Model<CertificateDocument>,
  ) {}

  async create(createCertificateDto: CreateCertificateDto) {
    const createdCertificate = new this.certificateModel(createCertificateDto);
    return createdCertificate.save();
  }

  async findAll(page: number = 1, limit: number = 10, search?: string) {
    const skip = (page - 1) * limit;
    const query: any = {};

    if (search) {
      query.$or = [
        { recipientName: { $regex: search, $options: 'i' } },
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
}
