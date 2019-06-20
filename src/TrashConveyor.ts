import got from "got";
import auth from "./auth.json";
import { GelbooruResponseBody, GelbooruSpec } from "./Interfaces";
import { Utils } from "./misc/Utils";
import { Logger } from "./Logger";

export class TrashConveyor {

	private static readonly NUM_POSTS = 42;	// number of posts to fetch per request

	private static randPostPageCntr = 0;
	private static postIndicies: number[] = [];

	private static constructGetUrl(baseUrl: string, variables: Map<string, string>): string {
		
		let s = "";

		variables.forEach((value, key) => {
			s += ("&" + encodeURI(key) + "=" + encodeURI(value));
		});

		return baseUrl + "?" + s.substr(1);
		
	}

	public static async requestPosts(spec: GelbooruSpec): Promise<GelbooruResponseBody[] | null> {

		let variables = new Map<string, string>();
		variables.set("api_key", auth.GELBOORU_API_KEY)
				 .set("user_id", auth.GELBOORU_USER_ID)
				 .set("page", "dapi")
				 .set("s", "post")
				 .set("q", "index")
				 .set("json", "1")
				 .set("limit", spec.limit.toString())
				 .set("pid", spec.pageNum.toString())
				 .set("tags", spec.tags.join(" "));

		let uri = TrashConveyor.constructGetUrl("https://gelbooru.com/index.php", variables);
		let result = null;
		try {
			const response = await got(uri, { json: true });
			result = response.body as any;
			if (response.body.length == 0) {
				if (TrashConveyor.randPostPageCntr > 0) {
					TrashConveyor.randPostPageCntr = 0;
					return TrashConveyor.requestPosts(spec);
				}
			}
		} catch (error) {
			Logger.println(error.response.body);
			//=> 'Internal server error ...'
		}

		return result;
		
	}

	public static async getRandomPost(tags: string[]): Promise<GelbooruResponseBody | null> {
		
		let index = TrashConveyor.updateIndicies();
		let response = await TrashConveyor.requestPosts({ limit: TrashConveyor.NUM_POSTS, pageNum: TrashConveyor.randPostPageCntr, tags: tags });
		
		let result = null;
		if (response) {
			result = response[Utils.clamp(index, 0, response.length-1)];
		}

		return result;
		
	}

	private static updateIndicies(): number {

		if (TrashConveyor.postIndicies.length == 0) {
			TrashConveyor.randPostPageCntr++;
			for (let i = 0; i < TrashConveyor.NUM_POSTS; i++) {
				TrashConveyor.postIndicies.push(i);
			}
		}

		return TrashConveyor.postIndicies.splice(~~(Math.random() * TrashConveyor.postIndicies.length), 1)[0];
		
	}
	
}