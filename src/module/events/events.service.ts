import { Injectable } from '@nestjs/common';
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
    const createdEvent = new this.eventModel(createEventDto);
    const savedEvent = await createdEvent.save();
    return {
      message: 'Event created successfully',
      event: savedEvent,
    };
  }

  findAll() {
    return this.eventModel.find().exec();
  }

  findOne(id: string) {
    return this.eventModel.findById(id).exec();
  }

  update(id: string, updateEventDto: UpdateEventDto) {
    return this.eventModel.findByIdAndUpdate(id, updateEventDto, { new: true }).exec();
  }

  remove(id: string) {
    return this.eventModel.findByIdAndDelete(id).exec();
  }
}
