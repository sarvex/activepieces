import { BasicAuthPropertyValue, createTrigger, DedupeStrategy, Polling, pollingHelper } from '@activepieces/framework';
import { TriggerStrategy } from '@activepieces/shared';
import { wordpressCommon } from '../common';
import dayjs from "dayjs";

export const wordpressNewPost = createTrigger({
  name: 'new_post',
  displayName: 'New Post',
  sampleData: {
    "id": 60,
    "date": "2023-02-19T10:08:25",
    "date_gmt": "2023-02-19T10:08:25",
    "guid": {
      "rendered": "https://yoursite.com/?p=60"
    },
    "modified": "2023-02-19T10:08:25",
    "modified_gmt": "2023-02-19T10:08:25",
    "slug": "post-slug",
    "status": "publish",
    "type": "post",
    "link": "/post-slug/",
    "title": {
      "rendered": "<h1> post title </h1>"
    },
    "content": {
      "rendered": "\npost content\n",
      "protected": false
    },
    "excerpt": {
      "rendered": "xxx\n",
      "protected": false
    },
    "author": 1,
    "featured_media": 0,
    "comment_status": "open",
    "ping_status": "open",
    "sticky": false,
    "template": "",
    "format": "standard",
    "meta": [],
    "categories": [
      1
    ],
    "tags": [],
    "_links": {
      "self": [
        {
          "href": "/wp-json/wp/v2/posts/60"
        }
      ],
      "collection": [
        {
          "href": "/wp-json/wp/v2/posts"
        }
      ],
      "about": [
        {
          "href": "/wp-json/wp/v2/types/post"
        }
      ],
      "author": [
        {
          "embeddable": true,
          "href": "/wp-json/wp/v2/users/1"
        }
      ],
      "replies": [
        {
          "embeddable": true,
          "href": "/wp-json/wp/v2/comments?post=60"
        }
      ],
      "version-history": [
        {
          "count": 1,
          "href": "/wp-json/wp/v2/posts/60/revisions"
        }
      ],
      "predecessor-version": [
        {
          "id": 61,
          "href": "/wp-json/wp/v2/posts/60/revisions/61"
        }
      ],
      "wp:attachment": [
        {
          "href": "/wp-json/wp/v2/media?parent=60"
        }
      ],
      "wp:term": [
        {
          "taxonomy": "category",
          "embeddable": true,
          "href": "/wp-json/wp/v2/categories?post=60"
        },
        {
          "taxonomy": "post_tag",
          "embeddable": true,
          "href": "/wp-json/wp/v2/tags?post=60"
        }
      ],
      "curies": [
        {
          "name": "wp",
          "href": "https://api.w.org/{rel}",
          "templated": true
        }
      ]
    }
  },
  description: 'Triggers when a new post is published',
  props: {
    connection: wordpressCommon.connection,
    website_url: wordpressCommon.website_url,
    authors: wordpressCommon.authors
  },
  type: TriggerStrategy.POLLING,
  async test(ctx) {
    return await pollingHelper.test(polling, {
      store: ctx.store,
      propsValue: ctx.propsValue
    });
  },
  async onEnable(ctx) {
    await pollingHelper.onEnable(polling, {
      store: ctx.store,
      propsValue: ctx.propsValue
    });
  },
  async onDisable(ctx) {
    await pollingHelper.onDisable(polling, {
      store: ctx.store,
      propsValue: ctx.propsValue
    });
  },
  async run(ctx) {
    return await pollingHelper.poll(polling, {
      store: ctx.store,
      propsValue: ctx.propsValue
    });
  }
});


const polling: Polling<{ website_url: string, connection: BasicAuthPropertyValue, authors: string | undefined }> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ propsValue, lastFetchEpochMS }) => {
    const items = await getPosts(propsValue.connection, propsValue.website_url, propsValue.authors!, lastFetchEpochMS);
    return items.map((item) => ({
      epochMilliSeconds: dayjs(item.date).valueOf(),
      data: item,
    }));
  }
}


const getPosts = async (connection: BasicAuthPropertyValue, website_url: string, authors: string, startDate: number) => {
  //Wordpress accepts date only if they come after the start of the unix time stamp in 1970
  let afterDate = dayjs(startDate).toISOString();
  if(startDate=== 0)
  {
    afterDate = dayjs(startDate).add(1,'day').toISOString();
  }
  const getPostsParams = {
    websiteUrl: website_url.toString().trim(),
    username: connection['username'],
    password: connection['password'],
    authors: authors,
    afterDate: afterDate,
    page: 1
  };
  return (await wordpressCommon.getPosts(getPostsParams)).posts;
}

