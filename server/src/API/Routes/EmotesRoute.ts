import { combineRoutes, r, use } from '@marblejs/core';
import { map } from 'rxjs/operators';
import { DataStructure } from '@typings/DataStructure';
import { multipart$ } from '@marblejs/middleware-multipart';
import { of } from 'rxjs';
import { EmoteStore } from 'src/Emotes/EmoteStore';
import { createWriteStream } from 'fs';

const MockData = [
	{
		name: 'xqcL',
		submitted_by: 'Your Mom',
		url: 'https://cdn.discordapp.com/emojis/797197297675010071.gif?v=1&size=32'
	},
	{
		name: 'PagMan',
		submitted_by: 'Your Mom',
		url: 'https://cdn.discordapp.com/emojis/732824111788851222.png?v=1&size=32'
	},
	{
		name: 'FeelsOkayMan',
		submitted_by: 'Your Mom',
		url: 'https://cdn.discordapp.com/emojis/695171992688787518.png?v=1&size=32'
	}
] as DataStructure.Emote[];

/**
 * GET /emotes/:channel
 *
 * List emotes for a speficic channel
 */
const GetChannelEmotes = r.pipe(
	r.matchPath('/:channel'),
	r.matchType('GET'),
	r.useEffect(req$ => req$.pipe(
		map(req => {
			console.log(req.params);
			return { body: MockData };
		})
	))
);

/**
 * POST /emotes
 *
 * Create a new Emote
 */
const CreateEmote = r.pipe(
	r.matchPath('/'),
	r.matchType('POST'),
	r.useEffect(req$ => req$.pipe(
		use(multipart$({
			stream: ({ file, encoding, mimetype, filename, fieldname  }) => {
				console.log(encoding, mimetype, filename, fieldname);
				return EmoteStore.Get().create(file, {
					mime: mimetype,
					submitter: 'Your Mom'
				}).pipe(
					map(emote => ({ destination: `${emote.filepath}/og` }))
				);
			}
		})),
		map(() => ({
			body: {
				very: 'pog'
			}
		}))
	))
);

export const EmotesRoute = combineRoutes('/emotes', [
	CreateEmote,
	GetChannelEmotes
]);
