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
          const userContent = message.Content; // 用户发送的文字，例如 "我爱你"
          const openId = message.FromUserName;
          const myId = message.ToUserName;

          // 调用生成服务
          // 注意：这里直接调用 Service，不需要走 HTTP API
          const generateResult = await generatorService.generate({
            text: userContent,
            config: { from: 'wechat' }
          });

          const replyContent = `您的专属圣诞树已生成！\n\n点击查看：${generateResult.url}\n\n(祝福语：${userContent})`;

          // 构造回复的 XML
          const replyXml = `
            <xml>
              <ToUserName><![CDATA[${openId}]]></ToUserName>
              <FromUserName><![CDATA[${myId}]]></FromUserName>
              <CreateTime>${Math.floor(Date.now() / 1000)}</CreateTime>
              <MsgType><![CDATA[text]]></MsgType>
              <Content><![CDATA[${replyContent}]]></Content>
            </xml>
          `;

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