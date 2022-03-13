# Moe Counter

Fork of Moe Counter for fast global access powered by Cloudflare Workers.

[Source Project](https://github.com/journey-ad/Moe-counter) | [Cloudflare Workers](https://workers.cloudflare.com/) | [Workers KV](https://www.cloudflare.com/products/workers-kv/)

## Demo

![Gelbooru](https://count.dsrkafuu.net/dsrkafuu:demo?theme=gelbooru)

<details>
<summary>More Themes</summary>

**A-SOUL**

![A-SOUL](https://count.dsrkafuu.net/dsrkafuu:demo?theme=asoul)

**Moebooru**

![Moebooru](https://count.dsrkafuu.net/dsrkafuu:demo?theme=moebooru)

##### Rule 34

![Rule 34](https://count.dsrkafuu.net/dsrkafuu:demo?theme=rule34)

##### Gelbooru

![Gelbooru](https://count.dsrkafuu.net/dsrkafuu:demo?theme=gelbooru)

</details>

## Usage

**Public Counter**

```
https://count.dsrkafuu.net/<id>
https://count.dsrkafuu.net/<id>?theme=<theme>&length=<length>
https://count.dsrkafuu.net/dsrkafuu:demo?theme=gelbooru
```

1. `<id>`: A string between 1-256 chars (`0-9a-zA-Z:!@#$%^&*_-`) starting with a letter (`a-zA-Z`)
2. `<theme>`: `asoul`, `gelbooru`, `moebooru`, `rule34` (and two other themes, default is `gelbooru`)
3. `<length>`: Number between 1-10 (default: 7)

Recommend to use `user:usage` like string as ID for better management.

**API Endpoints**

```
GET https://count.dsrkafuu.net/api/<id>
DELETE https://count.dsrkafuu.net/api/<id>
```

DELETE is not enabled by default, create a issue if you need to use it in public counter.

**HTML and Markdown**

```
<img src="https://count.dsrkafuu.net/<id>" alt="<id>" />
![<id>](https://count.dsrkafuu.net/<id>)
```

## Self-hosting

1. Create a Cloudflare Workers worker
2. Create a Cloudflare Workers KV store
3. Create your own `wrangler.toml` based on the example
4. Build the worker and publish it using `wrangler publish`

## Credits

- [A-SOUL](https://space.bilibili.com/703007996)
- [Moebooru](https://github.com/moebooru/moebooru)
- [Rule 34 (**NSFW**)](https://rule34.xxx/)
- [Gelbooru (**NSFW**)](https://gelbooru.com/)

## License

This project and all contributors shall not be responsible for any dispute or loss caused by using this project.

This project is released under the `MIT` License, for more information read the [License](https://github.com/dsrkafuu/moe-counter/blob/master/LICENSE).

**Copyright (c) 2020 journey-ad, 2022 DSRKafuU**
