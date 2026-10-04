import {sqliteTable,text,integer,index} from 'drizzle-orm/sqlite-core';
export const creations=sqliteTable('creations',{
 id:text('id').primaryKey(),
 ownerId:text('owner_id').notNull(),
 payload:text('payload').notNull(),
 createdAt:integer('created_at').notNull(),
 updatedAt:integer('updated_at').notNull()
}, t=>[index('idx_creations_owner_updated').on(t.ownerId,t.updatedAt)]);
