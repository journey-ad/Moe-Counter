# Moe-counter

多种风格可选的萌萌计数器

![Moe-counter](https://count.getloli.com/get/@Moe-counter.github)

<details>
<summary>More theme</summary>

##### moebooru
![moebooru](https://count.getloli.com/get/@demo?theme=moebooru)

##### rule34
![Rule34](https://count.getloli.com/get/@demo?theme=rule34)

##### gelbooru
![Gelbooru](https://count.getloli.com/get/@demo?theme=gelbooru)</details>

## Demo
[https://count.getloli.com](https://count.getloli.com)

## Usage

### Install

#### Run on Repl.it

- Open the url [https://repl.it/@journeyad/Moe-counter](https://repl.it/@journeyad/Moe-counter)
- Just hit the **Fork** button
- And hit the **Run** button

#### Deploying on your own server

```shell
$ git clone https://github.com/journey-ad/Moe-counter.git
$ cd Moe-counter
$ yarn install

$ yarn start
```

### Confignation

`config.yml`

```yaml
app:
  port: 3000

db:
  type: mongodb # sqlite or mongodb
```

If you use mongodb, you need to specify the environment variable `DB_URL`

```shell
# eg:
export DB_URL=mongodb+srv://account:passwd@***.***.***.mongodb.net/db_count
```

repl.it can use `.env` file, [documentation](https://docs.repl.it/repls/secret-keys)

```
DB_URL="mongodb+srv://account:passwd@***.***.***.mongodb.net/db_count"
```

## Credits

*   [repl.it](https://repl.it/)
*   [moebooru](https://github.com/moebooru/moebooru)
*   rule34.xxx NSFW
*   gelbooru.com NSFW
*   [Icons8](https://icons8.com/icons/set/star)

## License

MIT