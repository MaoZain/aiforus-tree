const express = require("express");
const crypto = require("crypto");
const xml2js = require("xml2js");
const generatorService = require("../services/generatorService");
const birthdayService = require("../services/birthdayService");
const newYearService = require("../services/newYearService");
const config = require("../config");
const logger = require("../utils/logger");

const router = express.Router();

// 你的微信 Token，必须与微信后台配置的一致
const WECHAT_TOKEN = "aiforus_tree_token_2025";

// 1. 微信服务器验证 (GET 请求)
router.get("/", (req, res) => {
  const { signature, timestamp, nonce, echostr } = req.query;

  // 字典序排序
  const array = [WECHAT_TOKEN, timestamp, nonce].sort();
  const str = array.join("");
  // SHA1 加密
  const sha1Str = crypto.createHash("sha1").update(str).digest("hex");

  if (sha1Str === signature) {
    res.send(echostr); // 验证成功，原样返回 echostr
  } else {
    res.send("Error");
  }
});

// 2. 接收用户消息并回复 (POST 请求)
router.post("/", async (req, res) => {
  try {
    // 获取原始 XML 数据
    let xmlData = "";
    req.on("data", (chunk) => {
      xmlData += chunk;
    });
    req.on("end", async () => {
      try {
        // 解析 XML
        const parser = new xml2js.Parser({ explicitArray: false });
        const result = await parser.parseStringPromise(xmlData);
        const message = result.xml;

        // 只处理文本消息
        if (message && message.MsgType === "text") {
          let userContent = message.Content ? message.Content.trim() : "";
          const openId = message.FromUserName;
          const myId = message.ToUserName;

          let replyXml = "";

          // 定义触发前缀 (支持中文冒号和英文冒号，或者空格)
          const treeRegex = /^(圣诞树|tree)[:：\s]*/i;
          const birthdayRegex = /^(生日|birthday)[:：\s]*/i;
          const newYearRegex = /^(新年|new year)[:：\s]*/i;

          if (treeRegex.test(userContent)) {
            // --- 圣诞树逻辑 ---
            const wishText = userContent.replace(treeRegex, "").trim();
            const finalText = wishText || "圣诞快乐！";

            const generateResult = await generatorService.generate({
              text: finalText,
              config: { from: "wechat" },
            });
            
            const picUrl = `https://images.unsplash.com/photo-1543589077-47d81606c1bf?auto=format&fit=crop&w=900&q=80`;

            logger.info("WeChat Tree Reply", { targetUrl: generateResult.url, wishText: finalText });

            replyXml = `
              <xml>
                <ToUserName><![CDATA[${openId}]]></ToUserName>
                <FromUserName><![CDATA[${myId}]]></FromUserName>
                <CreateTime>${Math.floor(Date.now() / 1000)}</CreateTime>
                <MsgType><![CDATA[news]]></MsgType>
                <ArticleCount>1</ArticleCount>
                <Articles>
                  <item>
                    <Title><![CDATA[🎄 圣诞快乐｜送你一棵专属圣诞树]]></Title>
                    <Description><![CDATA[${finalText}\n点击打开圣诞贺卡 🎁]]></Description>
                    <PicUrl><![CDATA[${picUrl}]]></PicUrl>
                    <Url><![CDATA[${generateResult.url}]]></Url>
                  </item>
                </Articles>
              </xml>
            `;

          } else if (birthdayRegex.test(userContent)) {
            // --- 生日逻辑 ---
            const wishText = userContent.replace(birthdayRegex, "").trim();
            const finalText = wishText || "生日快乐！";

            const generateResult = await birthdayService.generate({
              text: finalText,
              config: { from: "wechat" },
            });

            // Birthday themed image
            const picUrl = `https://images.unsplash.com/photo-1464349153735-7db50ed83c84?auto=format&fit=crop&w=900&q=80`;

            logger.info("WeChat Birthday Reply", { targetUrl: generateResult.url, wishText: finalText });

            replyXml = `
              <xml>
                <ToUserName><![CDATA[${openId}]]></ToUserName>
                <FromUserName><![CDATA[${myId}]]></FromUserName>
                <CreateTime>${Math.floor(Date.now() / 1000)}</CreateTime>
                <MsgType><![CDATA[news]]></MsgType>
                <ArticleCount>1</ArticleCount>
                <Articles>
                  <item>
                    <Title><![CDATA[🎂 生日快乐｜送你一张专属生日卡片]]></Title>
                    <Description><![CDATA[${finalText}\n点击接收生日祝福 🎉]]></Description>
                    <PicUrl><![CDATA[${picUrl}]]></PicUrl>
                    <Url><![CDATA[${generateResult.url}]]></Url>
                  </item>
                </Articles>
              </xml>
            `;

          }
          else if (newYearRegex.test(userContent)) {
            // --- 新年逻辑 ---
            const wishText = userContent.replace(newYearRegex, "").trim();
            const finalText = wishText || "新年快乐！";

            const generateResult = await newYearService.generate({
              text: finalText,
              config: { from: "wechat", theme: "newyear" },
            });

            // New Year themed image
            const picUrl = `https://aiforus.tech/generated/newyearconfig/horse6.jpg`;

            logger.info("WeChat New Year Reply", { targetUrl: generateResult.url, wishText: finalText });

            replyXml = `
              <xml>
                <ToUserName><![CDATA[${openId}]]></ToUserName>
                <FromUserName><![CDATA[${myId}]]></FromUserName>
                <CreateTime>${Math.floor(Date.now() / 1000)}</CreateTime>
                <MsgType><![CDATA[news]]></MsgType>
                <ArticleCount>1</ArticleCount>
                <Articles>
                  <item>
                    <Title><![CDATA[🎉 新年快乐｜送你一份专属新年祝福]]></Title>
                    <Description><![CDATA[${finalText}\n点击打开新年祝福 🎁]]></Description>
                    <PicUrl><![CDATA[${picUrl}]]></PicUrl>
                    <Url><![CDATA[${generateResult.url}]]></Url>
                  </item>
                </Articles>
              </xml>
            `;
          }
          else {
            // 3. 不符合前缀，回复引导语 (Text)
            const replyContent = `欢迎关注 AI 偕行！\n\n回复【圣诞树：祝福语】\n生成3D圣诞树贺卡 🎄\n\n回复【生日：祝福语】\n生成专属生日祝福网页 🎂\n\n例如：\n圣诞树：圣诞快乐！\n生日：永远18岁！`;
            replyXml = `
              <xml>
                <ToUserName><![CDATA[${openId}]]></ToUserName>
                <FromUserName><![CDATA[${myId}]]></FromUserName>
                <CreateTime>${Math.floor(Date.now() / 1000)}</CreateTime>
                <MsgType><![CDATA[text]]></MsgType>
                <Content><![CDATA[${replyContent}]]></Content>
              </xml>
            `;
          }

          res.type("application/xml");
          res.send(replyXml);
        } else {
          res.send("success"); // 其他类型消息暂不回复，直接返回 success 避免微信重试
        }
      } catch (err) {
        logger.error("WeChat logic error:", err);
        res.send("success");
      }
    });
  } catch (error) {
    logger.error("WeChat request error:", error);
    res.status(500).send("Error");
  }
});

module.exports = router;
