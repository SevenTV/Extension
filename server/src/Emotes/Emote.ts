import { DataStructure } from '@typings/DataStructure';
import * as Jimp from 'jimp';
import { ObjectId } from 'mongodb';
import { existsSync, mkdirp } from 'fs-extra';
import { asyncScheduler, from, iif, Observable, of, scheduled } from 'rxjs';
import { concatMap, map, mapTo, switchMap } from 'rxjs/operators';

export class Emote {
	fileID = new ObjectId();

	/**
	 * A utility for creating a new emote
	 */
	constructor(public data: Partial<DataStructure.Emote>) {}

	get filepath(): string {
		return `tmp/${this.fileID.toHexString()}`;
	}

	/**
	 * Resize the emote into its respective 1x, 2x, 3x & 4x sizes
	 */
	resize(): Observable<Emote.Resized> {
		return new Observable<Emote.Resized>(observer => {
			// Define emotes sizes
			// array elements - 0: scope, 1: size (px)
			// Needs to be in descending order or it will look scuffed
			const sizes = [[4, 128], [3, 76], [2, 48], [1, 32]];

			this.ensureFilepath().pipe( // Read original image
				switchMap(() => from(Jimp.read(`${this.filepath}/og`))),
				switchMap(image => from(sizes).pipe( // Iterate sizes and write new sizes
					concatMap(([scope, size]) => from(image.resize(size, size).writeAsync(`${this.filepath}/${scope}x.png`)).pipe(mapTo(scope)))
				)),

				map(scope => ({ // Emit "resized" objects, used to upload emote sizes to the CDN
					scope,
					path: `${this.filepath}/${scope}x.png`
				} as Emote.Resized))
			).subscribe({
				next(resized) { console.log(resized); observer.next(resized); },
				complete() { observer.complete(); },
				error(err) { observer.error(err); }
			});
		});
	}

	/**
	 * Ensure that the filepath exists, and if not create it
	 */
	ensureFilepath(): Observable<void> {
		return new Observable<void>(observer => {
			of(existsSync(`tmp/${this.fileID}`)).pipe(
				switchMap(exists => iif(() => exists,
					of(undefined),
					mkdirp(this.filepath)
				))
			).subscribe({
				next() { observer.next(undefined); },
				complete() { observer.complete(); },
				error(err) { observer.error(err); }
			});
		});
	}
}

export namespace Emote {
	export interface Resized {
		scope: number;
		path: string;
	}
}
