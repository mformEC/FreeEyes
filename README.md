# FreeEyes
---

## info
本工程全名：颈椎突出拯救者。一个用 nodejs 写的在线爬小说，不停转语音播放的服务端 + 一个~~简陋~~简洁的 web 端。目前只写到单用户。写这东西出于几点原因，一是医生告诉别低头玩手机，颈椎已经半推半就的突出了；二是老听音乐扎得慌；三是好像网上搜搜，好像没有类似的东西啊。~~mac 好像有这样的功能？~~；四是逃避找工作的压力，写点有的没的。

## guidance
**environment**
浏览器：
因为主要用 chrome ，所以先整 chrome 的。chrome 升级了对音频文件[自动播放策略](https://developers.google.com/web/updates/2017/09/autoplay-policy-changes#developer-switches)的设置。里面有老多种解决方案，选了最不安全的一种，在[播放策略](chrome://flags/#autoplay-policy)里修改了允许自动播放，好像会影响广告什么的自动播放吧。反正能用就行，没关系。至于火狐浏览器用着没啥问题，不用设置有的没的。
node:
现在还是在本地写的，没搁服务器上试过。所以还是要用本地的 node 。
**before using it**
去申请个百度语音合成的账号（声音太冰冷了，读书都不带感情的，还以为人工智能已经普及了...，要是科大讯飞的读书是带感情的日后可以试试）。附上[百度 api 文档](http://ai.baidu.com/docs#/TTS-API/8a85ed6e)。因为目前用的 ip 地址识别用户， 所以在 127.0.0.1 目录里的 config 配置文件里，填上 token 就行。在 log.json 文件里 ~~咋叫这名~~里填上小说网站参考那个格式就行。
**using it**
> node demp.js
> 启动 本地 index.html


**after using it**
没来得及写保存，但是一直在线播放没啥问题。重启后去修改下 log.json 就又能接着那章听了耶！

## 后续
明天准备面试。后天面试完接着写吧，现在先听会小说。