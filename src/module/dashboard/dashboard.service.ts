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
      typeStats,
    ] = await Promise.all([
      this.certificateModel.countDocuments(query),
      this.eventModel.countDocuments(),
      this.certificateModel.countDocuments({ ...query, createdAt: { $gte: today } }),
      this.certificateModel.distinct('candidates.type', query),
      this.certificateModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      this.eventModel.find().sort({ createdAt: -1 }).exec(),
      this.certificateModel.aggregate([
        { $unwind: '$candidates' },
        {
          $group: {
            _id: {
              eventId: '$eventId',
              type: '$candidates.type'
            },
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    const eventTypeCounts: Record<string, Record<string, number>> = {};
    const overallTypeCounts: Record<string, number> = {};

    typeStats.forEach(stat => {
      const eId = stat._id.eventId || 'no-event';
      const type = stat._id.type || 'Unknown';
      
      if (!eventTypeCounts[eId]) {
        eventTypeCounts[eId] = {};
      }
      eventTypeCounts[eId][type] = stat.count;

      if (!eventId || eId === eventId) {
        if (!overallTypeCounts[type]) {
          overallTypeCounts[type] = 0;
        }
        overallTypeCounts[type] += stat.count;
      }
    });

    return {
      stats: {
        totalCertificates,
        totalEvents,
        todaysCertificates,
        certificateTypes: overallTypeCounts,
      },
      events: events.map(event => ({
        id: event._id,
        name: event.name,
        title: event.title,
        date: event.date,
        place: event.place,
        description: event.description,
        typeCounts: eventTypeCounts[event._id.toString()] || {}
      })),
      recentActivity: {
        data: recentActivity.map(cert => ({
          id: cert._id,
          title: cert.title,
          date: cert.issuedAt,
          organization: cert.issuingAuthority,
          description: cert.description,
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
