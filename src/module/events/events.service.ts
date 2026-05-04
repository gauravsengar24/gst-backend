import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { Event, EventDocument } from './schemas/event.schema';

@Injectable()
export class EventsService {
  constructor(
    @InjectModel(Event.name) private eventModel: Model<EventDocument>,
  ) { }

  async create(createEventDto: CreateEventDto) {
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

  async findOne(id: string) {
    const event = await this.eventModel.findById(id).exec();

    if (!event) {
      throw new NotFoundException(`Event with id ${id} not found`);
    }

    return event;
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
