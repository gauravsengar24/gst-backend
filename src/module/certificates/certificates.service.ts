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

  findAll() {
    return this.certificateModel.find().exec();
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
