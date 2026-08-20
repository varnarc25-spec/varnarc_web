import type { ContactMessageStatus, Prisma, PrismaClient } from '@prisma/client';
import { BaseRepository, listActiveWithCursor, softDeleteById } from '../base.repository';
import type { CursorPageParams } from '../../pagination';

export class ContactMessageRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  create(data: Prisma.ContactMessageCreateInput) {
    return this.db.contactMessage.create({ data });
  }

  findById(id: string) {
    return this.db.contactMessage.findFirst({ where: { id, deletedAt: null } });
  }

  list(
    params: CursorPageParams & {
      status?: ContactMessageStatus;
      topic?: string;
      search?: string;
    } = {},
  ) {
    return listActiveWithCursor(this.db.contactMessage, {
      ...params,
      where: {
        ...(params.status ? { status: params.status } : {}),
        ...(params.topic ? { topic: params.topic } : {}),
        ...(params.search
          ? {
              OR: [
                { name: { contains: params.search, mode: 'insensitive' } },
                { email: { contains: params.search, mode: 'insensitive' } },
                { subject: { contains: params.search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  updateStatus(
    id: string,
    data: {
      status: ContactMessageStatus;
      emailError?: string | null;
      sentAt?: Date | null;
    },
  ) {
    return this.db.contactMessage.update({
      where: { id },
      data: {
        status: data.status,
        emailError: data.emailError ?? null,
        sentAt: data.sentAt === undefined ? undefined : data.sentAt,
      },
    });
  }

  softDelete(id: string, actorId?: string) {
    return softDeleteById(this.db.contactMessage, id, actorId);
  }
}
