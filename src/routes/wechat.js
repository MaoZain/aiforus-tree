const express = require('express');
const crypto = require('crypto');
const xml2js = require('xml2js');
const generatorService = require('../services/generatorService');
const logger = require('../utils/logger');

const router = express.Router();

// 你的微信 Token，必须与微信后台配置的一致
const WECHAT_TOKEN = 'aiforus_tree_token_2025'; 

// 1. 微信服务器验证 (GET 请求)
router.get('/', (req, res) => {
  const { signature, timestamp, nonce, echostr } = req.query;

  // 字典序排序
  const array = [WECHAT_TOKEN, timestamp, nonce].sort();
  const str = array.join('');
  // SHA1 加密
  const sha1Str = crypto.createHash('sha1').update(str).digest('hex');

  if (sha1Str === signature) {
    res.send(echostr); // 验证成功，原样返回 echostr
  } else {
    res.send('Error');
  }
});

// 2. 接收用户消息并回复 (POST 请求)
router.post('/', async (req, res) => {
  try {
    // 获取原始 XML 数据
    let xmlData = '';
    req.on('data', chunk => { xmlData += chunk; });
    req.on('end', async () => {
      try {
        // 解析 XML
        const parser = new xml2js.Parser({ explicitArray: false });
        const result = await parser.parseStringPromise(xmlData);
        const message = result.xml;

        // 只处理文本消息
        if (message && message.MsgType === 'text') {
          let userContent = message.Content ? message.Content.trim() : '';
          const openId = message.FromUserName;
          const myId = message.ToUserName;
          
          let replyXml = '';
          
          // 定义触发前缀 (支持中文冒号和英文冒号，或者空格)
          // 例如: "圣诞树:祝福语", "圣诞树 祝福语", "tree:text"
          const prefixRegex = /^(圣诞树|tree)[:：\s]*/i;
          
          if (prefixRegex.test(userContent)) {
            // 1. 提取真正的祝福语
            const wishText = userContent.replace(prefixRegex, '').trim();
            
            // 如果用户只发了前缀没发内容，给个默认祝福
            const finalText = wishText || "圣诞快乐！";

            // 2. 调用生成服务
            const generateResult = await generatorService.generate({
              text: finalText,
              config: { from: 'wechat' }
            });

            // 构造图文消息 (News) XML
            replyXml = `
              <xml>
                <ToUserName><![CDATA[${openId}]]></ToUserName>
                <FromUserName><![CDATA[${myId}]]></FromUserName>
                <CreateTime>${Math.floor(Date.now() / 1000)}</CreateTime>
                <MsgType><![CDATA[news]]></MsgType>
                <ArticleCount>1</ArticleCount>
                <Articles>
                  <item>
                    <Title><![CDATA[🎄 您的专属圣诞树已种下！]]></Title>
                    <Description><![CDATA[祝福语：${finalText}\n点击查看您的 3D 圣诞树贺卡]]></Description>
                    <PicUrl><![CDATA[https://img.freepik.com/free-vector/hand-drawn-christmas-tree-background_23-2148763454.jpg]]></PicUrl>
                    <Url><![CDATA[${generateResult.url}]]></Url>
                  </item>
                </Articles>
              </xml>
            `;
          } else {
            // 3. 不符合前缀，回复引导语 (Text)
            const replyContent = `想要生成专属3D圣诞树吗？🎄\n\n请按格式回复：\n圣诞树：你的祝福语\n\n例如：\n圣诞树：亲爱的，圣诞快乐！`;
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

          res.type('application/xml');
          res.send(replyXml);
        } else {
          res.send('success'); // 其他类型消息暂不回复，直接返回 success 避免微信重试
        }
      } catch (err) {
        logger.error('WeChat logic error:', err);
        res.send('success');
      }
    });
  } catch (error) {
    logger.error('WeChat request error:', error);
    res.status(500).send('Error');
  }
});

module.exports = router;