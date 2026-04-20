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

  async getDashboardStats(eventId?: string) {
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
      typeBreakdown
    ] = await Promise.all([
      this.certificateModel.countDocuments(query),
      this.eventModel.countDocuments(),
      this.certificateModel.countDocuments({ ...query, createdAt: { $gte: today } }),
      this.certificateModel.distinct('type', query),
      this.certificateModel.find(query).sort({ createdAt: -1 }).limit(5).exec(),
      this.certificateModel.aggregate([
        { $match: query },
        { $group: { _id: '$type', count: { $sum: 1 } } }
      ])
    ]);

    const formattedTypeBreakdown = typeBreakdown.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {});

    return {
      stats: {
        totalCertificates,
        totalEvents,
        todaysCertificates,
        certificateTypes: certificateTypes.length,
      },
      recentActivity: recentActivity.map(cert => ({
        id: cert._id,
        title: cert.title,
        date: cert.issuedAt,
        organization: cert.issuer,
        type: cert.type
      })),
      typeBreakdown: formattedTypeBreakdown
    };
  }
}
