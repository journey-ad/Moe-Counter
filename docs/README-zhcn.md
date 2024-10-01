# 萌萌计数器

多种风格可选的萌萌计数器

![Moe-Counter](https://count.getloli.com/get/@Moe-counter.github)

<details>
<summary>更多风格</summary>

##### asoul
![asoul](https://count.getloli.com/get/@demo?theme=asoul)

##### moebooru
![moebooru](https://count.getloli.com/get/@demo?theme=moebooru)

##### rule34
![Rule34](https://count.getloli.com/get/@demo?theme=rule34)

##### gelbooru
![Gelbooru](https://count.getloli.com/get/@demo?theme=gelbooru)</details>

## 演示
[https://count.getloli.com](https://count.getloli.com)

## 使用

### 安装

#### 在Replit上运行

- 打开URL [https://replit.com/@journeyad/Moe-Counter](https://replit.com/@journeyad/Moe-Counter)
- 点击 **Fork** 按钮
- 点击 **Run** 按钮

#### 在自己的服务器上运行

```shell
$ git clone https://github.com/journey-ad/Moe-Counter.git
$ cd Moe-Counter
$ yarn install

$ yarn start
```

### 设置

`config.yml`

```yaml
app:
  # site: https://count.getloli.com # your website
  port: 3000

db:
  type: sqlite # sqlite or mongodb
```

如果你使用的是mongodb，需要指定环境变量`DB_URL`

```shell
# eg:
export DB_URL=mongodb+srv://account:passwd@***.***.***.mongodb.net/db_count
```

Replit可以使用Secrets, 请查看[操作手册](https://docs.replit.com/programming-ide/storing-sensitive-information-environment-variables)

```
DB_URL="mongodb+srv://account:passwd@***.***.***.mongodb.net/db_count"
```

## 鸣谢

*   [replit](https://replit.com/)
*   [A-SOUL_Official](https://space.bilibili.com/703007996)
*   [moebooru](https://github.com/moebooru/moebooru)
*   rule34.xxx NSFW
*   gelbooru.com NSFW
*   [Icons8](https://icons8.com/icons/set/star)

## 许可

[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fjourney-ad%2FMoe-Counter.svg?type=large)](https://app.fossa.com/projects/git%2Bgithub.com%2Fjourney-ad%2FMoe-Counter?ref=badge_large)
