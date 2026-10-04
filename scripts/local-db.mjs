import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync,mkdirSync} from 'node:fs';
import path from 'node:path';
// Development/test only. Production receives env.DB from Sites.
export function localDB(filename=':memory:'){
 if(filename!==':memory:')mkdirSync(path.dirname(filename),{recursive:true});
 const db=new DatabaseSync(filename);db.exec('CREATE TABLE IF NOT EXISTS _dev_migrations(name TEXT PRIMARY KEY)');
 for(const file of readdirSync('drizzle').filter(f=>f.endsWith('.sql')).sort())if(!db.prepare('SELECT name FROM _dev_migrations WHERE name=?').get(file)){db.exec('BEGIN');try{db.exec(readFileSync('drizzle/'+file,'utf8'));db.prepare('INSERT INTO _dev_migrations(name) VALUES(?)').run(file);db.exec('COMMIT')}catch(e){db.exec('ROLLBACK');throw e}}
 return {
   prepare(sql) {
     const stmt = db.prepare(sql);
     return {
       bind(...args) {
         return {
           async all() { return { results: stmt.all(...args) }; },
           async run() { return { meta: stmt.run(...args) }; }
         };
       }
     };
   },
   close() { db.close(); }
 };
}
