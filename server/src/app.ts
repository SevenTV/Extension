import { readdirSync, existsSync, rmdirSync } from 'fs';
import {} from 'rxjs';
import {} from 'rxjs/operators';

import('src/Client/Client');

if (existsSync('tmp/')) {
	for (const dir of readdirSync('tmp/')) {
		rmdirSync(`tmp/${dir}`, { recursive: true });
	}
}
