'use strict';
const db = uniCloud.database();
const user = db.collection('user');
const dbCmd = db.command;

exports.main = async (event, context) => {
	const {code=''} = event;
	if (!code) {
		return;
	}
	let wxData = await login(code);
	if (!wxData.openid) {
		return;
	}
	const init_user_res = await initUser(wxData);
	if (init_user_res != 404) {
		return {
			code: 200,
			data: init_user_res,
			msg: '登录成功'
		}
	} else {
		return {
			code: 404,
			msg: '登录失败'
		}
	}
};

async function login(code) {
	const mp_appid = 'wx29329fca24967336';
	const mp_appsecret = 'a0347169cae5dafef48a53862873bb04';
	const api = `https://api.weixin.qq.com/sns/jscode2session?appid=${mp_appid}&secret=${mp_appsecret}&js_code=${code}&grant_type=authorization_code`;
	const res = await uniCloud.httpclient.request(api, {
		dataType: 'json',
		method: "GET",
		contentType: 'json',
	})
	const {session_key='', openid='', unionid=''} = res.data;
	return {
		session_key,
		openid,
		unionid
	}
}

async function initUser(wxData) {
	const userSearchRes = await user.where({
		'openid': wxData.openid
	}).get();
	if (userSearchRes.affectedDocs > 0) {
		return userSearchRes.data[0];
	} else {
		const add_time = Date.now();
		let userInfo = {
			mp_openid: '',
			add_time,
			emojiList: [],
			openid: wxData.openid,
			unionid: wxData.unionid,
		}
		const add_res = await user.add(userInfo);
		if (add_res.id) {
			userInfo['_id'] = add_res.id;
			return userInfo;
		}
	}
	return 404;
}