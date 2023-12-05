'use strict';
const parseXML = require('xmljx');
const axios = require('axios');
const db = uniCloud.database();
const user = db.collection('user');
const dbCmd = db.command;

const MCOOKIE = 'xxxxx';
// 此处需要填写微信公众号登录后的cookie，可能会失效，暂时没做自动刷新，还是比较麻烦的

exports.main = async (event, context) => {
	if (!event.body) {
		return
	}
	const xmlData = await parseXML(event.body);
	const {ToUserName, FromUserName, MsgType, Content, MsgId} = xmlData;
	let _id = '';
	if (Content.indexOf('bind-') >= 0) {
		_id = Content.replace('bind-', '');
	}
	let arr = await initUser(_id, FromUserName);
	let rsg = Content;
	if (arr[0] == 404) {
		rsg = arr[1];
	} else {
		const userInfo = arr[1];
		if (Content.indexOf('收到不支持的消息类型') >= 0) {
			const allMgs = await getAllMsg(FromUserName);
			let new_msg = allMgs[0];
			if (new_msg['type'] == 47) {
				const fileID = await uploadEmoji(new_msg['id']);
				if (fileID) {
					const res = await userEmojiInsert(userInfo['_id'], fileID);
					rsg = '添加成功'
				}
			} else {
				rsg = '添加失败（发送表情包的频率不能太高）'
			}
		}
	}
	const jsonData = {
		'ToUserName': FromUserName,
		'FromUserName': ToUserName,
		'CreateTime': Math.floor(Date.now() / 1000),
		'MsgType': 'text',
		'Content': rsg,
	};
	const xmlRsg = await buildXml(jsonData);
	return xmlRsg
};

async function initUser(_id, mp_openid) {
	const res = await user.where({
		'mp_openid': mp_openid
	}).get();
	if (res.affectedDocs > 0) {
		return [200, res.data[0]];
	} else {
		if (_id) {
			const res = await user.doc(_id).update({
				'mp_openid': mp_openid
			});
			return [404, '身份绑定成功，请尽情分享你的表情包'];
		}
	}
	return [404, '请点击下方文字打开小程序，绑定身份\n\n#小程序://旧梦影视/ksbDGmoMmoE8DyH'];
}

// let echostr = event.queryStringParameters.echostr

async function uploadEmoji(id) {
	const emojiUrl = `https://mp.weixin.qq.com/cgi-bin/getimgdata?msgid=${id}&mode=small&source=&fileId=&ow=1895619345&token=341235274&lang=zh_CN`;
	const headers = {
		'Cookie': MCOOKIE,
		'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36'
	};
	const buffer = await uniCloud.httpclient.request(emojiUrl, {
		method: 'GET',
		headers
	});
	let emojiData = await uniCloud.uploadFile({
		cloudPath: 'emoji/' + id + '.jpg',
		fileContent: buffer.data,
		cloudPathAsRealPath: true,
	});
	const {fileID=''} = emojiData;
	return fileID;
}

async function userEmojiInsert(_id, url) {
	let res = await user.doc(_id).update({
		emojiList: dbCmd.unshift(url)
	});
	return res;
}

// 构造xml
async function buildXml(jsonData) {
  let xml = '<xml>';
  for (const [key, value] of Object.entries(jsonData)) {
    xml += `\n<${key}><![CDATA[${value}]]></${key}>`;
  }
  xml += '\n</xml>';
  return xml;
}

async function getAllMsg(FromUserName) {
	const api = `https://mp.weixin.qq.com/cgi-bin/singlesendpage?action=index&tofakeid=${FromUserName}&lastmsgid=&token=341235274&lang=zh_CN&f=json&ajax=1`;
	const headers = {
		'Cookie': MCOOKIE,
		'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36'
	}
	const data = await mycurl(api, headers)
	if (!data) {
		return;
	}
	return data['page_info']['msg_items']['msg_item'];
}

async function mycurl(url, headers=[], data='', getres=false) {
	try {
		let method = 'POST'
		if (!data) {
			method = 'GET'
		}
		if (!headers) {
			headers = {
				'Referer': 'never',
				'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36'
			}
		}
	    const response = await axios({
			url,
			method,
			headers
	    });
		if (getres) {
			return response;
		}
	    return response.data; // 返回访问的内容
	} catch (error) {
	    console.error('mycurlError', error);
	    return;
	}
}

// /**
//  * 解析 XML
//  * @param {string} xml - 要解析的 XML 字符串
//  * @returns {Promise<object>} - 解析后的对象
//  */

// async function parseXML(xml) {
//   const parser = new xml2js.Parser({ explicitArray: false, ignoreAttrs: true });
//   return new Promise((resolve, reject) => {
//     parser.parseString(xml, (err, result) => {
//       if (err) {
//         reject(err);
//       } else {
//         resolve(result);
//       }
//     });
//   });
// }

// xml解析案例
// const xml = `
// 	<xml>
// 	  <ToUserName><![CDATA[gh_c4aad5bf78e3]]></ToUserName>
// 	  <FromUserName><![CDATA[o7iQDj8iJBEnKQTYaP1u3uctphaA]]></FromUserName>
// 	  <CreateTime>1692445144</CreateTime>
// 	  <MsgType><![CDATA[text]]></MsgType>
// 	  <Content><![CDATA[【收到不支持的消息类型，暂无法显示】]]></Content>
// 	  <MsgId>24229987225435610</MsgId>
// 	</xml>
// 	`;