import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { Event, EventDocument } from './schemas/event.schema';
import { Certificate, CertificateDocument } from '../certificates/schemas/certificate.schema';

@Injectable()
export class EventsService {
  constructor(
    @InjectModel(Event.name) private eventModel: Model<EventDocument>,
    @InjectModel(Certificate.name) private certificateModel: Model<CertificateDocument>,
  ) { }

  async create(createEventDto: CreateEventDto, file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Base certificate image file is required.');
    }

    const { date, place } = createEventDto;
    
    const eventDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (eventDate < today) {
      throw new BadRequestException('Event date cannot be in the past.');
    }

    const existingEvent = await this.eventModel.findOne({ date: eventDate, place }).exec();
    
    if (existingEvent) {
      throw new ConflictException(`An event at "${place}" on this date already exists.`);
    }

    const createdEvent = new this.eventModel(createEventDto);
    const savedEvent = await createdEvent.save();

    if (file) {
      const uploadDir = path.join(process.cwd(), 'uploads/events', savedEvent._id.toString());
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      const ext = path.extname(file.originalname) || '.jpg';
      const fileName = `base_cert${ext}`;
      const filePath = path.join(uploadDir, fileName);
      fs.writeFileSync(filePath, file.buffer);
      
      savedEvent.baseCertificatePath = `uploads/events/${savedEvent._id.toString()}/${fileName}`;
      await savedEvent.save();
    }

    return {
      message: 'Event created successfully',
      event: savedEvent,
    };
  }

  async findAll(page: number = 1, limit: number = 10, search?: string) {
    const skip = (page - 1) * limit;
    const query: any = {};

    // Add search filter if provided
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { place: { $regex: search, $options: 'i' } }
      ];
    }

    const [data, total] = await Promise.all([
      this.eventModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      this.eventModel.countDocuments(query)
    ]);

    const eventIds = data.map(e => e._id.toString());
    const certificates = await this.certificateModel.find({ eventId: { $in: eventIds } }).exec();
    
    const certsByEvent = new Map<string, { certs: any[], count: number }>();
    for (const cert of certificates) {
      if (!cert.eventId) continue;
      if (!certsByEvent.has(cert.eventId)) {
        certsByEvent.set(cert.eventId, { certs: [], count: 0 });
      }
      const eventData = certsByEvent.get(cert.eventId)!;
      
      if (cert.candidates && Array.isArray(cert.candidates)) {
        eventData.count += cert.candidates.length;
      }

      const certObj = cert.toObject();
      delete certObj.candidates;
      
      eventData.certs.push(certObj);
    }

    const resultData = data.map(event => {
      const eventObj = event.toObject();
      const certData = certsByEvent.get(event._id.toString());
      
      const eventCerts = certData?.certs || [];
      eventCerts.forEach(c => {
        c.eventName = eventObj.name;
        c.eventLocation = eventObj.place;
      });

      (eventObj as any).certificates = eventCerts;
      (eventObj as any).totalCertificates = certData?.count || 0;
      return eventObj;
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
    const event = await this.eventModel.findById(id).exec();

    if (!event) {
      throw new NotFoundException(`Event with id ${id} not found`);
    }

    const certificates = await this.certificateModel.find({ eventId: id }).exec();
    const eventObj = event.toObject();
    let count = 0;
    
    const eventCerts: any[] = [];
    for (const cert of certificates) {
      if (cert.candidates && Array.isArray(cert.candidates)) {
        count += cert.candidates.length;
      }
      
      const certObj = cert.toObject() as any;
      delete certObj.candidates;
      certObj.eventName = eventObj.name;
      certObj.eventLocation = eventObj.place;
      
      eventCerts.push(certObj);
    }
    
    (eventObj as any).certificates = eventCerts;
    (eventObj as any).totalCertificates = count;

    return eventObj;
  }

  async update(id: string, updateEventDto: UpdateEventDto) {
    const event = await this.eventModel.findById(id).exec();

    if (!event) {
      throw new NotFoundException(`Event with id ${id} not found`);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (new Date(event.date) < today) {
      throw new BadRequestException('Cannot update an event that has already passed.');
    }

    if (updateEventDto.date && new Date(updateEventDto.date) < today) {
      throw new BadRequestException('Cannot set an event date to the past.');
    }

    const updated = await this.eventModel.findByIdAndUpdate(id, updateEventDto, { new: true }).exec();

    return updated;
  }

  async remove(id: string) {
    const deleted = await this.eventModel.findByIdAndDelete(id).exec();

    if (!deleted) {
      throw new NotFoundException(`Event with id ${id} not found`);
    }

    return { message: 'Event deleted successfully', success: true };
  }
}
