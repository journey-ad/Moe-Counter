# Moe-Counter

多种风格可选的萌萌计数器

![Moe-Counter](https://count.getloli.com/get/@Moe-counter.github)

<details>
<summary>More theme</summary>

### *Contribute themes is welcome!*

##### asoul
![asoul](https://count.getloli.com/get/@demo?theme=asoul)

##### moebooru
![moebooru](https://count.getloli.com/get/@demo?theme=moebooru)

##### rule34
![Rule34](https://count.getloli.com/get/@demo?theme=rule34)

##### gelbooru
![Gelbooru](https://count.getloli.com/get/@demo?theme=gelbooru)

</details>

## Demo
[https://count.getloli.com](https://count.getloli.com)

## How to use

About the counter usage, please see the [website homepage](https://count.getloli.com).

## Usage

### Install

#### Run on Glitch

- Open [Glitch project](https://glitch.com/~moe-counter-api)
- Just hit the **Remix your own** button
- That's it!

#### Deploying on your own server

```shell
$ git clone https://github.com/journey-ad/Moe-Counter.git
$ cd Moe-Counter
$ pnpm install

$ pnpm run start
```

### Configuration

`config.yml`

```yaml
app:
  # site: https://count.getloli.com # your website
  port: 3000

db:
  type: sqlite # sqlite or mongodb
  interval: 60 # write to db interval in seconds (0 for realtime)
```

If using mongodb, you need to specify the environment variable `DB_URL`

```shell
# e.g.
export DB_URL=mongodb+srv://account:passwd@***.***.***.mongodb.net/db_count
```

Glitch can use `.env` file, [documentation](https://help.glitch.com/hc/en-us/articles/16287550167437-Adding-Private-Data)

## Credits

* [Glitch](https://glitch.com/)
* [A-SOUL_Official](https://space.bilibili.com/703007996)
* [moebooru](https://github.com/moebooru/moebooru)
* rule34.xxx NSFW
* gelbooru.com NSFW
* [Icons8](https://icons8.com/icon/80355/star)

## License

[MIT License](./LICENSE)
