import { r } from '@marblejs/core';
import { mapTo } from 'rxjs/operators';

export const RootRoute = r.pipe(
	r.matchPath('/'),
	r.matchType('GET'),
	r.useEffect(req => req.pipe(
		mapTo({ body: { message: '7TV API' } }),
	))
);
