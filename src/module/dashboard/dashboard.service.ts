import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Certificate, CertificateDocument } from '../certificates/schemas/certificate.schema';
import { Event, EventDocument } from '../events/schemas/event.schema';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Certificate.name) private certificateModel: Model<CertificateDocument>,
    @InjectModel(Event.name) private eventModel: Model<EventDocument>,
  ) {}

  async getDashboardStats(eventId?: string, page: number = 1, limit: number = 5) {
    const skip = (page - 1) * limit;
    const query: any = {};
    if (eventId) {
      query.eventId = eventId;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalCertificates,
      totalEvents,
      todaysCertificates,
      certificateTypes,
      recentActivity,
      events,
    ] = await Promise.all([
      this.certificateModel.countDocuments(query),
      this.eventModel.countDocuments(),
      this.certificateModel.countDocuments({ ...query, createdAt: { $gte: today } }),
      this.certificateModel.distinct('candidates.type', query),
      this.certificateModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      this.eventModel.find().sort({ createdAt: -1 }).exec(),
    ]);

    return {
      stats: {
        totalCertificates,
        totalEvents,
        todaysCertificates,
        certificateTypes: certificateTypes.length,
      },
      events: events.map(event => ({
        id: event._id,
        name: event.name,
        title: event.title,
        date: event.date,
        place: event.place,
        description: event.description
      })),
      recentActivity: {
        data: recentActivity.map(cert => ({
          id: cert._id,
          title: cert.title,
          date: cert.issuedAt,
          organization: cert.issuer,
          type: cert.candidates?.[0]?.type || 'N/A'
        })),
        pagination: {
          total: totalCertificates,
          page,
          limit,
          pages: Math.ceil(totalCertificates / limit)
        }
      },
    };
  }
}
