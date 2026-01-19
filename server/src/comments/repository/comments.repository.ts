import { Inject, Injectable } from '@nestjs/common';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../database/schema'; // Import your schema
import { DRIZZLE } from '../../database/database.module';
import { eq, desc, sql } from 'drizzle-orm';
// import { eq } from 'drizzle-orm/pg-core/expressions';
@Injectable()
export class CommentsRepository {
    constructor(
        @Inject(DRIZZLE) private readonly db: ReturnType<typeof drizzle>,
        
    ) { }


}