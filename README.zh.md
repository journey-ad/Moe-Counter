# Moe Counter CF

[English](https://github.com/dsrkafuu/moe-counter-cf#readme) | [中文](https://github.com/dsrkafuu/moe-counter-cf/blob/master/README.zh.md)

基于 Cloudflare Workers 的 Moe Counter 萌萌计数器分支。

[原项目](https://github.com/journey-ad/Moe-counter) | [Cloudflare Workers](https://workers.cloudflare.com/) | [Cloudflare Workers KV](https://www.cloudflare.com/products/workers-kv/)

## 预览

[![Gelbooru](https://count.dsrkafuu.net/dsrkafuu:demo)](https://count.dsrkafuu.net/dsrkafuu:demo)

<details>
<summary>更多主题和自定义选项</summary>

**A-SOUL (with `theme=asoul&length=10`)**

[![A-SOUL](https://count.dsrkafuu.net/dsrkafuu:demo?theme=asoul&length=10&add=0)](https://count.dsrkafuu.net/dsrkafuu:demo?theme=asoul&length=10)

**Moebooru (with `theme=moebooru&length=auto`)**

[![Moebooru](https://count.dsrkafuu.net/dsrkafuu:demo?theme=moebooru&length=auto&add=0)](https://count.dsrkafuu.net/dsrkafuu:demo?theme=moebooru&length=auto)

**Rule 34 (with `theme=rule34&render=pixelated`)**

[![Rule 34](https://count.dsrkafuu.net/dsrkafuu:demo?theme=rule34&render=pixelated&add=0)](https://count.dsrkafuu.net/dsrkafuu:demo?theme=rule34)

</details>

## 使用

**公共计数器**

```
https://count.dsrkafuu.net/{id}
https://count.dsrkafuu.net/{id}?theme={asoul,gelbooru,moebooru,rule34}&render={auto,pixelated}&length={1-10,auto}&add={0,1}
```

1. `{id}`：任何长度在 1-256 之间的字符串 (允许的符号有 `a-zA-Z0-9:.@_-`)
2. `{&theme}`：`asoul`、`gelbooru`、`moebooru`、`rule34` 和两个其他的主题 (默认：`gelbooru`)
3. `{&length}`：`1-10` 之间的数字 (默认：`7`) 或 `auto`
4. `{&render}`：`auto` 或 `pixelated` (默认：`auto`)
5. `{&add}`：控制计数器是否增加 (默认：`1`)

你可以通过[自行部署](#自行部署)来自定义默认行为。

如果想要使用公共计数器，请发起一个对文件 `settings.json` 的 pull request 以在其中添加你的 ID。推荐使用 `用户名:用途` 格式的 ID 来便于管理和错误收集。

**API 接口**

```
GET https://count.dsrkafuu.net/api/{id}
DELETE https://count.dsrkafuu.net/api/{id}
```

公共计数器的 DELETE 接口默认不开启。

**HTML 和 Markdown**

```
<img src="https://count.dsrkafuu.net/{id}" alt="{id}" />
![{id}](https://count.dsrkafuu.net/{id})
[![{id}](https://count.dsrkafuu.net/{id})](https://count.dsrkafuu.net/{id})
```

## 自行部署

1. 在 Cloudflare Workers 中创建一个 worker
2. 在 Cloudflare Workers KV 中创建一个 store
3. 使用模板 `wrangler.example.toml` 创建你自己的 `wrangler.toml`
4. 修改 `settings.json` 来调整设置
5. 使用 `wrangler publish` 编译并发布 worker

## Credits

- [A-SOUL](https://space.bilibili.com/703007996)
- [Moebooru](https://github.com/moebooru/moebooru)
- [Rule 34 **(❗NSFW❗)**](https://rule34.xxx/)
- [Gelbooru **(❗NSFW❗)**](https://gelbooru.com/)

## License

This project and all contributors shall not be responsible for any dispute or loss caused by using this project.

This project is released under the `MIT` License, for more information read the [License](https://github.com/dsrkafuu/moe-counter-cf/blob/master/LICENSE).

**Copyright (c) 2020 journey-ad, 2022 DSRKafuU**
